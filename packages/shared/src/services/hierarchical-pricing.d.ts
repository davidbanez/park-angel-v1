import { SupabaseClient } from '@supabase/supabase-js';
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
export declare class HierarchicalPricingService {
    private supabase;
    constructor(supabase: SupabaseClient);
    getPricingHierarchy(locationId: string): Promise<PricingHierarchyNode>;
    updatePricing(request: PricingUpdateRequest): Promise<void>;
    removePricing(hierarchyLevel: HierarchyLevel, id: string): Promise<void>;
    getEffectivePricing(hierarchyLevel: HierarchyLevel, id: string): Promise<PricingInheritanceResult>;
    copyPricingToChildren(hierarchyLevel: HierarchyLevel, id: string, overrideExisting?: boolean): Promise<void>;
    getDiscountConfigurations(operatorId?: string): Promise<DiscountConfiguration[]>;
    createDiscountConfiguration(discount: Omit<DiscountConfiguration, 'id'>, createdBy: string): Promise<DiscountConfiguration>;
    updateDiscountConfiguration(id: string, updates: Partial<Omit<DiscountConfiguration, 'id'>>): Promise<void>;
    deleteDiscountConfiguration(id: string): Promise<void>;
    private buildHierarchyTreeFromJson;
    private calculateEffectivePricing;
    private getNodeHierarchy;
    private getDirectChildren;
    private recalculateChildrenPricing;
    private getTableNameForHierarchy;
    private getChildLevel;
    private getDefaultPricing;
}
