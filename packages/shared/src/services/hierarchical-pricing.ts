import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PricingConfig, CreatePricingConfigData } from '../models/pricing';

export type HierarchyLevel = 'location' | 'section' | 'zone' | 'spot';

export interface PricingHierarchyNode {
  id: string;
  name: string;
  level: HierarchyLevel;
  parentId?: string;
  pricingConfig?: PricingConfig;
  children?: PricingHierarchyNode[];
  effectivePricing?: PricingConfig;
}

export interface DiscountConfiguration {
  id: string;
  name: string;
  type: 'senior' | 'pwd' | 'custom';
  percentage: number;
  isVATExempt: boolean;
  conditions: Record<string, any>;
  isActive: boolean;
  operatorId?: string;
}

export interface PricingUpdateRequest {
  hierarchyLevel: HierarchyLevel;
  id: string;
  pricingConfig: CreatePricingConfigData;
}

export interface PricingInheritanceResult {
  level: HierarchyLevel;
  id: string;
  name: string;
  ownPricing?: PricingConfig;
  inheritedPricing?: PricingConfig;
  effectivePricing: PricingConfig;
  source: 'own' | 'inherited' | 'default';
}

export class HierarchicalPricingService {
  constructor(private supabase: SupabaseClient) {}

  async getPricingHierarchy(locationId: string): Promise<PricingHierarchyNode> {
    const { data, error } = await this.supabase
      .rpc('get_pricing_hierarchy', { location_id: locationId });

    if (error) throw new Error(`Failed to get pricing hierarchy: ${error.message}`);

    return this.buildHierarchyTreeFromJson(data);
  }

