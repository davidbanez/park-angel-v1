/**
 * Example service demonstrating the new base service infrastructure
 * This serves as a template for migrating existing services to use ServiceResult pattern
 */

import { createClient } from '@supabase/supabase-js';
import { 
  AbstractBaseService, 
  ServiceResult, 
  ServiceErrorCode,
  PaginationParams,
  PaginatedResult 
} from './base-service';
import { 
  ValidationUtils, 
  EntityTypeGuards, 
  DatabaseTypeGuards 
} from './type-validation';

// Example entity interfaces
export interface ExampleEntity {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExampleEntityData {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UpdateExampleEntityData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Enhanced service interface using ServiceResult pattern
export interface EnhancedExampleService {
  // Enhanced methods with ServiceResult
  createEntity(data: CreateExampleEntityData): Promise<ServiceResult<ExampleEntity>>;
  getEntity(id: string): Promise<ServiceResult<ExampleEntity | null>>;
  updateEntity(id: string, data: UpdateExampleEntityData): Promise<ServiceResult<ExampleEntity>>;
  deleteEntity(id: string): Promise<ServiceResult<boolean>>;
  listEntities(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<ExampleEntity>>>;
  
  // Additional business logic methods
  activateEntity(id: string): Promise<ServiceResult<ExampleEntity>>;
  deactivateEntity(id: string): Promise<ServiceResult<ExampleEntity>>;
  searchEntities(query: string): Promise<ServiceResult<ExampleEntity[]>>;
}

// Type guard for the example entity
const isExampleEntity = (value: unknown): value is {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} => {
  return DatabaseTypeGuards.isValidDatabaseResult(value) &&
         DatabaseTypeGuards.hasStringProperty(value, 'id') &&
         DatabaseTypeGuards.hasStringProperty(value, 'name') &&
         DatabaseTypeGuards.hasStringProperty(value, 'description') &&
         DatabaseTypeGuards.hasBooleanProperty(value, 'is_active') &&
         DatabaseTypeGuards.hasDateProperty(value, 'created_at') &&
         DatabaseTypeGuards.hasDateProperty(value, 'updated_at');
};

/**
 * Enhanced service implementation demonstrating best practices
 */
export class EnhancedExampleServiceImpl 
  extends AbstractBaseService<ExampleEntity, CreateExampleEntityData, UpdateExampleEntityData>
  implements EnhancedExampleService {

  constructor(supabase: ReturnType<typeof createClient>) {
    super(supabase);
  }

  // Base service interface implementation
  async create(data: CreateExampleEntityData): Promise<ServiceResult<ExampleEntity>> {
    return this.createEntity(data);
  }

  async findById(id: string): Promise<ServiceResult<ExampleEntity | null>> {
    return this.getEntity(id);
  }

  async update(id: string, data: UpdateExampleEntityData): Promise<ServiceResult<ExampleEntity>> {
    return this.updateEntity(id, data);
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    return this.deleteEntity(id);
  }

  async list(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<ExampleEntity>>> {
    return this.listEntities(params);
  }

  // Enhanced service methods
  async createEntity(data: CreateExampleEntityData): Promise<ServiceResult<ExampleEntity>> {
    try {
      // Validate required fields
      const validation = this.validateRequired(data as Record<string, unknown>, [
        'name', 'description'
      ]);
      if (validation) {
        return validation as ServiceResult<ExampleEntity>;
      }

      const { data: entity, error } = await this.supabase
        .from('example_entities')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'create entity');
      }

      // Validate the returned data
      const entityValidation = ValidationUtils.validateDatabaseResult(
        entity,
        isExampleEntity,
        'example entity'
      );

      if (!entityValidation.isValid || !entityValidation.data) {
        return this.error(
          ServiceErrorCode.DATABASE_ERROR,
          'Invalid entity data returned from database',
          { validationErrors: entityValidation.errors }
        );
      }

      return this.success(this.mapEntity(entityValidation.data));
    } catch (error) {
      console.error('Error creating entity:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to create entity',
        undefined,
        error as Error
      );
    }
  }

  async getEntity(id: string): Promise<ServiceResult<ExampleEntity | null>> {
    try {
      if (!id) {
        return this.error(ServiceErrorCode.VALIDATION_ERROR, 'Entity ID is required');
      }

      const { data: entity, error } = await this.supabase
        .from('example_entities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return this.success(null);
        }
        return this.handleDatabaseError(error, 'get entity');
      }

      // Validate the returned data
      const entityValidation = ValidationUtils.validateDatabaseResult(
        entity,
        isExampleEntity,
        'example entity'
      );

      if (!entityValidation.isValid || !entityValidation.data) {
        return this.error(
          ServiceErrorCode.DATABASE_ERROR,
          'Invalid entity data returned from database',
          { validationErrors: entityValidation.errors }
        );
      }

      return this.success(this.mapEntity(entityValidation.data));
    } catch (error) {
      console.error('Error getting entity:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to get entity',
        undefined,
        error as Error
      );
    }
  }

