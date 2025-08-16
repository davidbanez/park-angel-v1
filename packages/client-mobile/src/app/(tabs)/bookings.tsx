import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Booking } from '@park-angel/shared/src/types/booking';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import { BookingService } from '../../services/bookingService';
import { BookingManagement } from '../../components/booking/BookingManagement';
import { NavigationController } from '../../components/navigation/NavigationController';
import { useParkingStore } from '../../stores/parkingStore';

export default function BookingsScreen() {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<ParkingSpot | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Load active booking
      const active = await BookingService.getActiveBooking();
      setActiveBooking(active);

      // Load recent bookings (completed, cancelled)
      const recent = await BookingService.getUserBookings();
      const recentFiltered = recent.filter(b => 
        b.status === 'completed' || b.status === 'cancelled'
      ).slice(0, 10);
      setRecentBookings(recentFiltered);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleBookingUpdated = (updatedBooking: Booking) => {
    setActiveBooking(updatedBooking);
  };

  const handleBookingCancelled = () => {
    setActiveBooking(null);
    loadBookings(); // Refresh to update recent bookings
  };

  const handleNavigateToSpot = async (spotId: string) => {
    try {
      // Get parking spot details
      const spot = await BookingService.getParkingSpot(spotId);
      if (spot) {
        setNavigationDestination(spot);
        setShowNavigation(true);
      } else {
        Alert.alert('Error', 'Unable to find parking spot details for navigation.');
      }
    } catch (error) {
      console.error('Error getting spot details for navigation:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  };

  const handleNavigationComplete = () => {
    setShowNavigation(false);
    setNavigationDestination(null);
  };

  const handleNavigationCancel = () => {
    setShowNavigation(false);
    setNavigationDestination(null);
  };

  const formatBookingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBookingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'confirmed':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Bookings</Text>
          
          {/* Active Booking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Booking</Text>
            {activeBooking ? (
              <BookingManagement
                booking={activeBooking}
                onBookingUpdated={handleBookingUpdated}
                onBookingCancelled={handleBookingCancelled}
                onNavigateToSpot={handleNavigateToSpot}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🅿️</Text>
                <Text style={styles.emptyStateTitle}>No Active Booking</Text>
                <Text style={styles.emptyStateText}>
                  You don&apos;t have any active parking sessions. Find a parking spot on the map to get started.
                </Text>
              </View>
            )}
          </View>

          {/* Recent Bookings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {recentBookings.length > 0 ? (
              <View style={styles.bookingsList}>
                {recentBookings.map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingSpot}>
                          Spot {booking.spot?.number}
                        </Text>
                        <Text style={styles.bookingLocation}>
                          {booking.spot?.zone?.section?.location?.name}
                        </Text>
                      </View>
                      <View style={[
                        styles.bookingStatusBadge,
                        { backgroundColor: getStatusColor(booking.status) }
                      ]}>
                        <Text style={styles.bookingStatusText}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.bookingDetails}>
                      <Text style={styles.bookingDate}>
                        {formatBookingDate(booking.startTime)}
                      </Text>
                      <Text style={styles.bookingTime}>
                        {formatBookingTime(booking.startTime, booking.endTime)}
                      </Text>
                      <Text style={styles.bookingAmount}>
                        ₱{booking.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateTitle}>No Recent Bookings</Text>
                <Text style={styles.emptyStateText}>
                  Your booking history will appear here once you start parking.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Navigation Modal */}
      {showNavigation && navigationDestination && (
        <Modal
          visible={showNavigation}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <NavigationController
            destination={navigationDestination}
            onNavigationComplete={handleNavigationComplete}
            onCancel={handleNavigationCancel}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingSpot: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bookingLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bookingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});