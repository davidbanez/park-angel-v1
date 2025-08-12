# Park Angel Client Mobile App

React Native mobile application built with Expo for parking customers.

## Features Implemented

### ✅ Task 25 Completed: Set up Client Mobile App (React Native with Expo)

- **React Native with Expo SDK 49**: Full setup with modern Expo Router
- **Navigation**: React Navigation with tab-based navigation structure
- **State Management**: Zustand for client state + React Query for server state
- **Purple Theme**: TailwindCSS with NativeWind for consistent purple branding
- **Push Notifications**: Expo Notifications with permission handling
- **Offline Storage**: MMKV for high-performance storage + AsyncStorage for larger data
- **Sync Capabilities**: Comprehensive offline sync service with network detection

## Project Structure

```
src/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── welcome.tsx    # Welcome/onboarding screen
│   │   ├── login.tsx      # Login screen
│   │   ├── register.tsx   # Registration screen
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Main tab navigation
│   │   ├── map.tsx        # Parking map screen
│   │   ├── bookings.tsx   # User bookings
│   │   ├── host.tsx       # Host onboarding
│   │   └── profile.tsx    # User profile
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # App entry point
├── providers/             # React Context providers
│   ├── AuthProvider.tsx   # Authentication context
│   ├── NotificationProvider.tsx # Push notifications
│   └── ThemeProvider.tsx  # Theme management
├── stores/                # Zustand stores
│   ├── authStore.ts       # Authentication state
│   └── parkingStore.ts    # Parking-related state
├── services/              # Business logic services
│   ├── offlineStorage.ts  # Offline data management
│   └── syncService.ts     # Network sync service
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   └── useOfflineSync.ts  # Offline sync hook
└── styles/                # Styling
    └── global.css         # Global TailwindCSS styles
```

## Key Technologies

- **Expo SDK 49**: Latest Expo framework
- **React Native 0.72**: Modern React Native
- **Expo Router**: File-based routing system
- **TailwindCSS + NativeWind**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **MMKV**: High-performance storage
- **Supabase**: Backend integration
- **TypeScript**: Full type safety

## Authentication Flow

- Welcome screen with app introduction
- Social login (Google, Facebook) + email/password
- Registration with email verification
- Password reset functionality
- Persistent authentication state

## Navigation Structure

- **Map Tab**: Interactive parking spot discovery
- **Bookings Tab**: Active and historical bookings
- **Host Tab**: Become a parking space host
- **Profile Tab**: User settings and account management

## Offline Capabilities

- **Offline Storage**: Critical data cached locally
- **Sync Service**: Automatic sync when online
- **Queue System**: Actions queued when offline
- **Network Detection**: Automatic retry on reconnection

## Push Notifications

- **Permission Handling**: Proper iOS/Android permissions
- **Parking Reminders**: 15-minute expiry warnings
- **Booking Updates**: Real-time booking status
- **Custom Scheduling**: Flexible notification timing

## State Management

### Authentication State (Zustand)
- User session management
- Persistent login state
- Authentication actions

### Parking State (Zustand)
- Current location tracking
- Nearby parking spots
- Active bookings
- Search filters

### Server State (React Query)
- API data caching
- Background refetching
- Optimistic updates
- Error handling

## Theme System

- **Purple Primary**: #8B5CF6 brand color
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Theme provider setup
- **Consistent Spacing**: TailwindCSS utilities

## Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Variables

Create `.env.local` with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_NAME=Park Angel
EXPO_PUBLIC_DEBUG_MODE=true
```

## Next Steps

The foundation is complete. Ready for:

1. **Task 26**: Authentication and user registration implementation
2. **Task 27**: Parking discovery and map interface
3. **Task 28**: Booking and payment system
4. **Task 29**: Navigation and guidance system
5. **Task 30**: Hosted parking features

## Requirements Satisfied

- ✅ **11.1-11.4**: Modern React Native with Expo setup
- ✅ **10.1-10.10**: Purple theme and responsive design
- ✅ Navigation with React Navigation
- ✅ State management with Zustand and React Query
- ✅ Push notifications configuration
- ✅ Offline storage and sync capabilities

The client mobile app foundation is now complete and ready for feature implementation!