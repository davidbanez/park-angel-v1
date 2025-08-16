import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Card, Button, Divider, DataTable, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { usePOS } from '../../providers/POSProvider';
import { useRouter } from 'expo-router';

export default function ShiftSummaryScreen() {
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { currentSession, generateShiftReport, createCashRemittance } = usePOS();
  const router = useRouter();

  useEffect(() => {
    loadShiftReport();
  }, []);

  const loadShiftReport = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const report = await generateShiftReport();
      setShiftReport(report);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate shift report');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRemittance = async () => {
    if (!currentSession || !shiftReport) return;

    Alert.alert(
      'Create Cash Remittance',
      'This will create a record for cash deposit. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createCashRemittance({
                amount: shiftReport.cashSummary.actualCash || shiftReport.cashSummary.expectedCash,
                depositMethod: 'bank_deposit',
                depositDate: new Date(),
                notes: 'End of shift cash remittance'
              });
              Alert.alert('Success', 'Cash remittance record created');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to create remittance');
            }
          }
        }
      ]
    );
  };

  const handleShareReport = async () => {
    if (!shiftReport) return;

    const reportText = `
POS Shift Summary Report
========================

Session ID: ${shiftReport.sessionId}
Generated: ${new Date(shiftReport.generatedAt).toLocaleString()}

CASH SUMMARY
------------
Starting Cash: ₱${shiftReport.cashSummary.startingCash?.toFixed(2) || '0.00'}
Cash Sales: ₱${shiftReport.cashSummary.cashSales?.toFixed(2) || '0.00'}
Adjustments: ₱${shiftReport.cashSummary.cashAdjustments?.toFixed(2) || '0.00'}
Deposits: ₱${shiftReport.cashSummary.cashDeposits?.toFixed(2) || '0.00'}
Expected Cash: ₱${shiftReport.cashSummary.expectedCash?.toFixed(2) || '0.00'}
Actual Cash: ₱${shiftReport.cashSummary.actualCash?.toFixed(2) || 'Not counted'}
Difference: ₱${shiftReport.cashSummary.difference?.toFixed(2) || '0.00'}

TRANSACTIONS
------------
Total Transactions: ${shiftReport.totalTransactions}
Parking Fees: ${shiftReport.transactionBreakdown.parkingFees}
Violation Fees: ${shiftReport.transactionBreakdown.violationFees}
Refunds: ${shiftReport.transactionBreakdown.refunds}
Adjustments: ${shiftReport.transactionBreakdown.adjustments}

RECONCILIATION
--------------
Status: ${shiftReport.reconciliationStatus}
    `;

    try {
      await Share.share({
        message: reportText,
        title: 'POS Shift Summary Report'
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.noSessionText}>No active POS session</Text>
            <Text style={styles.noSessionSubtext}>Please start a shift to view summary</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.loadingText}>Generating shift report...</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!shiftReport) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.noReportText}>Unable to generate shift report</Text>
            <Button
              mode="outlined"
              onPress={loadShiftReport}
              style={styles.retryButton}
              textColor="#7C3AED"
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Report Header */}
        <Card style={styles.card}>
          <Card.Title
            title="Shift Summary Report"
            subtitle={`Generated: ${new Date(shiftReport.generatedAt).toLocaleString()}`}
            left={(props: any) => <MaterialIcons name="assessment" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.headerInfo}>
              <Text style={styles.sessionId}>Session ID: {shiftReport.sessionId}</Text>
              <Chip
                icon={shiftReport.reconciliationStatus === 'balanced' ? 'check-circle' : 'alert-circle'}
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: shiftReport.reconciliationStatus === 'balanced' ? '#D1FAE5' : '#FEE2E2' 
                  }
                ]}
                textStyle={{ 
                  color: shiftReport.reconciliationStatus === 'balanced' ? '#065F46' : '#991B1B' 
                }}
              >
                {shiftReport.reconciliationStatus === 'balanced' ? 'Balanced' : 'Variance'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Cash Summary */}
        <Card style={styles.card}>
          <Card.Title
            title="Cash Summary"
            left={(props: any) => <MaterialIcons name="account-balance-wallet" {...props} color="#10B981" />}
          />
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Starting Cash:</Text>
              <Text style={styles.summaryValue}>
                ₱{shiftReport.cashSummary.startingCash?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cash Sales:</Text>
              <Text style={styles.summaryValue}>
                ₱{shiftReport.cashSummary.cashSales?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Adjustments:</Text>
              <Text style={styles.summaryValue}>
                ₱{shiftReport.cashSummary.cashAdjustments?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Deposits:</Text>
              <Text style={styles.summaryValue}>
                -₱{shiftReport.cashSummary.cashDeposits?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Expected Cash:</Text>
              <Text style={styles.summaryValueBold}>
                ₱{shiftReport.cashSummary.expectedCash?.toFixed(2) || '0.00'}
              </Text>
            </View>
            {shiftReport.cashSummary.actualCash !== undefined && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Actual Cash:</Text>
                  <Text style={styles.summaryValue}>
                    ₱{shiftReport.cashSummary.actualCash.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Difference:</Text>
                  <Text style={[
                    styles.summaryValue,
                    { 
                      color: (shiftReport.cashSummary.difference || 0) >= 0 ? '#10B981' : '#EF4444' 
                    }
                  ]}>
                    {(shiftReport.cashSummary.difference || 0) >= 0 ? '+' : ''}₱{shiftReport.cashSummary.difference?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Transaction Summary */}
        <Card style={styles.card}>
          <Card.Title
            title="Transaction Summary"
            left={(props: any) => <MaterialIcons name="receipt" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Type</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
              </DataTable.Header>

              <DataTable.Row>
                <DataTable.Cell>Parking Fees</DataTable.Cell>
                <DataTable.Cell numeric>{shiftReport.transactionBreakdown.parkingFees}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Violation Fees</DataTable.Cell>
                <DataTable.Cell numeric>{shiftReport.transactionBreakdown.violationFees}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Refunds</DataTable.Cell>
                <DataTable.Cell numeric>{shiftReport.transactionBreakdown.refunds}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Adjustments</DataTable.Cell>
                <DataTable.Cell numeric>{shiftReport.transactionBreakdown.adjustments}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell style={styles.totalCell}>Total Transactions</DataTable.Cell>
                <DataTable.Cell numeric style={styles.totalCell}>
                  <Text style={styles.totalValue}>{shiftReport.totalTransactions}</Text>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>

        {/* Cash Drawer Operations */}
        {shiftReport.drawerOperations && shiftReport.drawerOperations.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Cash Drawer Operations"
              left={(props: any) => <MaterialIcons name="inbox" {...props} color="#F59E0B" />}
            />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Operation</DataTable.Title>
                  <DataTable.Title numeric>Amount</DataTable.Title>
                  <DataTable.Title>Time</DataTable.Title>
                </DataTable.Header>

                {shiftReport.drawerOperations.slice(0, 5).map((operation: any, index: number) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{operation.type}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {operation.amount ? `₱${operation.amount.toFixed(2)}` : '-'}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {new Date(operation.timestamp).toLocaleTimeString()}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleShareReport}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="share"
              >
                Share Report
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateRemittance}
                style={styles.actionButton}
                buttonColor="#10B981"
                icon="account-balance"
              >
                Create Remittance
              </Button>
            </View>
            <Button
              mode="contained"
              onPress={() => router.replace('/(pos)/dashboard')}
              style={[styles.actionButton, { backgroundColor: '#7C3AED', marginTop: 12 }]}
              icon="dashboard"
            >
              Back to Dashboard
            </Button>
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
  noSessionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  noSessionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noReportText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    borderColor: '#7C3AED',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionId: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  divider: {
    marginVertical: 12,
  },
  totalCell: {
    backgroundColor: '#F3F4F6',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
});