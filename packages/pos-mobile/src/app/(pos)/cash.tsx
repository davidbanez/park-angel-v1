import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Button, TextInput, DataTable, Chip, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { usePOS } from '../../providers/POSProvider';
import { useCashDrawer } from '../../hooks/useCashDrawer';

export default function CashScreen() {
  const [countAmount, setCountAmount] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('');
  const [isCountingCash, setIsCountingCash] = useState(false);

  // Denomination tracking
  const [denominations, setDenominations] = useState({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0,
    '0.25': 0,
    '0.10': 0,
    '0.05': 0,
    '0.01': 0,
  });
  
  const { 
    currentSession, 
    cashSummary, 
    performCashCount, 
    makeCashAdjustment, 
    recordCashDeposit,
    endSession,
    loading: posLoading,
    refreshSession
  } = usePOS();
  const { openDrawer, isDrawerConnected } = useCashDrawer();

  useEffect(() => {
    if (currentSession) {
      refreshSession();
    }
  }, [currentSession?.id]);

  const handleOpenDrawer = async () => {
    try {
      await openDrawer();
    } catch (error: any) {
      Alert.alert('Cash Drawer Error', error.message);
    }
  };

  const calculateTotal = () => {
    return Object.entries(denominations).reduce((total, [denom, count]) => {
      return total + (parseFloat(denom) * count);
    }, 0);
  };

  const updateDenomination = (denom: string, count: number) => {
    setDenominations(prev => ({
      ...prev,
      [denom]: Math.max(0, count)
    }));
  };

  const handleCashCount = async () => {
    const totalAmount = calculateTotal();
    
    if (totalAmount <= 0) {
      Alert.alert('Error', 'Please count the cash denominations');
      return;
    }

    setIsCountingCash(true);
    try {
      await performCashCount({
        denominations,
        totalAmount,
        notes: countAmount
      });
      
      Alert.alert('Success', `Cash count recorded: ₱${totalAmount.toFixed(2)}`);
      setCountAmount('');
      setDenominations(Object.keys(denominations).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record cash count');
    } finally {
      setIsCountingCash(false);
    }
  };

  const handleCashAdjustment = async (type: 'add' | 'remove') => {
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid adjustment amount');
      return;
    }

    if (!adjustmentReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the adjustment');
      return;
    }

    try {
      await makeCashAdjustment({
        amount,
        reason: adjustmentReason,
        type
      });
      
      const action = type === 'add' ? 'added to' : 'removed from';
      Alert.alert('Success', `₱${amount.toFixed(2)} ${action} cash drawer`);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to make cash adjustment');
    }
  };

  const handleCashDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }

    if (!depositReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the deposit');
      return;
    }

    try {
      await recordCashDeposit({
        amount,
        reason: depositReason,
        depositMethod: 'safe_deposit'
      });
      
      Alert.alert('Success', `₱${amount.toFixed(2)} deposited from cash drawer`);
      setDepositAmount('');
      setDepositReason('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record cash deposit');
    }
  };

  const handleEndShift = () => {
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your shift? Please count your cash first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: () => {
            const endCash = calculateTotal() || currentSession?.currentCashAmount || 0;
            endSession(endCash, 'Shift ended from POS app');
          },
        },
      ]
    );
  };

  const mockTransactions = [
    { id: '1', description: 'Parking Fee - Car', amount: 50, time: '10:30 AM' },
    { id: '2', description: 'Parking Fee - Motorcycle', amount: 20, time: '11:15 AM' },
    { id: '3', description: 'Senior Discount Applied', amount: -10, time: '11:45 AM' },
    { id: '4', description: 'Parking Fee - Van', amount: 75, time: '12:20 PM' },
  ];

  const isLoading = isCountingCash || posLoading;

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.noSessionText}>No active POS session</Text>
            <Text style={styles.noSessionSubtext}>Please start a shift to access cash management</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Cash Summary */}
        {cashSummary && (
          <Card style={styles.card}>
            <Card.Title
              title="Cash Summary"
              subtitle={`Shift started: ${currentSession.startTime ? new Date(currentSession.startTime).toLocaleTimeString() : 'N/A'}`}
              left={(props: any) => <MaterialIcons name="account-balance-wallet" {...props} color="#10B981" />}
            />
            <Card.Content>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Starting Cash:</Text>
                <Text style={styles.summaryValue}>₱{cashSummary.startingCash?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cash Sales:</Text>
                <Text style={styles.summaryValue}>₱{cashSummary.cashSales?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Adjustments:</Text>
                <Text style={styles.summaryValue}>₱{cashSummary.cashAdjustments?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Deposits:</Text>
                <Text style={styles.summaryValue}>-₱{cashSummary.cashDeposits?.toFixed(2) || '0.00'}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>Expected Cash:</Text>
                <Text style={styles.summaryValueBold}>₱{cashSummary.expectedCash?.toFixed(2) || '0.00'}</Text>
              </View>
              {cashSummary.actualCash !== undefined && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Actual Cash:</Text>
                    <Text style={styles.summaryValue}>₱{cashSummary.actualCash.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Difference:</Text>
                    <Text style={[
                      styles.summaryValue,
                      { color: (cashSummary.difference || 0) >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {(cashSummary.difference || 0) >= 0 ? '+' : ''}₱{cashSummary.difference?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Cash Drawer Control */}
        <Card style={styles.card}>
          <Card.Title
            title="Cash Drawer"
            left={(props: any) => <MaterialIcons name="inbox" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.drawerStatus}>
              <Chip 
                icon={isDrawerConnected ? 'check-circle' : 'alert-circle'}
                style={[
                  styles.statusChip,
                  { backgroundColor: isDrawerConnected ? '#D1FAE5' : '#FEE2E2' }
                ]}
                textStyle={{ color: isDrawerConnected ? '#065F46' : '#991B1B' }}
              >
                {isDrawerConnected ? 'Connected' : 'Disconnected'}
              </Chip>
            </View>
            <Button
              mode="contained"
              onPress={handleOpenDrawer}
              disabled={!isDrawerConnected}
              style={styles.drawerButton}
              buttonColor="#7C3AED"
              icon="open-in-new"
            >
              Open Cash Drawer
            </Button>
          </Card.Content>
        </Card>

        {/* Cash Count with Denominations */}
        <Card style={styles.card}>
          <Card.Title
            title="Cash Count"
            subtitle="Count physical cash in drawer"
            left={(props: any) => <MaterialIcons name="calculate" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <Text style={styles.denominationTitle}>Bills</Text>
            {['1000', '500', '200', '100', '50', '20'].map(denom => (
              <View key={denom} style={styles.denominationRow}>
                <Text style={styles.denominationLabel}>₱{denom}</Text>
                <View style={styles.denominationControls}>
                  <Button
                    mode="outlined"
                    onPress={() => updateDenomination(denom, denominations[denom] - 1)}
                    style={styles.denominationButton}
                    compact
                  >
                    -
                  </Button>
                  <Text style={styles.denominationCount}>{denominations[denom]}</Text>
                  <Button
                    mode="outlined"
                    onPress={() => updateDenomination(denom, denominations[denom] + 1)}
                    style={styles.denominationButton}
                    compact
                  >
                    +
                  </Button>
                </View>
                <Text style={styles.denominationTotal}>
                  ₱{(parseFloat(denom) * denominations[denom]).toFixed(2)}
                </Text>
              </View>
            ))}

            <Text style={[styles.denominationTitle, { marginTop: 16 }]}>Coins</Text>
            {['10', '5', '1', '0.25', '0.10', '0.05', '0.01'].map(denom => (
              <View key={denom} style={styles.denominationRow}>
                <Text style={styles.denominationLabel}>₱{denom}</Text>
                <View style={styles.denominationControls}>
                  <Button
                    mode="outlined"
                    onPress={() => updateDenomination(denom, denominations[denom] - 1)}
                    style={styles.denominationButton}
                    compact
                  >
                    -
                  </Button>
                  <Text style={styles.denominationCount}>{denominations[denom]}</Text>
                  <Button
                    mode="outlined"
                    onPress={() => updateDenomination(denom, denominations[denom] + 1)}
                    style={styles.denominationButton}
                    compact
                  >
                    +
                  </Button>
                </View>
                <Text style={styles.denominationTotal}>
                  ₱{(parseFloat(denom) * denominations[denom]).toFixed(2)}
                </Text>
              </View>
            ))}

            <Divider style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Count:</Text>
              <Text style={styles.totalValue}>₱{calculateTotal().toFixed(2)}</Text>
            </View>

            <TextInput
              label="Notes (optional)"
              value={countAmount}
              onChangeText={setCountAmount}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              multiline
            />

            <Button
              mode="contained"
              onPress={handleCashCount}
              loading={isLoading}
              disabled={isLoading || calculateTotal() <= 0}
              style={styles.countButton}
              buttonColor="#10B981"
              icon="check"
            >
              Record Cash Count
            </Button>
          </Card.Content>
        </Card>

        {/* Cash Adjustment */}
        <Card style={styles.card}>
          <Card.Title
            title="Cash Adjustment"
            subtitle="Add or remove cash from drawer"
            left={(props: any) => <MaterialIcons name="tune" {...props} color="#F59E0B" />}
          />
          <Card.Content>
            <TextInput
              label="Adjustment Amount"
              value={adjustmentAmount}
              onChangeText={setAdjustmentAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              left={<TextInput.Icon icon="currency-php" />}
            />
            
            <TextInput
              label="Reason for Adjustment"
              value={adjustmentReason}
              onChangeText={setAdjustmentReason}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
            />
            
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => handleCashAdjustment('add')}
                loading={isLoading}
                disabled={isLoading || !adjustmentAmount || !adjustmentReason}
                style={[styles.halfButton, { backgroundColor: '#10B981' }]}
              >
                Add Cash
              </Button>
              <Button
                mode="contained"
                onPress={() => handleCashAdjustment('remove')}
                loading={isLoading}
                disabled={isLoading || !adjustmentAmount || !adjustmentReason}
                style={[styles.halfButton, { backgroundColor: '#EF4444' }]}
              >
                Remove Cash
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Cash Deposit */}
        <Card style={styles.card}>
          <Card.Title
            title="Cash Deposit"
            subtitle="Record cash removal for deposit"
            left={(props: any) => <MaterialIcons name="account-balance" {...props} color="#F59E0B" />}
          />
          <Card.Content>
            <TextInput
              label="Deposit Amount"
              value={depositAmount}
              onChangeText={setDepositAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              left={<TextInput.Icon icon="currency-php" />}
            />
            <TextInput
              label="Deposit Reason"
              value={depositReason}
              onChangeText={setDepositReason}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              multiline
            />
            <Button
              mode="contained"
              onPress={handleCashDeposit}
              loading={isLoading}
              disabled={isLoading || !depositAmount || !depositReason}
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            >
              Record Deposit
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card style={styles.card}>
          <Card.Title
            title="Recent Transactions"
            left={(props) => <MaterialIcons name="receipt" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
                <DataTable.Title>Time</DataTable.Title>
              </DataTable.Header>

              {mockTransactions.map((transaction) => (
                <DataTable.Row key={transaction.id}>
                  <DataTable.Cell>{transaction.description}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={{
                      color: transaction.amount >= 0 ? '#10B981' : '#EF4444',
                      fontWeight: '600'
                    }}>
                      ₱{Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>{transaction.time}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* End Shift */}
        <Card style={[styles.card, styles.endShiftCard]}>
          <Card.Content>
            <View style={styles.endShiftContent}>
              <MaterialIcons name="exit-to-app" size={32} color="#EF4444" />
              <View style={styles.endShiftText}>
                <Text style={styles.endShiftTitle}>End Shift</Text>
                <Text style={styles.endShiftSubtitle}>
                  Complete your shift and generate summary report
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={handleEndShift}
                buttonColor="#EF4444"
                icon="stop"
              >
                End Shift
              </Button>
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
  drawerStatus: {
    marginBottom: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  drawerButton: {
    paddingVertical: 8,
  },
  denominationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  denominationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  denominationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 60,
  },
  denominationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  denominationButton: {
    minWidth: 40,
    borderColor: '#7C3AED',
  },
  denominationCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  denominationTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  input: {
    marginBottom: 16,
  },
  countButton: {
    paddingVertical: 8,
  },
  actionButton: {
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 8,
  },
  endShiftCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  endShiftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  endShiftText: {
    flex: 1,
  },
  endShiftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  endShiftSubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
  },
});