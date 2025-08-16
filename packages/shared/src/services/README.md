# Service Layer Infrastructure

This document describes the enhanced service layer infrastructure that provides consistent error handling, type validation, and service patterns across the Park Angel system.

## Overview

The service layer has been enhanced with:

1. **Base Service Interface** - Standardized CRUD operations with proper typing
2. **ServiceResult Pattern** - Consistent error handling and result wrapping
3. **Runtime Type Validation** - Type guards and validation utilities for database results
4. **Backward Compatibility** - Adapters to maintain existing service interfaces

## Core Components

### BaseService Interface

All services can extend the `AbstractBaseService` class to get standardized CRUD operations:

```typescript
import { AbstractBaseService, ServiceResult } from './base-service';

class MyService extends AbstractBaseService<Entity, CreateData, UpdateData> {
  constructor(supabase: ReturnType<typeof createClient>) {
    super(supabase);
  }

  // Implement required methods
  async create(data: CreateData): Promise<ServiceResult<Entity>> { ... }
  async findById(id: string): Promise<ServiceResult<Entity | null>> { ... }
  async update(id: string, data: UpdateData): Promise<ServiceResult<Entity>> { ... }
  async delete(id: string): Promise<ServiceResult<boolean>> { ... }
  async list(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<Entity>>> { ... }
}
```

### ServiceResult Pattern

All enhanced services return `ServiceResult<T>` instead of throwing exceptions:

```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

// Usage
const result = await service.createEntity(data);
if (result.success) {
  console.log('Created:', result.data);
} else {
  console.error('Error:', result.error?.message);
}
```

### Type Validation

Runtime type validation ensures database results match expected types:

```typescript
import { ValidationUtils, DatabaseTypeGuards } from './type-validation';

// Validate database result
const validation = ValidationUtils.validateDatabaseResult(
  dbResult,
  isMyEntityType,
  'my entity'
);

if (validation.isValid && validation.data) {
  // Safe to use validation.data
}
```

## Migration Guide

### Step 1: Create Enhanced Service Interface

```typescript
// Define enhanced interface with ServiceResult
export interface EnhancedMyService {
  createEntity(data: CreateData): Promise<ServiceResult<Entity>>;
  getEntity(id: string): Promise<ServiceResult<Entity | null>>;
  // ... other methods
}
```

### Step 2: Implement Enhanced Service

```typescript
export class EnhancedMyServiceImpl 
  extends AbstractBaseService<Entity, CreateData, UpdateData>
  implements EnhancedMyService {
  
  async createEntity(data: CreateData): Promise<ServiceResult<Entity>> {
    try {
      // Validate input
      const validation = this.validateRequired(data, ['requiredField']);
      if (validation) return validation;

      // Database operation
      const { data: result, error } = await this.supabase
        .from('my_table')
        .insert(data)
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError(error, 'create entity');
      }

      // Validate result
      const entityValidation = ValidationUtils.validateDatabaseResult(
        result,
        isMyEntityType,
        'my entity'
      );

      if (!entityValidation.isValid) {
        return this.error(ServiceErrorCode.DATABASE_ERROR, 'Invalid data');
      }

      return this.success(this.mapEntity(entityValidation.data));
    } catch (error) {
      return this.error(ServiceErrorCode.UNKNOWN_ERROR, 'Failed to create entity');
    }
  }
}
```

### Step 3: Create Backward Compatibility Adapter

```typescript
export class LegacyMyServiceAdapter implements LegacyMyService {
  constructor(private enhancedService: EnhancedMyService) {}

  async createEntity(data: CreateData): Promise<Entity> {
    const result = await this.enhancedService.createEntity(data);
    if (!result.success) {
      throw new Error(result.error?.message || 'Operation failed');
    }
    return result.data!;
  }
}
```

### Step 4: Update Service Factory

```typescript
export function createMyServices(supabase: ReturnType<typeof createClient>) {
  const enhancedService = new EnhancedMyServiceImpl(supabase);
  const legacyService = new LegacyMyServiceAdapter(enhancedService);
  
  return {
    enhanced: enhancedService,
    legacy: legacyService,
  };
}
```

## Error Handling

### Service Error Codes

```typescript
enum ServiceErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  // ... more codes
}
```

### Error Handling Patterns

