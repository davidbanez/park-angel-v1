# Park Angel Database Schema

This directory contains the complete database schema and utilities for the Park Angel parking management system.

## Overview

The Park Angel database is built on PostgreSQL using Supabase as the backend service. It implements a comprehensive parking management system with support for:

- **Hierarchical Parking Structure**: Location → Section → Zone → Spot
- **Multiple Parking Types**: Hosted, Street, and Facility parking
- **Advanced Pricing System**: Hierarchical pricing with inheritance and dynamic adjustments
- **Discount Management**: Senior Citizen, PWD, and custom discounts with VAT handling
- **Revenue Sharing**: Automated revenue calculations for operators and hosts
- **Comprehensive Audit Logging**: Full audit trail for all system operations
- **Real-time Features**: Live updates for parking availability and bookings

## Files

### Core Schema Files

- **`schema.sql`** - Main database schema with all tables, indexes, triggers, and constraints
- **`utils.sql`** - Utility functions for common database operations
- **`rls-policies.sql`** - Row Level Security policies for data access control
- **`setup-complete.sql`** - Complete setup script that includes schema, utilities, and initial data

### Setup and Verification

- **`../scripts/setup-supabase.ts`** - TypeScript setup script for automated database deployment
- **`../scripts/verify-setup.ts`** - Verification script to validate database setup

## Database Architecture

### Parking Hierarchy

The system uses a four-level hierarchy for organizing parking spaces:

```
Location (Parking Facility/Street/Hosted Area)
├── Section (Floor/Area)
    ├── Zone (Specific Area within Section)
        ├── Spot (Individual Parking Space)
```

### Key Features

#### 1. Hierarchical Pricing

- Pricing can be set at any level (Location, Section, Zone, or Spot)
- Child elements inherit parent pricing unless specifically overridden
- Dynamic pricing based on occupancy, time, vehicle type, and holidays

#### 2. Discount System

- Built-in Senior Citizen and PWD discounts with VAT exemption
- Custom discount rules with configurable percentages
- Automatic discount application and verification tracking

#### 3. Revenue Sharing

- Automated revenue calculations for different parking types
- Configurable commission rates for operators and hosts
- Detailed transaction logging and payout tracking

#### 4. User Management

- Role-based access control with user groups
- Granular permissions for different system features
- Support for multiple user types (Client, Host, Operator, Admin, POS)

#### 5. Messaging and Rating System

- Secure, encrypted messaging between users
- Comprehensive rating system for spots, hosts, and operators
- Review moderation and reputation management

## Tables Overview

### Core Tables

| Table           | Purpose                                     |
| --------------- | ------------------------------------------- |
| `users`         | User accounts (extends Supabase auth.users) |
| `user_profiles` | User profile information                    |
| `user_groups`   | Role-based access control groups            |
| `locations`     | Top-level parking locations                 |
| `sections`      | Second-level parking areas                  |
| `zones`         | Third-level parking zones                   |
| `parking_spots` | Individual parking spaces                   |

### Business Logic Tables

| Table             | Purpose                           |
| ----------------- | --------------------------------- |
| `bookings`        | Parking reservations and sessions |
| `vehicles`        | User vehicle information          |
| `hosted_listings` | Hosted parking space listings     |
| `discount_rules`  | Discount configuration            |
| `vat_config`      | VAT rate configuration            |
| `revenue_shares`  | Revenue sharing calculations      |

### Communication Tables

| Table           | Purpose                      |
| --------------- | ---------------------------- |
| `conversations` | Message conversation threads |
| `messages`      | Individual messages          |
| `ratings`       | User ratings and reviews     |
| `notifications` | System notifications         |

### System Tables

| Table                 | Purpose                     |
| --------------------- | --------------------------- |
| `system_config`       | System-wide configuration   |
| `audit_logs`          | Comprehensive audit trail   |
| `performance_metrics` | System performance tracking |
| `api_keys`            | Third-party API access keys |

## Key Functions

### Utility Functions

