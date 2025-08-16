import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import ViolationReportingInterface from '../../components/parking/ViolationReportingInterface';
import EnforcementActionManager from '../../components/parking/EnforcementActionManager';
import ViolationMonitoringSummary from '../../components/parking/ViolationMonitoringSummary';
import ViolationDashboard from '../../components/parking/ViolationDashboard';

export default function ViolationsScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'enforcement' | 'monitoring'>('dashboard');

  const tabOptions = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'report', label: 'Report' },
    { value: 'enforcement', label: 'Enforcement' },
    { value: 'monitoring', label: 'Monitoring' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ViolationDashboard />;
      case 'report':
        return <ViolationReportingInterface />;
      case 'enforcement':
        return <EnforcementActionManager />;
      case 'monitoring':
        return <ViolationMonitoringSummary />;
      default:
        return <ViolationDashboard />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          buttons={tabOptions}
          style={styles.segmentedButtons}
        />
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  segmentedButtons: {
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});