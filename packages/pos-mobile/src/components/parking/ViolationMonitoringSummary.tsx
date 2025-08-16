import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Card, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ViolationMonitoringSummary } from '../../types/pos';
import { ViolationService } from '../../services/violationService';

const { width } = Dimensions.get('window');

interface ViolationMonitoringSummaryProps {
  locationId?: string;
  operatorId?: string;
}

export default function ViolationMonitoringSummaryComponent({ 
  locationId, 
  operatorId 
}: ViolationMonitoringSummaryProps) {
  const [summaries, setSummaries] = useState<ViolationMonitoringSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const timeRangeOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
  ];

  useEffect(() => {
    loadSummaries();
  }, [locationId, operatorId, timeRange]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      let dateFrom: Date;
      
      switch (timeRange) {
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const data = await ViolationService.getInstance().getViolationMonitoringSummary(
        locationId,
        operatorId,
        dateFrom,
        now
      );

      setSummaries(data);
    } catch (error) {
      console.error('Error loading violation summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSummaries();
    setRefreshing(false);
  };

  const calculateTotals = () => {
    return summaries.reduce(
      (totals, summary) => ({
        totalViolations: totals.totalViolations + summary.totalViolationsReported,
        totalEnforcements: totals.totalEnforcements + summary.totalEnforcementActions,
        totalFines: totals.totalFines + summary.totalFinesIssued,
        totalCosts: totals.totalCosts + summary.totalEnforcementCosts,
      }),
      { totalViolations: 0, totalEnforcements: 0, totalFines: 0, totalCosts: 0 }
    );
  };

  const getViolationTypeBreakdown = () => {
    const breakdown: Record<string, number> = {};
    
    summaries.forEach(summary => {
      Object.entries(summary.violationsByType).forEach(([type, count]) => {
        breakdown[type] = (breakdown[type] || 0) + count;
      });
    });

    return breakdown;
  };

  const getEnforcementTypeBreakdown = () => {
    const breakdown: Record<string, number> = {};
    
    summaries.forEach(summary => {
      Object.entries(summary.enforcementByType).forEach(([type, count]) => {
        breakdown[type] = (breakdown[type] || 0) + count;
      });
    });

    return breakdown;
  };

  const calculateAverageResponseTime = () => {
    const validSummaries = summaries.filter(s => s.avgResponseTimeMinutes);
    if (validSummaries.length === 0) return 0;
    
    const total = validSummaries.reduce((sum, s) => sum + (s.avgResponseTimeMinutes || 0), 0);
    return Math.round(total / validSummaries.length);
  };

  const calculateAverageResolutionRate = () => {
    const validSummaries = summaries.filter(s => s.resolutionRate);
    if (validSummaries.length === 0) return 0;
    
    const total = validSummaries.reduce((sum, s) => sum + (s.resolutionRate || 0), 0);
    return Math.round(total / validSummaries.length);
  };

  const calculateTrendDirection = () => {
    if (summaries.length < 4) return 'stable';
    
    const firstHalf = summaries.slice(Math.floor(summaries.length / 2));
    const secondHalf = summaries.slice(0, Math.floor(summaries.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.totalViolationsReported, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.totalViolationsReported, 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    const threshold = Math.max(1, firstHalfAvg * 0.1); // 10% threshold
    
    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return { icon: 'trending-up', color: '#EF4444' };
      case 'decreasing': return { icon: 'trending-down', color: '#10B981' };
      default: return { icon: 'trending-flat', color: '#6B7280' };
    }
  };

  const getMostCommonViolationType = () => {
    const typeCount: Record<string, number> = {};
    
    summaries.forEach(summary => {
      Object.entries(summary.violationsByType).forEach(([type, count]) => {
        typeCount[type] = (typeCount[type] || 0) + count;
      });
    });

    const entries = Object.entries(typeCount);
    if (entries.length === 0) return { type: 'None', count: 0 };
    
    const [type, count] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    return { 
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      count 
    };
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const getViolationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      illegal_parking: '#EF4444',
      expired_session: '#F59E0B',
      no_payment: '#7C3AED',
      blocking_access: '#DC2626',
      disabled_spot_violation: '#B91C1C',
      other: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  const getEnforcementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      towing: '#EF4444',
      clamping: '#F59E0B',
      warning: '#10B981',
      fine: '#7C3AED',
    };
    return colors[type] || '#6B7280';
  };

  const totals = calculateTotals();
  const violationBreakdown = getViolationTypeBreakdown();
  const enforcementBreakdown = getEnforcementTypeBreakdown();
  const avgResponseTime = calculateAverageResponseTime();
  const avgResolutionRate = calculateAverageResolutionRate();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Time Range Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Time Range</Text>
            <SegmentedButtons
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as typeof timeRange)}
              buttons={timeRangeOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Overview Statistics */}
        <Card style={styles.card}>
          <Card.Title
            title="Overview Statistics"
            left={(props) => <MaterialIcons name="analytics" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totals.totalViolations}</Text>
                <Text style={styles.statLabel}>Total Violations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totals.totalEnforcements}</Text>
                <Text style={styles.statLabel}>Enforcement Actions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(totals.totalFines)}</Text>
                <Text style={styles.statLabel}>Total Fines</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(totals.totalCosts)}</Text>
                <Text style={styles.statLabel}>Enforcement Costs</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Performance Metrics */}
        <Card style={styles.card}>
          <Card.Title
            title="Performance Metrics"
            left={(props) => <MaterialIcons name="speed" {...props} color="#10B981" />}
          />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <MaterialIcons name="timer" size={24} color="#F59E0B" />
                  <Text style={styles.metricTitle}>Avg Response Time</Text>
                </View>
                <Text style={styles.metricValue}>{avgResponseTime} minutes</Text>
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  <Text style={styles.metricTitle}>Resolution Rate</Text>
                </View>
                <Text style={styles.metricValue}>{avgResolutionRate}%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Trend Analysis */}
        <Card style={styles.card}>
          <Card.Title
            title="Trend Analysis"
            left={(props) => <MaterialIcons name="insights" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.trendGrid}>
              <View style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <MaterialIcons 
                    name={getTrendIcon(calculateTrendDirection()).icon} 
                    size={24} 
                    color={getTrendIcon(calculateTrendDirection()).color} 
                  />
                  <Text style={styles.trendTitle}>Violation Trend</Text>
                </View>
                <Text style={[styles.trendValue, { color: getTrendIcon(calculateTrendDirection()).color }]}>
                  {calculateTrendDirection().toUpperCase()}
                </Text>
                <Text style={styles.trendSubtext}>
                  {timeRange === 'week' ? 'Past 7 days' : timeRange === 'month' ? 'Past 30 days' : 'Past 90 days'}
                </Text>
              </View>
              
              <View style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <MaterialIcons name="priority-high" size={24} color="#EF4444" />
                  <Text style={styles.trendTitle}>Most Common</Text>
                </View>
                <Text style={styles.trendValue}>
                  {getMostCommonViolationType().type}
                </Text>
                <Text style={styles.trendSubtext}>
                  {getMostCommonViolationType().count} incidents
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Violation Types Breakdown */}
        <Card style={styles.card}>
          <Card.Title
            title="Violation Types"
            left={(props) => <MaterialIcons name="report-problem" {...props} color="#EF4444" />}
          />
          <Card.Content>
            <View style={styles.breakdownContainer}>
              {Object.entries(violationBreakdown).map(([type, count]) => (
                <View key={type} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={[styles.colorIndicator, { backgroundColor: getViolationTypeColor(type) }]} />
                    <Text style={styles.breakdownLabel}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                  <Chip
                    style={[styles.countChip, { backgroundColor: getViolationTypeColor(type) }]}
                    textStyle={styles.countChipText}
                  >
                    {count}
                  </Chip>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Enforcement Actions Breakdown */}
        <Card style={styles.card}>
          <Card.Title
            title="Enforcement Actions"
            left={(props) => <MaterialIcons name="security" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.breakdownContainer}>
              {Object.entries(enforcementBreakdown).map(([type, count]) => (
                <View key={type} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={[styles.colorIndicator, { backgroundColor: getEnforcementTypeColor(type) }]} />
                    <Text style={styles.breakdownLabel}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                  <Chip
                    style={[styles.countChip, { backgroundColor: getEnforcementTypeColor(type) }]}
                    textStyle={styles.countChipText}
                  >
                    {count}
                  </Chip>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Daily Summaries */}
        <Card style={styles.card}>
          <Card.Title
            title="Daily Reports"
            left={(props) => <MaterialIcons name="calendar-today" {...props} color="#6B7280" />}
          />
          <Card.Content>
            {summaries.length === 0 ? (
              <Text style={styles.noDataText}>No data available for the selected time range</Text>
            ) : (
              summaries.slice(0, 7).map((summary) => (
                <View key={summary.id} style={styles.dailySummaryItem}>
                  <View style={styles.dailySummaryHeader}>
                    <Text style={styles.dailySummaryDate}>
                      {summary.reportDate.toLocaleDateString()}
                    </Text>
                    <View style={styles.dailySummaryStats}>
                      <Chip style={styles.dailyStatChip} textStyle={styles.dailyStatText}>
                        {summary.totalViolationsReported} violations
                      </Chip>
                      <Chip style={styles.dailyStatChip} textStyle={styles.dailyStatText}>
                        {summary.totalEnforcementActions} actions
                      </Chip>
                    </View>
                  </View>
                  {summary.resolutionRate && (
                    <Text style={styles.dailySummaryDetail}>
                      Resolution Rate: {summary.resolutionRate}%
                    </Text>
                  )}
                </View>
              ))
            )}
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
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
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
  metricsGrid: {
    gap: 16,
  },
  metricItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7C3AED',
  },
  breakdownContainer: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  countChip: {
    paddingHorizontal: 8,
  },
  countChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 20,
  },
  dailySummaryItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  dailySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dailySummaryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dailySummaryStats: {
    flexDirection: 'row',
    gap: 8,
  },
  dailyStatChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  dailyStatText: {
    fontSize: 10,
    color: '#374151',
  },
  dailySummaryDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  trendItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  trendSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});