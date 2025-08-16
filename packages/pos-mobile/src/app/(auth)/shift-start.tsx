import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePOSSession } from '../../hooks/usePOSSession';
import { useCashDrawer } from '../../hooks/useCashDrawer';

export default function ShiftStartScreen() {
  const [previousCash, setPreviousCash] = useState('');
  const [currentCash, setCurrentCash] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { startShift } = usePOSSession();
  const { openDrawer, isDrawerConnected } = useCashDrawer();

  const handleStartShift = async () => {
    const prevAmount = parseFloat(previousCash);
    const currAmount = parseFloat(currentCash);

    if (isNaN(prevAmount) || isNaN(currAmount)) {
      Alert.alert('Error', 'Please enter valid cash amounts');
      return;
    }

    if (currAmount < prevAmount) {
      Alert.alert('Error', 'Current cash cannot be less than previous cash');
      return;
    }

    setLoading(true);
    try {
      // For now, use a default location ID - in production this would be selected by the user
      const defaultLocationId = 'default-location-id';
      
      await startShift({
        previousCashAmount: prevAmount,
        currentCashAmount: currAmount,
        locationId: defaultLocationId,
        startTime: new Date(),
      });

      // Open cash drawer for verification
      if (isDrawerConnected) {
        await openDrawer();
      }

      router.replace('/(pos)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async () => {
    try {
      await openDrawer();
    } catch (error: any) {
      Alert.alert('Cash Drawer Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title 
            title="Start New Shift" 
            subtitle="Enter cash amounts to begin POS operations"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Text style={styles.sectionTitle}>Cash Validation</Text>
            <Text style={styles.description}>
              Enter the previous cashier's ending cash amount and your current cash count
            </Text>

            <TextInput
              label="Previous Cashier's Cash Amount"
              value={previousCash}
              onChangeText={setPreviousCash}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              left={<TextInput.Icon icon="currency-php" />}
            />

            <TextInput
              label="Current Cash on Hand"
              value={currentCash}
              onChangeText={setCurrentCash}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              theme={{ colors: { primary: '#7C3AED' } }}
              left={<TextInput.Icon icon="currency-php" />}
            />

            <Divider style={styles.divider} />

            <View style={styles.drawerSection}>
              <Text style={styles.sectionTitle}>Cash Drawer</Text>
              <Text style={styles.drawerStatus}>
                Status: {isDrawerConnected ? 'Connected' : 'Disconnected'}
              </Text>
              
              <Button
                mode="outlined"
                onPress={handleOpenDrawer}
                disabled={!isDrawerConnected}
                style={styles.drawerButton}
                textColor="#7C3AED"
              >
                Open Cash Drawer
              </Button>
            </View>

            <Button
              mode="contained"
              onPress={handleStartShift}
              loading={loading}
              disabled={loading || !previousCash || !currentCash}
              style={styles.startButton}
              buttonColor="#7C3AED"
            >
              Start Shift
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Shift Requirements</Text>
            <Text style={styles.infoText}>
              • Verify cash amounts before starting{'\n'}
              • Ensure cash drawer is connected{'\n'}
              • Receipt printer should be ready{'\n'}
              • Camera access for license plate scanning
            </Text>
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
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    color: '#7C3AED',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 20,
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  drawerButton: {
    borderColor: '#7C3AED',
    marginBottom: 20,
  },
  startButton: {
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4C1D95',
    lineHeight: 20,
  },
});