```typescript
// Check result success
if (ServiceResultUtils.isSuccess(result)) {
  // Use result.data safely
}

// Extract data or throw
const data = ServiceResultUtils.unwrap(result);

// Extract data or use default
const data = ServiceResultUtils.unwrapOr(result, defaultValue);

// Transform successful results
const transformedResult = ServiceResultUtils.map(result, data => transform(data));

// Chain operations
const chainedResult = await ServiceResultUtils.flatMap(result, async data => {
  return await nextOperation(data);
});
```

## Type Validation

### Built-in Type Guards

```typescript
// Database result validation
DatabaseTypeGuards.isValidDatabaseResult(value)
DatabaseTypeGuards.hasStringProperty(obj, 'propertyName')
DatabaseTypeGuards.hasNumberProperty(obj, 'propertyName')
DatabaseTypeGuards.hasBooleanProperty(obj, 'propertyName')

// Entity type guards
EntityTypeGuards.isUser(value)
EntityTypeGuards.isParkingSpot(value)
EntityTypeGuards.isBooking(value)
```

### Custom Type Guards

```typescript
const isMyEntity = (value: unknown): value is MyEntityDBResult => {
  return DatabaseTypeGuards.isValidDatabaseResult(value) &&
         DatabaseTypeGuards.hasStringProperty(value, 'id') &&
         DatabaseTypeGuards.hasStringProperty(value, 'name');
};
```

### Safe Property Access

```typescript
// Safe extraction with defaults
const name = ValidationUtils.safeExtractString(obj, 'name', 'Unknown');
const count = ValidationUtils.safeExtractNumber(obj, 'count', 0);
const isActive = ValidationUtils.safeExtractBoolean(obj, 'is_active', false);
const date = ValidationUtils.safeExtractDate(obj, 'created_at');
```

## Best Practices

### 1. Always Validate Input

```typescript
async createEntity(data: CreateData): Promise<ServiceResult<Entity>> {
  // Validate required fields
  const validation = this.validateRequired(data, ['name', 'email']);
  if (validation) return validation;
  
  // Continue with operation...
}
```

### 2. Handle Database Errors Consistently

```typescript
const { data, error } = await this.supabase.from('table').select();

if (error) {
  return this.handleDatabaseError(error, 'operation description');
}
```

### 3. Validate Database Results

```typescript
const validation = ValidationUtils.validateDatabaseResult(
  dbResult,
  typeGuard,
  'entity name'
);

if (!validation.isValid) {
  return this.error(ServiceErrorCode.DATABASE_ERROR, 'Invalid data');
}
```

### 4. Use Pagination for Lists

```typescript
async list(params?: PaginationParams): Promise<ServiceResult<PaginatedResult<Entity>>> {
  // Get total count
  const { count } = await this.supabase.from('table').select('*', { count: 'exact', head: true });
  
  // Apply pagination
  let query = this.supabase.from('table').select('*');
  query = this.applyPagination(query, params);
  
  // Return paginated result
  const paginatedResult = this.createPaginatedResult(items, count, params?.page, params?.limit);
  return this.success(paginatedResult);
}
```

### 5. Maintain Backward Compatibility

When migrating existing services:

1. Create enhanced version with ServiceResult
2. Keep original interface unchanged
3. Create adapter for backward compatibility
4. Gradually migrate consumers to enhanced version

## Example Implementation

See `example-enhanced-service.ts` for a complete example demonstrating:

- Base service extension
- ServiceResult pattern usage
- Type validation
- Error handling
- Backward compatibility adapter
- Service factory pattern

## Testing

### Testing Enhanced Services

```typescript
describe('EnhancedMyService', () => {
  it('should return success result for valid data', async () => {
    const result = await service.createEntity(validData);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should return error result for invalid data', async () => {
    const result = await service.createEntity(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
  });
});
```

### Testing Type Validation

```typescript
describe('Type Validation', () => {
  it('should validate correct entity structure', () => {
    const validation = ValidationUtils.validateDatabaseResult(
      validDbResult,
      isMyEntity,
      'my entity'
    );
    
    expect(validation.isValid).toBe(true);
    expect(validation.data).toBeDefined();
  });
});
```

This infrastructure provides a solid foundation for building robust, type-safe services with consistent error handling and validation patterns.