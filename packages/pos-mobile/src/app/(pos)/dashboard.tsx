import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { usePOS } from '../../providers/POSProvider';
import { usePOSMetrics } from '../../hooks/usePOSMetrics';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { currentSession, cashSummary, refreshSession, loading } = usePOS();
  const { metrics, isLoading, refetch } = usePOSMetrics();
  const { isOnline, pendingSyncCount } = useOfflineSync();
  const router = useRouter();

  useEffect(() => {
    if (currentSession) {
      refreshSession();
    }
  }, [currentSession?.id]);

  const handleRefresh = () => {
    refetch();
    if (currentSession) {
      refreshSession();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Connection Status */}
        <Card style={[styles.statusCard, !isOnline && styles.offlineCard]}>
          <Card.Content style={styles.statusContent}>
            <View style={styles.statusRow}>
              <MaterialIcons
                name={isOnline ? 'wifi' : 'wifi-off'}
                size={24}
                color={isOnline ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </Text>
              {pendingSyncCount > 0 && (
                <Chip mode="outlined" compact>
                  {pendingSyncCount} pending
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Shift Information */}
        <Card style={styles.card}>
          <Card.Title
            title="Current Shift"
            subtitle={`Started: ${currentSession?.startTime ? new Date(currentSession.startTime).toLocaleTimeString() : 'N/A'}`}
            left={(props: any) => <MaterialIcons name="access-time" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.shiftInfo}>
              <View style={styles.shiftItem}>
                <Text style={styles.shiftLabel}>Starting Cash</Text>
                <Text style={styles.shiftValue}>
                  ₱{currentSession?.currentCashAmount?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View style={styles.shiftItem}>
                <Text style={styles.shiftLabel}>Expected Cash</Text>
                <Text style={styles.shiftValue}>
                  ₱{cashSummary?.expectedCash?.toFixed(2) || '0.00'}
                </Text>
              </View>
              {cashSummary?.difference !== undefined && (
                <View style={styles.shiftItem}>
                  <Text style={styles.shiftLabel}>Difference</Text>
                  <Text style={[
                    styles.shiftValue,
                    { color: cashSummary.difference >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {cashSummary.difference >= 0 ? '+' : ''}₱{cashSummary.difference.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Today's Metrics */}
        <Card style={styles.card}>
          <Card.Title
            title="Today's Performance"
            left={(props: any) => <MaterialIcons name="analytics" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics?.totalTransactions || 0}</Text>
                <Text style={styles.metricLabel}>Transactions</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>₱{cashSummary?.cashSales?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.metricLabel}>Cash Sales</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics?.activeSessions || 0}</Text>
                <Text style={styles.metricLabel}>Active Sessions</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics?.violationReports || 0}</Text>
                <Text style={styles.metricLabel}>Violations</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Title
            title="Quick Actions"
            left={(props: any) => <MaterialIcons name="flash-on" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.actionGrid}>
              <Button
                mode="contained"
                onPress={() => router.push('/(pos)/parking')}
                style={styles.actionButton}
                buttonColor="#7C3AED"
                icon="plus"
              >
                New Session
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(pos)/violations')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="report"
              >
                Report Violation
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(pos)/cash')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="attach-money"
              >
                Cash Management
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(pos)/shift-summary')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="assessment"
              >
                Shift Summary
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Occupancy Overview */}
        <Card style={styles.card}>
          <Card.Title
            title="Parking Occupancy"
            left={(props: any) => <MaterialIcons name="local-parking" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.occupancyGrid}>
              <View style={styles.occupancyItem}>
                <Text style={styles.occupancyValue}>{metrics?.totalSpots || 0}</Text>
                <Text style={styles.occupancyLabel}>Total Spots</Text>
              </View>
              <View style={styles.occupancyItem}>
                <Text style={[styles.occupancyValue, { color: '#EF4444' }]}>
                  {metrics?.occupiedSpots || 0}
                </Text>
                <Text style={styles.occupancyLabel}>Occupied</Text>
              </View>
              <View style={styles.occupancyItem}>
                <Text style={[styles.occupancyValue, { color: '#10B981' }]}>
                  {(metrics?.totalSpots || 0) - (metrics?.occupiedSpots || 0)}
                </Text>
                <Text style={styles.occupancyLabel}>Available</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
  },
  offlineCard: {
    backgroundColor: '#FEF2F2',
  },
  statusContent: {
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftItem: {
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  shiftValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  occupancyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  occupancyItem: {
    alignItems: 'center',
  },
  occupancyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  occupancyLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
});