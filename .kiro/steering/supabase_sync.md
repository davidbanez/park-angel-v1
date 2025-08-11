---
inclusion: always
---

# Supabase Database Synchronization Guidelines

## Database Schema Management
- All database schema changes must be implemented through Supabase migrations in `packages/shared/supabase/migrations/`
- Never modify database schema directly in production - always use migration files
- Migration files should follow the naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Test migrations locally before applying to production environments

## Type Safety & Code Generation
- Keep TypeScript types in `packages/shared/src/types/database.ts` synchronized with actual database schema
- Regenerate Supabase types after schema changes using `supabase gen types typescript`
- Ensure all database operations use properly typed interfaces

## RLS (Row Level Security) Policies
- All tables must have appropriate RLS policies defined in migration files
- Test RLS policies thoroughly to ensure proper access control
- Document policy logic in comments within migration files

## Environment Synchronization
- Verify that local development, staging, and production databases have consistent schemas
- Use `packages/shared/scripts/verify-database.ts` to validate database state
- Run database verification scripts after major schema changes

## Migration Best Practices
- Write reversible migrations when possible
- Include data migration scripts for structural changes
- Test migrations against realistic data volumes
- Document breaking changes and required application updates