  async updatePricing(request: PricingUpdateRequest): Promise<void> {
    const tableName = this.getTableNameForHierarchy(request.hierarchyLevel);
    const pricingConfig = PricingConfig.create(request.pricingConfig);

    const { error } = await this.supabase
      .from(tableName)
      .update({
        pricing_config: pricingConfig.toJSON(),
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) throw new Error(`Failed to update pricing: ${error.message}`);

    // Trigger recalculation of effective pricing for all children
    await this.recalculateChildrenPricing(request.hierarchyLevel, request.id);
  }

  async removePricing(hierarchyLevel: HierarchyLevel, id: string): Promise<void> {
    const tableName = this.getTableNameForHierarchy(hierarchyLevel);

    const { error } = await this.supabase
      .from(tableName)
      .update({
        pricing_config: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to remove pricing: ${error.message}`);

    // Trigger recalculation of effective pricing for all children
    await this.recalculateChildrenPricing(hierarchyLevel, id);
  }

  async getEffectivePricing(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingInheritanceResult> {
    const hierarchy = await this.getNodeHierarchy(hierarchyLevel, id);
    
    // Find the most specific pricing configuration
    let effectivePricing: PricingConfig | undefined;
    let source: 'own' | 'inherited' | 'default' = 'default';
    let ownPricing: PricingConfig | undefined;

    // Check own pricing first
    const currentNode = hierarchy.find(node => node.id === id);
    if (currentNode?.pricingConfig) {
      ownPricing = currentNode.pricingConfig;
      effectivePricing = currentNode.pricingConfig;
      source = 'own';
    } else {
      // Look for inherited pricing from parents
      for (let i = hierarchy.length - 1; i >= 0; i--) {
        if (hierarchy[i].pricingConfig) {
          effectivePricing = hierarchy[i].pricingConfig;
          source = 'inherited';
          break;
        }
      }
    }

    // Use default pricing if none found
    if (!effectivePricing) {
      effectivePricing = this.getDefaultPricing();
      source = 'default';
    }

    return {
      level: hierarchyLevel,
      id,
      name: currentNode?.name || '',
      ownPricing,
      inheritedPricing: source === 'inherited' ? effectivePricing : undefined,
      effectivePricing,
      source
    };
  }

  async copyPricingToChildren(hierarchyLevel: HierarchyLevel, id: string, overrideExisting: boolean = false): Promise<void> {
    const parentPricing = await this.getEffectivePricing(hierarchyLevel, id);
    const children = await this.getDirectChildren(hierarchyLevel, id);

    for (const child of children) {
      // Skip if child already has pricing and we're not overriding
      if (!overrideExisting && child.pricingConfig) {
        continue;
      }

      await this.updatePricing({
        hierarchyLevel: child.level,
        id: child.id,
        pricingConfig: {
          baseRate: parentPricing.effectivePricing.baseRate.value,
          vehicleTypeRates: parentPricing.effectivePricing.vehicleTypeRates.map(vtr => ({
            vehicleType: vtr.vehicleType,
            rate: vtr.rate.value
          })),
          timeBasedRates: parentPricing.effectivePricing.timeBasedRates.map(tbr => ({
            dayOfWeek: tbr.dayOfWeek,
            startTime: tbr.getStartTime(),
            endTime: tbr.getEndTime(),
            multiplier: tbr.multiplier,
            name: tbr.name
          })),
          holidayRates: parentPricing.effectivePricing.holidayRates.map(hr => ({
            name: hr.name,
            date: hr.date,
            multiplier: hr.multiplier,
            isRecurring: hr.isRecurring
          })),
          occupancyMultiplier: parentPricing.effectivePricing.occupancyMultiplier,
          vatRate: parentPricing.effectivePricing.vatRate.value
        }
      });
    }
  }

  async getDiscountConfigurations(operatorId?: string): Promise<DiscountConfiguration[]> {
    let query = this.supabase
      .from('discount_rules')
      .select('*')
      .eq('is_active', true);

    if (operatorId) {
      query = query.or(`operator_id.eq.${operatorId},operator_id.is.null`);
    } else {
      query = query.is('operator_id', null);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get discount configurations: ${error.message}`);

    return data.map((rule: any) => ({
      id: rule.id as string,
      name: rule.name as string,
      type: rule.type as 'senior' | 'pwd' | 'custom',
      percentage: parseFloat(rule.percentage),
      isVATExempt: rule.is_vat_exempt as boolean,
      conditions: rule.conditions || {},
      isActive: rule.is_active as boolean,
      operatorId: rule.operator_id as string | undefined
    }));
  }

  async createDiscountConfiguration(
    discount: Omit<DiscountConfiguration, 'id'>,
    createdBy: string
  ): Promise<DiscountConfiguration> {
    const { data, error } = await this.supabase
      .from('discount_rules')
      .insert({
        name: discount.name,
        type: discount.type,
        percentage: discount.percentage,
        is_vat_exempt: discount.isVATExempt,
        conditions: discount.conditions,
        operator_id: discount.operatorId,
        is_active: discount.isActive,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create discount configuration: ${error.message}`);

    return {
      id: data.id as string,
      name: data.name as string,
      type: data.type as 'senior' | 'pwd' | 'custom',
      percentage: parseFloat(data.percentage),
      isVATExempt: data.is_vat_exempt as boolean,
      conditions: data.conditions || {},
      isActive: data.is_active as boolean,
      operatorId: data.operator_id as string | undefined
    };
  }

  async updateDiscountConfiguration(
    id: string,
    updates: Partial<Omit<DiscountConfiguration, 'id'>>
  ): Promise<void> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.percentage !== undefined) updateData.percentage = updates.percentage;
    if (updates.isVATExempt !== undefined) updateData.is_vat_exempt = updates.isVATExempt;
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await this.supabase
      .from('discount_rules')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update discount configuration: ${error.message}`);
  }

  async deleteDiscountConfiguration(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('discount_rules')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete discount configuration: ${error.message}`);
  }

  private buildHierarchyTreeFromJson(locationData: any): PricingHierarchyNode {
    const location: PricingHierarchyNode = {
      id: locationData.id,
      name: locationData.name,
      level: 'location',
      pricingConfig: locationData.pricing_config ? PricingConfig.create(locationData.pricing_config) : undefined,
      children: []
    };

    for (const sectionData of locationData.sections || []) {
      const section: PricingHierarchyNode = {
        id: sectionData.id,
        name: sectionData.name,
        level: 'section',
        parentId: location.id,
        pricingConfig: sectionData.pricing_config ? PricingConfig.create(sectionData.pricing_config) : undefined,
        children: []
      };

      for (const zoneData of sectionData.zones || []) {
        const zone: PricingHierarchyNode = {
          id: zoneData.id,
          name: zoneData.name,
          level: 'zone',
          parentId: section.id,
          pricingConfig: zoneData.pricing_config ? PricingConfig.create(zoneData.pricing_config) : undefined,
          children: []
        };

        for (const spotData of zoneData.parking_spots || []) {
          const spot: PricingHierarchyNode = {
            id: spotData.id,
            name: spotData.number,
            level: 'spot',
            parentId: zone.id,
            pricingConfig: spotData.pricing_config ? PricingConfig.create(spotData.pricing_config) : undefined
          };

          zone.children!.push(spot);
        }

        section.children!.push(zone);
      }

      location.children!.push(section);
    }

    // Calculate effective pricing for all nodes
    this.calculateEffectivePricing(location);

    return location;
  }

  private calculateEffectivePricing(node: PricingHierarchyNode, parentPricing?: PricingConfig): void {
    // Use own pricing if available, otherwise inherit from parent
    node.effectivePricing = node.pricingConfig || parentPricing || this.getDefaultPricing();

    // Recursively calculate for children
    if (node.children) {
      for (const child of node.children) {
        this.calculateEffectivePricing(child, node.effectivePricing);
      }
    }
  }

  private async getNodeHierarchy(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingHierarchyNode[]> {
    // Simplified implementation for now
    const hierarchy: PricingHierarchyNode[] = [];
    
    // Mock implementation - in real scenario, this would query the database properly
    hierarchy.push({
      id,
      name: 'Mock Node',
      level: hierarchyLevel,
      pricingConfig: undefined
    });

    return hierarchy;
  }

  private async getDirectChildren(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingHierarchyNode[]> {
    let query: any;
    
    switch (hierarchyLevel) {
      case 'location':
        query = this.supabase
          .from('sections')
          .select('id, name, pricing_config')
          .eq('location_id', id);
        break;
      case 'section':
        query = this.supabase
          .from('zones')
          .select('id, name, pricing_config')
          .eq('section_id', id);
        break;
      case 'zone':
        query = this.supabase
          .from('parking_spots')
          .select('id, number as name, pricing_config')
          .eq('zone_id', id);
        break;
      case 'spot':
        return []; // Spots have no children
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get children: ${error.message}`);

    const childLevel = this.getChildLevel(hierarchyLevel);
    
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      level: childLevel,
      parentId: id,
      pricingConfig: item.pricing_config ? PricingConfig.create(item.pricing_config) : undefined
    }));
  }

  private async recalculateChildrenPricing(hierarchyLevel: HierarchyLevel, id: string): Promise<void> {
    // This would trigger a background job to recalculate effective pricing
    // For now, we'll just mark that recalculation is needed
    // In a production system, this would use a job queue
    console.log(`Pricing recalculation needed for ${hierarchyLevel} ${id} and its children`);
  }

  private getTableNameForHierarchy(level: HierarchyLevel): string {
    switch (level) {
      case 'location': return 'locations';
      case 'section': return 'sections';
      case 'zone': return 'zones';
      case 'spot': return 'parking_spots';
      default: throw new Error(`Invalid hierarchy level: ${level}`);
    }
  }

  private getChildLevel(level: HierarchyLevel): HierarchyLevel {
    switch (level) {
      case 'location': return 'section';
      case 'section': return 'zone';
      case 'zone': return 'spot';
      default: throw new Error(`Level ${level} has no children`);
    }
  }

  private getDefaultPricing(): PricingConfig {
    return PricingConfig.create({
      baseRate: 50, // Default PHP 50 per hour
      vatRate: 12,
      occupancyMultiplier: 1.0,
    });
  }
}