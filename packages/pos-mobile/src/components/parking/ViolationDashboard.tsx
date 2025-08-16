import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Button, Chip, FAB, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ViolationReport, EnforcementAction, ViolationMonitoringSummary } from '../../types/pos';
import { ViolationService } from '../../services/violationService';

interface ViolationDashboardProps {
  locationId?: string;
  operatorId?: string;
}

export default function ViolationDashboard({ locationId, operatorId }: ViolationDashboardProps) {
  const [activeReports, setActiveReports] = useState<ViolationReport[]>([]);
  const [pendingActions, setPendingActions] = useState<EnforcementAction[]>([]);
  const [todaySummary, setTodaySummary] = useState<ViolationMonitoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  const timeFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [locationId, operatorId, timeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load active violation reports
      const reportsData = await ViolationService.getInstance().getViolationReports({
        status: 'reported',
        locationId,
        dateFrom: getDateFromFilter(),
      });
      setActiveReports(reportsData);

      // Load pending enforcement actions
      const actionsData = await ViolationService.getInstance().getEnforcementActions({
        status: 'requested',
      });
      setPendingActions(actionsData);

      // Load today's summary
      const summaryData = await ViolationService.getInstance().getViolationMonitoringSummary(
        locationId,
        operatorId,
        getDateFromFilter(),
        new Date()
      );
      setTodaySummary(summaryData[0] || null);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load violation dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getDateFromFilter = (): Date => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  };

  const getUrgentReports = () => {
    return activeReports.filter(report => 
      report.priority === 'urgent' || report.priority === 'high'
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#7C3AED';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      case 'dismissed': return '#6B7280';
      case 'escalated': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const urgentReports = getUrgentReports();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Time Filter */}
        <Card style={styles.card}>
          <Card.Content>
            <SegmentedButtons
              value={timeFilter}
              onValueChange={(value) => setTimeFilter(value as typeof timeFilter)}
              buttons={timeFilterOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <Card style={styles.card}>
          <Card.Title
            title="Quick Overview"
            left={(props) => <MaterialIcons name="dashboard" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeReports.length}</Text>
                <Text style={styles.statLabel}>Active Reports</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {urgentReports.length}
                </Text>
                <Text style={styles.statLabel}>Urgent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pendingActions.length}</Text>
                <Text style={styles.statLabel}>Pending Actions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {todaySummary?.resolutionRate || 0}%
                </Text>
                <Text style={styles.statLabel}>Resolution Rate</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Urgent Reports */}
        {urgentReports.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Urgent Reports"
              subtitle={`${urgentReports.length} reports require immediate attention`}
              left={(props) => <MaterialIcons name="priority-high" {...props} color="#EF4444" />}
            />
            <Card.Content>
              {urgentReports.slice(0, 3).map((report) => (
                <View key={report.id} style={styles.urgentReportItem}>
                  <View style={styles.urgentReportHeader}>
                    <Text style={styles.urgentReportPlate}>
                      {report.vehiclePlateNumber}
                    </Text>
                    <Chip
                      style={[styles.priorityChip, { backgroundColor: getPriorityColor(report.priority) }]}
                      textStyle={styles.priorityChipText}
                      compact
                    >
                      {report.priority.toUpperCase()}
                    </Chip>
                  </View>
                  <Text style={styles.urgentReportType}>
                    {report.violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.urgentReportTime}>
                    {formatTimeAgo(report.timestamp)}
                  </Text>
                </View>
              ))}
              {urgentReports.length > 3 && (
                <Button
                  mode="text"
                  onPress={() => {/* Navigate to full list */}}
                  textColor="#EF4444"
                >
                  View All {urgentReports.length} Urgent Reports
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Recent Activity */}
        <Card style={styles.card}>
          <Card.Title
            title="Recent Activity"
            left={(props) => <MaterialIcons name="history" {...props} color="#6B7280" />}
          />
          <Card.Content>
            {activeReports.slice(0, 5).map((report) => (
              <View key={report.id} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityPlate}>
                    {report.vehiclePlateNumber}
                  </Text>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(report.status) }]}
                    textStyle={styles.statusChipText}
                    compact
                  >
                    {report.status.toUpperCase()}
                  </Chip>
                </View>
                <Text style={styles.activityDescription}>
                  {report.violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.activityTime}>
                  {formatTimeAgo(report.timestamp)}
                </Text>
              </View>
            ))}
            
            {activeReports.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={48} color="#10B981" />
                <Text style={styles.emptyStateTitle}>All Clear!</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No active violation reports for the selected time period.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Performance Summary */}
        {todaySummary && (
          <Card style={styles.card}>
            <Card.Title
              title={`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Performance`}
              left={(props) => <MaterialIcons name="analytics" {...props} color="#10B981" />}
            />
            <Card.Content>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {todaySummary.totalViolationsReported}
                  </Text>
                  <Text style={styles.performanceLabel}>Total Reports</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {todaySummary.totalEnforcementActions}
                  </Text>
                  <Text style={styles.performanceLabel}>Actions Taken</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {todaySummary.avgResponseTimeMinutes || 0}m
                  </Text>
                  <Text style={styles.performanceLabel}>Avg Response</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
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
  card: {
    marginBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: '#F9FAFB',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  urgentReportItem: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 8,
  },
  urgentReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgentReportPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  urgentReportType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  urgentReportTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityChip: {
    paddingHorizontal: 8,
  },
  priorityChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  activityItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityPlate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activityDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});