- **`get_parking_hierarchy(spot_uuid)`** - Get complete hierarchy for a parking spot
- **`get_effective_pricing(spot_uuid)`** - Calculate effective pricing with inheritance
- **`check_spot_availability(spot_uuid, start_time, end_time)`** - Check if a spot is available
- **`calculate_booking_amount(...)`** - Calculate booking amount with discounts and VAT
- **`calculate_operator_revenue_share(...)`** - Calculate revenue sharing
- **`get_parking_statistics(...)`** - Get parking utilization statistics

### Maintenance Functions

- **`cleanup_expired_bookings()`** - Clean up expired booking records
- **`maintain_database()`** - Perform routine database maintenance
- **`validate_database_integrity()`** - Check database integrity

## Data Integrity

### Constraints and Triggers

1. **Booking Validation**
   - Prevents overlapping bookings for the same spot
   - Ensures end time is after start time
   - Prevents bookings in the past

2. **Automatic Status Updates**
   - Updates parking spot status based on booking changes
   - Maintains data consistency across related tables

3. **VAT Configuration**
   - Ensures only one default VAT rate per operator
   - Validates VAT rate percentages

### Views

- **`parking_hierarchy_view`** - Complete parking hierarchy with effective pricing
- **`active_bookings_view`** - Active bookings with user and spot details
- **`revenue_analytics_view`** - Revenue analytics by date and parking type

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that:

- Allow users to access their own data
- Restrict operator access to their assigned locations
- Provide appropriate admin access levels
- Protect sensitive financial and personal information

### Data Encryption

- Sensitive data is encrypted at rest
- Messages can be encrypted end-to-end
- Payment information is tokenized

## Performance Optimization

### Indexes

The schema includes comprehensive indexes for:

- Primary and foreign key relationships
- Frequently queried columns (status, dates, user IDs)
- Composite indexes for complex queries
- Full-text search capabilities

### Query Optimization

- Materialized views for complex analytics
- Efficient pagination support
- Optimized joins across the parking hierarchy

## Setup Instructions

### 1. Environment Setup

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Database Setup

```bash
# Run the setup script
npm run setup:database

# Or manually run SQL files
psql -f schema.sql
psql -f utils.sql
```

### 3. Verification

```bash
# Verify the setup
npm run verify:database
```

## Migration Strategy

### Version Control

- All schema changes are versioned
- Migration scripts for schema updates
- Rollback procedures for failed migrations

### Data Migration

- Scripts for migrating existing data
- Validation procedures for data integrity
- Backup and restore procedures

## Monitoring and Maintenance

### Performance Monitoring

- Query performance tracking
- Index usage analysis
- Connection pool monitoring

### Regular Maintenance

- Automated cleanup of old records
- Statistics updates
- Index maintenance
- Backup verification

## API Integration

The database is designed to work seamlessly with:

- Supabase Auto-generated APIs
- Custom Edge Functions
- Real-time subscriptions
- Third-party integrations

## Development Guidelines

### Adding New Tables

1. Add table definition to `schema.sql`
2. Add appropriate indexes
3. Create RLS policies in `rls-policies.sql`
4. Update TypeScript types in `database.ts`
5. Add verification checks to `verify-setup.ts`

### Modifying Existing Tables

1. Create migration script
2. Update related functions and views
3. Update TypeScript types
4. Test with existing data
5. Update documentation

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check environment variables
   - Verify Supabase project status
   - Check network connectivity

2. **Permission Errors**
   - Review RLS policies
   - Check user authentication
   - Verify role assignments

3. **Performance Issues**
   - Analyze query execution plans
   - Check index usage
   - Review connection pool settings

### Support

For issues with the database schema or setup:

1. Check the verification script output
2. Review the audit logs
3. Check Supabase dashboard for errors
4. Consult the troubleshooting guide

## Contributing

When contributing to the database schema:

1. Follow the established naming conventions
2. Add appropriate documentation
3. Include migration scripts
4. Update verification tests
5. Test with sample data
