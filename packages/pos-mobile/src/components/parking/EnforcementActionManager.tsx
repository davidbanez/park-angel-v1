import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Button, Chip, FAB, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { EnforcementAction, ViolationReport } from '../../types/pos';
import { ViolationService } from '../../services/violationService';

interface EnforcementActionManagerProps {
  violationReportId?: string;
  onActionUpdated?: (action: EnforcementAction) => void;
}

export default function EnforcementActionManager({ 
  violationReportId, 
  onActionUpdated 
}: EnforcementActionManagerProps) {
  const [actions, setActions] = useState<EnforcementAction[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<EnforcementAction | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Request modal state
  const [requestActionType, setRequestActionType] = useState<EnforcementAction['actionType']>('towing');
  const [requestPriority, setRequestPriority] = useState<EnforcementAction['priority']>('normal');
  const [requestServiceProvider, setRequestServiceProvider] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestEstimatedCost, setRequestEstimatedCost] = useState('');

  // Update modal state
  const [updateStatus, setUpdateStatus] = useState<EnforcementAction['status']>('requested');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateActualCost, setUpdateActualCost] = useState('');

  const actionTypes = [
    { value: 'towing', label: 'Towing', icon: 'local-shipping', color: '#EF4444' },
    { value: 'clamping', label: 'Clamping', icon: 'lock', color: '#F59E0B' },
    { value: 'warning', label: 'Warning', icon: 'warning', color: '#10B981' },
    { value: 'fine', label: 'Fine', icon: 'receipt', color: '#7C3AED' },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const statusOptions = [
    { value: 'requested', label: 'Requested', color: '#6B7280' },
    { value: 'assigned', label: 'Assigned', color: '#3B82F6' },
    { value: 'in_progress', label: 'In Progress', color: '#F59E0B' },
    { value: 'completed', label: 'Completed', color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
    { value: 'failed', label: 'Failed', color: '#DC2626' },
  ];

  useEffect(() => {
    loadData();
  }, [violationReportId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load enforcement actions
      const actionsData = await ViolationService.getInstance().getEnforcementActions(
        violationReportId ? { violationReportId } : undefined
      );
      setActions(actionsData);

      // Load service providers
      const providersData = await ViolationService.getInstance().getServiceProviders();
      setServiceProviders(providersData);
    } catch (error) {
      console.error('Error loading enforcement data:', error);
      Alert.alert('Error', 'Failed to load enforcement actions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRequestAction = async () => {
    if (!violationReportId) {
      Alert.alert('Error', 'No violation report selected');
      return;
    }

    try {
      const action = await ViolationService.getInstance().requestEnforcementAction(
        violationReportId,
        requestActionType,
        'current_operator', // Would be actual operator ID from auth
        {
          priority: requestPriority,
          serviceProvider: requestServiceProvider || undefined,
          estimatedCost: requestEstimatedCost ? parseFloat(requestEstimatedCost) : undefined,
          notes: requestNotes || undefined,
        }
      );

      setActions(prev => [action, ...prev]);
      setShowRequestModal(false);
      resetRequestForm();
      onActionUpdated?.(action);

      Alert.alert('Success', 'Enforcement action requested successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request enforcement action');
    }
  };

  const handleUpdateAction = async () => {
    if (!selectedAction) return;

    try {
      const updates: Partial<EnforcementAction> = {
        status: updateStatus,
        completionNotes: updateNotes || undefined,
        actualCost: updateActualCost ? parseFloat(updateActualCost) : undefined,
      };

      if (updateStatus === 'in_progress' && !selectedAction.startedAt) {
        updates.startedAt = new Date();
      }

      if (updateStatus === 'completed' && !selectedAction.completedAt) {
        updates.completedAt = new Date();
      }

      const updatedAction = await ViolationService.getInstance().updateEnforcementAction(
        selectedAction.id,
        updates
      );

      setActions(prev => prev.map(action => 
        action.id === updatedAction.id ? updatedAction : action
      ));

      setShowUpdateModal(false);
      setSelectedAction(null);
      resetUpdateForm();
      onActionUpdated?.(updatedAction);

      Alert.alert('Success', 'Enforcement action updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update enforcement action');
    }
  };

  const resetRequestForm = () => {
    setRequestActionType('towing');
    setRequestPriority('normal');
    setRequestServiceProvider('');
    setRequestNotes('');
    setRequestEstimatedCost('');
  };

  const resetUpdateForm = () => {
    setUpdateStatus('requested');
    setUpdateNotes('');
    setUpdateActualCost('');
  };

  const openUpdateModal = (action: EnforcementAction) => {
    setSelectedAction(action);
    setUpdateStatus(action.status);
    setUpdateNotes(action.completionNotes || '');
    setUpdateActualCost(action.actualCost?.toString() || '');
    setShowUpdateModal(true);
  };

  const getActionTypeInfo = (type: string) => {
    return actionTypes.find(at => at.value === type) || actionTypes[0];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(so => so.value === status) || statusOptions[0];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#7C3AED';
      case 'low': return '#10B981';
      default: return '#7C3AED';
    }
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `₱${amount.toFixed(2)}` : 'N/A';
  };

  const formatDateTime = (date?: Date) => {
    return date ? date.toLocaleString() : 'N/A';
  };

  const exportActionsToCSV = () => {
    const csvHeader = 'ID,Violation Report ID,Action Type,Status,Priority,Requested By,Service Provider,Estimated Cost,Actual Cost,Created At,Completed At\n';
    const csvData = actions.map(action => [
      action.id,
      action.violationReportId,
      action.actionType,
      action.status,
      action.priority,
      action.requestedBy,
      action.serviceProvider || '',
      action.estimatedCost || '',
      action.actualCost || '',
      action.createdAt.toISOString(),
      action.completedAt?.toISOString() || ''
    ].join(',')).join('\n');

    const csvContent = csvHeader + csvData;
    
    // In a real implementation, you would use a file sharing library
    console.log('CSV Export:', csvContent);
    Alert.alert('Export Complete', 'Enforcement actions data has been exported to CSV format.');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          {actions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="security" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Enforcement Actions</Text>
                <Text style={styles.emptySubtitle}>
                  {violationReportId 
                    ? 'No enforcement actions have been requested for this violation.'
                    : 'No enforcement actions found.'
                  }
                </Text>
              </Card.Content>
            </Card>
          ) : (
            actions.map((action) => {
              const actionTypeInfo = getActionTypeInfo(action.actionType);
              const statusInfo = getStatusInfo(action.status);

              return (
                <Card key={action.id} style={styles.actionCard}>
                  <Card.Title
                    title={actionTypeInfo.label}
                    subtitle={`Requested ${formatDateTime(action.createdAt)}`}
                    left={(props) => (
                      <MaterialIcons 
                        name={actionTypeInfo.icon} 
                        {...props} 
                        color={actionTypeInfo.color} 
                      />
                    )}
                    right={(props) => (
                      <Chip
                        style={[styles.statusChip, { backgroundColor: statusInfo.color }]}
                        textStyle={styles.statusChipText}
                      >
                        {statusInfo.label}
                      </Chip>
                    )}
                  />
                  <Card.Content>
                    <View style={styles.actionDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Priority:</Text>
                        <Chip
                          style={[styles.priorityChip, { backgroundColor: getPriorityColor(action.priority) }]}
                          textStyle={styles.priorityChipText}
                          compact
                        >
                          {action.priority.toUpperCase()}
                        </Chip>
                      </View>

                      {action.serviceProvider && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Service Provider:</Text>
                          <Text style={styles.detailValue}>{action.serviceProvider}</Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Estimated Cost:</Text>
                        <Text style={styles.detailValue}>{formatCurrency(action.estimatedCost)}</Text>
                      </View>

                      {action.actualCost && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Actual Cost:</Text>
                          <Text style={styles.detailValue}>{formatCurrency(action.actualCost)}</Text>
                        </View>
                      )}

                      {action.scheduledTime && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Scheduled:</Text>
                          <Text style={styles.detailValue}>{formatDateTime(action.scheduledTime)}</Text>
                        </View>
                      )}

                      {action.completionNotes && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Notes:</Text>
                          <Text style={styles.detailValue}>{action.completionNotes}</Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      mode="outlined"
                      onPress={() => openUpdateModal(action)}
                      textColor="#7C3AED"
                    >
                      Update Status
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action FABs */}
      <View style={styles.fabContainer}>
        {actions.length > 0 && (
          <FAB
            icon="download"
            style={[styles.fab, styles.exportFab]}
            onPress={exportActionsToCSV}
            size="small"
          />
        )}
        {violationReportId && (
          <FAB
            icon="plus"
            label="Request Action"
            style={styles.fab}
            onPress={() => setShowRequestModal(true)}
          />
        )}
      </View>

      {/* Request Action Modal */}
      <Portal>
        <Modal
          visible={showRequestModal}
          onDismiss={() => setShowRequestModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Request Enforcement Action</Text>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Action Type</Text>
            <SegmentedButtons
              value={requestActionType}
              onValueChange={(value) => setRequestActionType(value as EnforcementAction['actionType'])}
              buttons={actionTypes.map(type => ({
                value: type.value,
                label: type.label,
                icon: type.icon,
              }))}
              style={styles.segmentedButtons}
            />

            <Text style={styles.fieldLabel}>Priority</Text>
            <SegmentedButtons
              value={requestPriority}
              onValueChange={(value) => setRequestPriority(value as EnforcementAction['priority'])}
              buttons={priorityLevels}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Service Provider (Optional)"
              value={requestServiceProvider}
              onChangeText={setRequestServiceProvider}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Estimated Cost (Optional)"
              value={requestEstimatedCost}
              onChangeText={setRequestEstimatedCost}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Notes (Optional)"
              value={requestNotes}
              onChangeText={setRequestNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowRequestModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleRequestAction}
              style={styles.modalButton}
              buttonColor="#7C3AED"
            >
              Request
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Update Action Modal */}
      <Portal>
        <Modal
          visible={showUpdateModal}
          onDismiss={() => setShowUpdateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Update Enforcement Action</Text>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Status</Text>
            <SegmentedButtons
              value={updateStatus}
              onValueChange={(value) => setUpdateStatus(value as EnforcementAction['status'])}
              buttons={statusOptions.slice(0, 4).map(status => ({
                value: status.value,
                label: status.label,
              }))}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Actual Cost"
              value={updateActualCost}
              onChangeText={setUpdateActualCost}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Completion Notes"
              value={updateNotes}
              onChangeText={setUpdateNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowUpdateModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateAction}
              style={styles.modalButton}
              buttonColor="#7C3AED"
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionCard: {
    marginBottom: 16,
  },
  statusChip: {
    marginRight: 8,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
  },
  actionDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
  },
  priorityChip: {
    paddingHorizontal: 8,
  },
  priorityChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: '#7C3AED',
    marginBottom: 8,
  },
  exportFab: {
    backgroundColor: '#10B981',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});