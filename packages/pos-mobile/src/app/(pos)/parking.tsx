import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Button, Chip, FAB, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { usePOSSession } from '../../hooks/usePOSSession';
import { parkingSessionService } from '../../services/parkingSessionService';
import { ParkingSessionCreator } from '../../components/parking/ParkingSessionCreator';
import { SpotOccupancyViewer } from '../../components/parking/SpotOccupancyViewer';
import { SessionReassignmentModal } from '../../components/parking/SessionReassignmentModal';
import { SessionTerminationModal } from '../../components/parking/SessionTerminationModal';

type ViewMode = 'overview' | 'create' | 'occupancy' | 'sessions';

export default function ParkingScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isSessionActive } = usePOSSession();

  useEffect(() => {
    if (isSessionActive) {
      loadActiveSessions();
    }
  }, [isSessionActive]);

  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const sessions = await parkingSessionService.getActiveSessions();
      setActiveSessions(sessions);
    } catch (error: any) {
      console.error('Error loading active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadActiveSessions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSessionCreated = (session: any) => {
    setActiveSessions(prev => [session, ...prev]);
    loadActiveSessions(); // Refresh to get updated data
  };

  const handleSessionSelect = (session: any) => {
    setSelectedSession(session);
  };

  const handleReassignSession = () => {
    setShowReassignModal(true);
  };

  const handleTerminateSession = () => {
    setShowTerminateModal(true);
  };

  const handleSessionUpdated = () => {
    loadActiveSessions();
    setSelectedSession(null);
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
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

  if (!isSessionActive) {
    return (
      <View style={styles.inactiveContainer}>
        <MaterialIcons name="info" size={48} color="#6B7280" />
        <Text style={styles.inactiveTitle}>No Active POS Session</Text>
        <Text style={styles.inactiveSubtitle}>
          Please start a shift to manage parking sessions
        </Text>
      </View>
    );
  }

  const renderOverview = () => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#7C3AED']}
        />
      }
    >
      <View style={styles.content}>
        {/* Stats Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Parking Overview"
            left={(props) => <MaterialIcons name="dashboard" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{activeSessions.length}</Text>
                <Text style={styles.statLabel}>Active Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {activeSessions.filter(s => s.paymentMethod === 'cash').length}
                </Text>
                <Text style={styles.statLabel}>Cash Payments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#7C3AED' }]}>
                  ₱{activeSessions.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(0)}
                </Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Title
            title="Quick Actions"
            left={(props) => <MaterialIcons name="flash-on" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.actionGrid}>
              <Button
                mode="outlined"
                onPress={() => setShowCreateModal(true)}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="plus"
              >
                New Session
              </Button>
              <Button
                mode="outlined"
                onPress={() => setViewMode('occupancy')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="map"
              >
                Spot Status
              </Button>
              <Button
                mode="outlined"
                onPress={() => setViewMode('sessions')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="list"
              >
                Active Sessions
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  if (activeSessions.length > 0) {
                    setViewMode('sessions');
                  } else {
                    Alert.alert('Info', 'No active sessions to manage');
                  }
                }}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="settings"
              >
                Manage
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Sessions */}
        {activeSessions.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Recent Sessions"
              subtitle={`${activeSessions.length} active session${activeSessions.length !== 1 ? 's' : ''}`}
              left={(props) => <MaterialIcons name="history" {...props} color="#7C3AED" />}
              right={(props) => (
                <Button
                  mode="text"
                  onPress={() => setViewMode('sessions')}
                  textColor="#7C3AED"
                  compact
                >
                  View All
                </Button>
              )}
            />
            <Card.Content>
              {activeSessions.slice(0, 3).map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                      <MaterialIcons
                        name={getVehicleTypeIcon(session.vehicleType)}
                        size={20}
                        color="#6B7280"
                      />
                      <Text style={styles.plateNumber}>{session.vehiclePlateNumber}</Text>
                      <Badge style={styles.vehicleTypeBadge}>
                        {session.vehicleType}
                      </Badge>
                    </View>
                    <Text style={styles.sessionDuration}>
                      Parked for: {formatDuration(session.startTime)}
                    </Text>
                  </View>
                  <Text style={styles.sessionAmount}>
                    ₱{session.totalAmount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );

  const renderActiveSessions = () => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#7C3AED']}
        />
      }
    >
      <View style={styles.content}>
        {activeSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="local-parking" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Active Sessions</Text>
              <Text style={styles.emptySubtitle}>
                Create a new parking session to get started
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowCreateModal(true)}
                style={styles.emptyButton}
                buttonColor="#7C3AED"
                icon="plus"
              >
                Create Session
              </Button>
            </Card.Content>
          </Card>
        ) : (
          activeSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <Card.Content>
                <View style={styles.sessionCardHeader}>
                  <View style={styles.sessionCardInfo}>
                    <View style={styles.sessionCardTitle}>
                      <MaterialIcons
                        name={getVehicleTypeIcon(session.vehicleType)}
                        size={24}
                        color="#7C3AED"
                      />
                      <Text style={styles.sessionCardPlate}>
                        {session.vehiclePlateNumber}
                      </Text>
                    </View>
                    <Text style={styles.sessionCardDetails}>
                      {session.vehicleType} • Started {formatDuration(session.startTime)} ago
                    </Text>
                  </View>
                  <Text style={styles.sessionCardAmount}>
                    ₱{session.totalAmount.toFixed(2)}
                  </Text>
                </View>

                {session.endTime && (
                  <View style={styles.sessionCardExpiry}>
                    <MaterialIcons name="schedule" size={16} color="#F59E0B" />
                    <Text style={styles.sessionCardExpiryText}>
                      Expires: {new Date(session.endTime).toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
              </Card.Content>

              <Card.Actions>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedSession(session);
                    setShowReassignModal(true);
                  }}
                  textColor="#7C3AED"
                  icon="swap-horiz"
                  compact
                >
                  Reassign
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedSession(session);
                    setShowTerminateModal(true);
                  }}
                  textColor="#EF4444"
                  icon="stop"
                  compact
                >
                  End Session
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'occupancy', label: 'Spot Status', icon: 'map' },
            { key: 'sessions', label: 'Active Sessions', icon: 'list' },
          ].map((mode) => (
            <Chip
              key={mode.key}
              selected={viewMode === mode.key}
              onPress={() => setViewMode(mode.key as ViewMode)}
              style={[
                styles.viewModeChip,
                viewMode === mode.key && styles.selectedViewModeChip
              ]}
              textStyle={viewMode === mode.key ? styles.selectedViewModeText : undefined}
              icon={mode.icon}
            >
              {mode.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'occupancy' && (
        <SpotOccupancyViewer
          onCreateSession={() => setShowCreateModal(true)}
          onSessionSelect={handleSessionSelect}
        />
      )}
      {viewMode === 'sessions' && renderActiveSessions()}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        color="#fff"
      />

      {/* Modals */}
      <ParkingSessionCreator
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSessionCreated={handleSessionCreated}
      />

      <SessionReassignmentModal
        visible={showReassignModal}
        session={selectedSession}
        onDismiss={() => {
          setShowReassignModal(false);
          setSelectedSession(null);
        }}
        onReassigned={handleSessionUpdated}
      />

      <SessionTerminationModal
        visible={showTerminateModal}
        session={selectedSession}
        onDismiss={() => {
          setShowTerminateModal(false);
          setSelectedSession(null);
        }}
        onTerminated={handleSessionUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  inactiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  inactiveSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  viewModeSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeChip: {
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedViewModeChip: {
    backgroundColor: '#7C3AED',
  },
  selectedViewModeText: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    borderColor: '#7C3AED',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  sessionDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  sessionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
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
  emptyButton: {
    marginTop: 16,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionCardInfo: {
    flex: 1,
  },
  sessionCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCardPlate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sessionCardDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionCardAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sessionCardExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
  },
  sessionCardExpiryText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C3AED',
  },
});