  async updateEntity(id: string, data: UpdateExampleEntityData): Promise<ServiceResult<ExampleEntity>> {
    try {
      if (!id) {
        return this.error(ServiceErrorCode.VALIDATION_ERROR, 'Entity ID is required');
      }

      if (Object.keys(data).length === 0) {
        return this.error(ServiceErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: entity, error } = await this.supabase
        .from('example_entities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'update entity');
      }

      // Validate the returned data
      const entityValidation = ValidationUtils.validateDatabaseResult(
        entity,
        isExampleEntity,
        'example entity'
      );

      if (!entityValidation.isValid || !entityValidation.data) {
        return this.error(
          ServiceErrorCode.DATABASE_ERROR,
          'Invalid entity data returned from database',
          { validationErrors: entityValidation.errors }
        );
      }

      return this.success(this.mapEntity(entityValidation.data));
    } catch (error) {
      console.error('Error updating entity:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to update entity',
        undefined,
        error as Error
      );
    }
  }

  async deleteEntity(id: string): Promise<ServiceResult<boolean>> {
    try {
      if (!id) {
        return this.error(ServiceErrorCode.VALIDATION_ERROR, 'Entity ID is required');
      }

      const { error } = await this.supabase
        .from('example_entities')
        .delete()
        .eq('id', id);

      if (error) {
        return this.handleDatabaseError(error, 'delete entity');
      }

      return this.success(true);
    } catch (error) {
      console.error('Error deleting entity:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to delete entity',
        undefined,
        error as Error
      );
    }
  }

  async listEntities(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<ExampleEntity>>> {
    try {
      // Get total count
      const { count, error: countError } = await this.supabase
        .from('example_entities')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        return this.handleDatabaseError(countError, 'count entities');
      }

      // Get paginated data
      let query = this.supabase
        .from('example_entities')
        .select('*')
        .order('created_at', { ascending: false });

      query = this.applyPagination(query, params);

      const { data, error } = await query;

      if (error) {
        return this.handleDatabaseError(error, 'list entities');
      }

      // Validate and map results
      const entities: ExampleEntity[] = [];
      for (const item of data || []) {
        const validation = ValidationUtils.validateDatabaseResult(
          item,
          isExampleEntity,
          'example entity'
        );

        if (validation.isValid && validation.data) {
          entities.push(this.mapEntity(validation.data));
        }
      }

      const paginatedResult = this.createPaginatedResult(
        entities,
        count || 0,
        params?.page,
        params?.limit
      );

      return this.success(paginatedResult);
    } catch (error) {
      console.error('Error listing entities:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to list entities',
        undefined,
        error as Error
      );
    }
  }

  async activateEntity(id: string): Promise<ServiceResult<ExampleEntity>> {
    return this.updateEntity(id, { isActive: true });
  }

  async deactivateEntity(id: string): Promise<ServiceResult<ExampleEntity>> {
    return this.updateEntity(id, { isActive: false });
  }

  async searchEntities(query: string): Promise<ServiceResult<ExampleEntity[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return this.error(ServiceErrorCode.VALIDATION_ERROR, 'Search query is required');
      }

      const { data, error } = await this.supabase
        .from('example_entities')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return this.handleDatabaseError(error, 'search entities');
      }

      // Validate and map results
      const entities: ExampleEntity[] = [];
      for (const item of data || []) {
        const validation = ValidationUtils.validateDatabaseResult(
          item,
          isExampleEntity,
          'example entity'
        );

        if (validation.isValid && validation.data) {
          entities.push(this.mapEntity(validation.data));
        }
      }

      return this.success(entities);
    } catch (error) {
      console.error('Error searching entities:', error);
      return this.error(
        ServiceErrorCode.UNKNOWN_ERROR,
        'Failed to search entities',
        undefined,
        error as Error
      );
    }
  }

  // Helper method to map database result to entity
  private mapEntity(data: any): ExampleEntity {
    return {
      id: ValidationUtils.safeExtractString(data, 'id'),
      name: ValidationUtils.safeExtractString(data, 'name'),
      description: ValidationUtils.safeExtractString(data, 'description'),
      isActive: ValidationUtils.safeExtractBoolean(data, 'is_active', true),
      createdAt: ValidationUtils.safeExtractDate(data, 'created_at') || new Date(),
      updatedAt: ValidationUtils.safeExtractDate(data, 'updated_at') || new Date(),
    };
  }
}

/**
 * Legacy service interface for backward compatibility
 * This shows how existing services can coexist with enhanced services
 */
export interface LegacyExampleService {
  createEntity(data: CreateExampleEntityData): Promise<ExampleEntity>;
  getEntity(id: string): Promise<ExampleEntity | null>;
  updateEntity(id: string, data: UpdateExampleEntityData): Promise<ExampleEntity>;
  deleteEntity(id: string): Promise<void>;
  listEntities(): Promise<ExampleEntity[]>;
}

/**
 * Adapter that wraps the enhanced service to provide legacy interface
 * This demonstrates how to maintain backward compatibility
 */
export class LegacyExampleServiceAdapter implements LegacyExampleService {
  constructor(private enhancedService: EnhancedExampleService) {}

  async createEntity(data: CreateExampleEntityData): Promise<ExampleEntity> {
    const result = await this.enhancedService.createEntity(data);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create entity');
    }
    return result.data!;
  }

  async getEntity(id: string): Promise<ExampleEntity | null> {
    const result = await this.enhancedService.getEntity(id);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get entity');
    }
    return result.data!;
  }

  async updateEntity(id: string, data: UpdateExampleEntityData): Promise<ExampleEntity> {
    const result = await this.enhancedService.updateEntity(id, data);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update entity');
    }
    return result.data!;
  }

  async deleteEntity(id: string): Promise<void> {
    const result = await this.enhancedService.deleteEntity(id);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete entity');
    }
  }

  async listEntities(): Promise<ExampleEntity[]> {
    const result = await this.enhancedService.listEntities();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to list entities');
    }
    return result.data!.items;
  }
}

/**
 * Factory function to create service instances
 */
export function createExampleServices(supabase: ReturnType<typeof createClient>) {
  const enhancedService = new EnhancedExampleServiceImpl(supabase);
  const legacyService = new LegacyExampleServiceAdapter(enhancedService);
  
  return {
    enhanced: enhancedService,
    legacy: legacyService,
  };
}