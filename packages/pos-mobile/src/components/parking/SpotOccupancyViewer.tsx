import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  Searchbar,
  FAB,
  Badge,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { parkingSessionService } from '../../services/parkingSessionService';

interface SpotOccupancyViewerProps {
  onCreateSession?: () => void;
  onSessionSelect?: (session: any) => void;
}

export function SpotOccupancyViewer({
  onCreateSession,
  onSessionSelect,
}: SpotOccupancyViewerProps) {
  const [spots, setSpots] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [spotsData, sessionsData] = await Promise.all([
        parkingSessionService.getSpotOccupancy(),
        parkingSessionService.getActiveSessions()
      ]);
      
      setSpots(spotsData);
      setActiveSessions(sessionsData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'occupied':
        return '#EF4444';
      case 'maintenance':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return 'check-circle';
      case 'occupied':
        return 'cancel';
      case 'maintenance':
        return 'build';
      default:
        return 'help';
    }
  };

  const getVehicleTypeIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle':
        return 'motorcycle';
      case 'car':
        return 'directions-car';
      case 'van':
        return 'airport-shuttle';
      case 'truck':
        return 'local-shipping';
      default:
        return 'directions-car';
    }
  };

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         spot.current_booking?.vehicle_plate_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || spot.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    total: spots.length,
    available: spots.filter(s => s.status === 'available').length,
    occupied: spots.filter(s => s.status === 'occupied').length,
    maintenance: spots.filter(s => s.status === 'maintenance').length,
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const handleSpotPress = (spot: any) => {
    if (spot.status === 'occupied' && spot.current_booking && onSessionSelect) {
      onSessionSelect(spot.current_booking);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>Parking Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{statusCounts.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {statusCounts.available}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                {statusCounts.occupied}
              </Text>
              <Text style={styles.statLabel}>Occupied</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                {statusCounts.maintenance}
              </Text>
              <Text style={styles.statLabel}>Maintenance</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search spots or plate numbers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          theme={{ colors: { primary: '#7C3AED' } }}
        />
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'available', label: 'Available' },
            { key: 'occupied', label: 'Occupied' },
            { key: 'maintenance', label: 'Maintenance' },
          ].map((filter) => (
            <Chip
              key={filter.key}
              selected={filterStatus === filter.key}
              onPress={() => setFilterStatus(filter.key as any)}
              style={[
                styles.filterChip,
                filterStatus === filter.key && styles.selectedFilterChip
              ]}
              textStyle={filterStatus === filter.key ? styles.selectedFilterText : undefined}
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Spots List */}
      <ScrollView
        style={styles.spotsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7C3AED']}
          />
        }
      >
        {filteredSpots.map((spot) => (
          <Card
            key={spot.id}
            style={[
              styles.spotCard,
              spot.status === 'occupied' && styles.occupiedCard
            ]}
            onPress={() => handleSpotPress(spot)}
          >
            <Card.Content>
              <View style={styles.spotHeader}>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <Text style={styles.spotLocation}>
                    {spot.location?.name || 'Unknown Location'}
                  </Text>
                </View>
                
                <View style={styles.spotStatus}>
                  <MaterialIcons
                    name={getStatusIcon(spot.status)}
                    size={24}
                    color={getStatusColor(spot.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(spot.status) }]}>
                    {spot.status.charAt(0).toUpperCase() + spot.status.slice(1)}
                  </Text>
                </View>
              </View>

              {spot.status === 'occupied' && spot.current_booking && (
                <View style={styles.occupancyInfo}>
                  <View style={styles.vehicleInfo}>
                    <MaterialIcons
                      name={getVehicleTypeIcon(spot.current_booking.vehicle_type)}
                      size={20}
                      color="#6B7280"
                    />
                    <Text style={styles.plateNumber}>
                      {spot.current_booking.vehicle_plate_number}
                    </Text>
                    <Badge style={styles.vehicleTypeBadge}>
                      {spot.current_booking.vehicle_type}
                    </Badge>
                  </View>
                  
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>Parked for:</Text>
                    <Text style={styles.timeValue}>
                      {formatDuration(spot.current_booking.start_time)}
                    </Text>
                  </View>

                  {spot.current_booking.end_time && (
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeLabel}>Expires:</Text>
                      <Text style={styles.timeValue}>
                        {new Date(spot.current_booking.end_time).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {spot.status === 'available' && (
                <View style={styles.availableInfo}>
                  <Text style={styles.availableText}>
                    Ready for new customer
                  </Text>
                  <Text style={styles.vehicleTypeText}>
                    Vehicle Type: {spot.vehicle_type || 'Any'}
                  </Text>
                </View>
              )}

              {spot.status === 'maintenance' && (
                <View style={styles.maintenanceInfo}>
                  <Text style={styles.maintenanceText}>
                    Under maintenance - Not available
                  </Text>
                </View>
              )}
            </Card.Content>

            {spot.status === 'occupied' && (
              <Card.Actions>
                <Button
                  mode="outlined"
                  onPress={() => handleSpotPress(spot)}
                  textColor="#7C3AED"
                  icon="visibility"
                >
                  View Session
                </Button>
              </Card.Actions>
            )}
          </Card>
        ))}

        {filteredSpots.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="search-off" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No spots found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'No spots match the selected filter'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {onCreateSession && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={onCreateSession}
          color="#fff"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedFilterChip: {
    backgroundColor: '#7C3AED',
  },
  selectedFilterText: {
    color: '#fff',
  },
  spotsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  spotCard: {
    marginBottom: 12,
  },
  occupiedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  spotLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  spotStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  occupancyInfo: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
  },
  vehicleTypeBadge: {
    backgroundColor: '#7C3AED',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  availableInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  vehicleTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  maintenanceInfo: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
  },
  maintenanceText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C3AED',
  },
});