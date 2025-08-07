# Park Angel Shared Package

This package contains shared types, utilities, and services for the Park Angel parking management system.

## Features

- **Supabase Integration**: Complete setup for database, authentication, storage, and real-time features
- **Authentication Service**: Email, Google, and Facebook OAuth support with MFA
- **Storage Service**: File upload and management with multiple buckets
- **Real-time Service**: WebSocket subscriptions for live updates
- **Type Safety**: Full TypeScript support with generated database types
- **Row Level Security**: Comprehensive RLS policies for data protection

## Setup

### 1. Environment Variables

Copy the `.env.example` file to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations)

### 2. Database Setup

Run the setup script to initialize your Supabase backend:

```bash
npm run setup:supabase
```

This will:

- Create the database schema
- Apply Row Level Security policies
- Set up storage buckets
- Configure authentication providers
- Enable real-time subscriptions

### 3. Generate Types

Generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Usage

### Authentication

```typescript
import { AuthService } from '@park-angel/shared';

// Sign up with email
const { user, error } = await AuthService.signUp({
  email: 'user@example.com',
  password: 'password',
  firstName: 'John',
  lastName: 'Doe',
  userType: 'client',
});

// Sign in with Google
await AuthService.signInWithGoogle();

// Sign out
await AuthService.signOut();
```

### Storage

```typescript
import { StorageService } from '@park-angel/shared';

// Upload a file
const result = await StorageService.uploadFile({
  bucket: StorageService.BUCKETS.AVATARS,
  path: 'user-123/avatar.jpg',
  file: fileBlob,
  contentType: 'image/jpeg',
});

// Get public URL
const url = StorageService.getPublicUrl('avatars', 'user-123/avatar.jpg');
```

### Real-time Subscriptions

```typescript
import { RealtimeService } from '@park-angel/shared';

// Subscribe to parking spot changes
RealtimeService.subscribeToParkingSpots('location-123', payload => {
  console.log('Spot updated:', payload);
});

// Subscribe to user bookings
RealtimeService.subscribeToBookings('user-123', payload => {
  console.log('Booking updated:', payload);
});
```

### Database Operations

```typescript
import { supabase } from '@park-angel/shared';

// Query data
const { data, error } = await supabase
  .from('parking_spots')
  .select('*')
  .eq('status', 'available');

// Insert data
const { data, error } = await supabase.from('bookings').insert({
  user_id: 'user-123',
  spot_id: 'spot-456',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 3600000).toISOString(),
});
```

## Database Schema

The database follows a hierarchical structure:

```
Location (Operator-owned)
├── Section
    ├── Zone
        ├── Parking Spot
```

### Key Tables

- **users**: User accounts and authentication
- **user_profiles**: Extended user information
- **locations**: Top-level parking locations
- **sections**: Location subdivisions
- **zones**: Section subdivisions
- **parking_spots**: Individual parking spaces
- **bookings**: Parking reservations
- **vehicles**: User vehicles
- **messages**: In-app messaging
- **ratings**: Reviews and ratings
- **advertisements**: Location-based ads

## Storage Buckets

- **avatars**: User profile pictures (public)
- **vehicle-photos**: Vehicle images (private)
- **parking-photos**: Parking spot images (public)
- **violation-photos**: Violation evidence (private)
- **advertisement-media**: Ad content (public)
- **documents**: User documents (private)
- **receipts**: Payment receipts (private)
- **facility-layouts**: Parking facility layouts (private)

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- Users can only access their own data
- Operators can manage their assigned locations
- Admins have full access
- Public data is appropriately accessible

### Authentication

- JWT-based authentication with Supabase Auth
- OAuth support for Google and Facebook
- Two-Factor Authentication (2FA) support
- Session management and security policies

## Edge Functions

### booking-processor

Handles booking creation, validation, and payment processing.

**Endpoint**: `/functions/v1/booking-processor`

**Payload**:

```json
{
  "spotId": "uuid",
  "vehicleId": "uuid",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T12:00:00Z",
  "paymentMethodId": "pm_xxx"
}
```

### notification-handler

Processes and sends notifications via multiple channels.

**Endpoint**: `/functions/v1/notification-handler`

**Payload**:

```json
{
  "userId": "uuid",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "booking",
  "channels": ["push", "email"]
}
```

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure all types are properly exported

## License

This package is part of the Park Angel system and is proprietary software.
