# Parking Discovery and Map Interface

This directory contains the implementation of the parking discovery and map interface for the Park Angel Client Mobile App, fulfilling task 27 requirements.

## Components Overview

### 1. ParkingMap.tsx
The main map component that integrates Google Maps with custom purple styling and parking spot visualization.

**Features:**
- Google Maps integration with custom purple theme
- Real-time parking spot markers with status indicators
- User location tracking and display
- Interactive spot selection
- Map region change handling for dynamic spot loading

### 2. ParkingMarker.tsx
Custom marker component for displaying parking spots on the map.

**Features:**
- Color-coded status indicators (available, occupied, reserved, maintenance)
- Parking type icons (hosted, street, facility)
- Price display on markers
- Selection state visualization
- Responsive marker design

### 3. SpotDetailsModal.tsx
Modal component that displays detailed information about selected parking spots.

**Features:**
- Comprehensive spot information display
- Pricing details with hourly rates
- Amenities listing
- Location coordinates
- Availability calendar integration
- Booking action buttons

### 4. AvailabilityCalendar.tsx
Calendar component for displaying parking spot availability over time.

**Features:**
- Monthly calendar view with navigation
- Color-coded availability status
- Time slot display for selected dates
- Interactive date selection
- Pricing information for available slots

### 5. SearchBar.tsx
Search component with location autocomplete functionality.

**Features:**
- Real-time location search with autocomplete
- Debounced search queries (300ms delay)
- Location type filtering
- Search result display with location details
- Clear search functionality

### 6. FilterPanel.tsx
Comprehensive filtering interface for parking search customization.

**Features:**
- Parking type filtering (hosted, street, facility)
- Price range selection
- Amenities filtering
- Active filter count display
- Filter persistence through app store

## Services

### ParkingService.ts
Service class handling all parking-related API operations.

**Methods:**
- `searchParkingSpots()` - Search for parking spots near a location
- `getParkingSpotDetails()` - Get detailed spot information
- `getSpotAvailability()` - Retrieve availability calendar data
- `searchLocations()` - Location autocomplete search
- `subscribeToOccupancyUpdates()` - Real-time occupancy updates

## Hooks

### useParkingData.ts
Custom hook for managing parking data with real-time updates.

**Features:**
- React Query integration for caching and synchronization
- Real-time occupancy updates via Supabase subscriptions
- Automatic refetching based on location and filter changes
- Optimistic updates for better user experience

## Store Integration

The components integrate with the Zustand parking store (`useParkingStore`) for:
- Current location management
- Search query persistence
- Filter state management
- Selected spot tracking
- Booking history

## Requirements Fulfilled

✅ **Integrate Google Maps with custom purple styling**
- Custom map style with purple theme implemented
- Google Maps API integration configured

✅ **Implement parking spot markers with real-time status**
- Color-coded markers based on spot status
- Real-time updates via Supabase subscriptions
- Interactive marker selection

✅ **Build filtering by parking type (Hosted, Street, Facility)**
- Comprehensive filter panel with type selection
- Filter persistence and application
- Visual filter indicators

✅ **Create search functionality with location autocomplete**
- Debounced search with autocomplete
- Location-based search results
- Search result selection and navigation

✅ **Implement spot details popup with pricing and amenities**
- Detailed modal with comprehensive spot information
- Pricing display and amenities listing
- Booking action integration

✅ **Build availability calendar for advance booking**
- Monthly calendar with availability visualization
- Time slot display for selected dates
- Interactive date and time selection

## Configuration Requirements

### Environment Variables
Add to `.env.local`:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### App Configuration
Update `app.json` with Google Maps API keys for both iOS and Android platforms.

### Dependencies
The implementation uses existing dependencies:
- `react-native-maps` for map functionality
- `expo-location` for location services
- `@tanstack/react-query` for data management
- `zustand` for state management

## Usage Example

```tsx
import { ParkingMap } from './components/map/ParkingMap';

function MapScreen() {
  const handleSpotSelect = (spot) => {
    // Handle spot selection
    console.log('Selected spot:', spot);
  };

  return (
    <ParkingMap onSpotSelect={handleSpotSelect} />
  );
}
```

## Testing

Basic test coverage is provided in `__tests__/ParkingService.test.ts` for the core service functionality.

## Future Enhancements

- Offline map caching
- Route optimization for multiple spots
- Advanced filtering options
- Spot reservation from map interface
- Integration with navigation apps