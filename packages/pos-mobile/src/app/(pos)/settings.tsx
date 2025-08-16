import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Card, Button, Switch, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useBiometric } from '../../hooks/useBiometric';
import { useCashDrawer } from '../../hooks/useCashDrawer';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  const { user, signOut } = useAuth();
  const { 
    isBiometricSupported, 
    isBiometricEnabled, 
    enableBiometric, 
    disableBiometric,
    biometricType 
  } = useBiometric();
  const { isDrawerConnected, connectDrawer, disconnectDrawer } = useCashDrawer();

  const handleBiometricToggle = async () => {
    try {
      if (isBiometricEnabled) {
        await disableBiometric();
        Alert.alert('Success', 'Biometric authentication disabled');
      } else {
        const success = await enableBiometric();
        if (success) {
          Alert.alert('Success', 'Biometric authentication enabled');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCashDrawerToggle = async () => {
    try {
      if (isDrawerConnected) {
        await disconnectDrawer();
        Alert.alert('Success', 'Cash drawer disconnected');
      } else {
        const success = await connectDrawer();
        if (success) {
          Alert.alert('Success', 'Cash drawer connected');
        } else {
          Alert.alert('Error', 'Failed to connect cash drawer');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Make sure to end your shift first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const getBiometricTypeText = () => {
    if (!biometricType.length) return 'Not Available';
    
    const types = biometricType.map(type => {
      switch (type) {
        case 1: return 'Fingerprint';
        case 2: return 'Face ID';
        case 3: return 'Iris';
        default: return 'Biometric';
      }
    });
    
    return types.join(', ');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Info */}
        <Card style={styles.card}>
          <Card.Title
            title="User Information"
            left={(props) => <MaterialIcons name="person" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>POS Operator</Text>
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card style={styles.card}>
          <Card.Title
            title="Security"
            left={(props) => <MaterialIcons name="security" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <List.Item
              title="Biometric Authentication"
              description={`${getBiometricTypeText()} - ${isBiometricEnabled ? 'Enabled' : 'Disabled'}`}
              right={() => (
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={!isBiometricSupported}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Auto Lock"
              description="Lock app after 5 minutes of inactivity"
              right={() => <Switch value={true} onValueChange={() => {}} />}
            />
          </Card.Content>
        </Card>

        {/* Hardware Settings */}
        <Card style={styles.card}>
          <Card.Title
            title="Hardware"
            left={(props) => <MaterialIcons name="devices" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <List.Item
              title="Cash Drawer"
              description={`Status: ${isDrawerConnected ? 'Connected' : 'Disconnected'}`}
              right={() => (
                <Button
                  mode="outlined"
                  onPress={handleCashDrawerToggle}
                  compact
                  textColor="#7C3AED"
                >
                  {isDrawerConnected ? 'Disconnect' : 'Connect'}
                </Button>
              )}
            />
            <Divider />
            <List.Item
              title="Receipt Printer"
              description="Status: Ready"
              right={() => (
                <Button
                  mode="outlined"
                  onPress={() => Alert.alert('Info', 'Printer test functionality')}
                  compact
                  textColor="#7C3AED"
                >
                  Test Print
                </Button>
              )}
            />
            <Divider />
            <List.Item
              title="Barcode Scanner"
              description="Camera-based scanning"
              right={() => (
                <Button
                  mode="outlined"
                  onPress={() => Alert.alert('Info', 'Scanner test functionality')}
                  compact
                  textColor="#7C3AED"
                >
                  Test Scan
                </Button>
              )}
            />
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Title
            title="Application"
            left={(props) => <MaterialIcons name="settings" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <List.Item
              title="Push Notifications"
              description="Receive alerts and updates"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Sound Effects"
              description="Play sounds for actions"
              right={() => (
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Auto Sync"
              description="Automatically sync data when online"
              right={() => (
                <Switch
                  value={autoSyncEnabled}
                  onValueChange={setAutoSyncEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* System Info */}
        <Card style={styles.card}>
          <Card.Title
            title="System Information"
            left={(props) => <MaterialIcons name="info" {...props} color="#7C3AED" />}
          />
          <Card.Content>
            <View style={styles.systemInfo}>
              <Text style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Platform: </Text>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
              </Text>
              <Text style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>App Version: </Text>
                1.0.0
              </Text>
              <Text style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Build: </Text>
                {Platform.OS === 'ios' ? 'iOS Build' : 'Android Build'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Info', 'Help & Support functionality')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="help"
              >
                Help & Support
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Info', 'About Park Angel POS')}
                style={styles.actionButton}
                textColor="#7C3AED"
                icon="info"
              >
                About
              </Button>
              
              <Button
                mode="contained"
                onPress={handleSignOut}
                style={styles.signOutButton}
                buttonColor="#EF4444"
                icon="logout"
              >
                Sign Out
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
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  systemInfo: {
    gap: 8,
  },
  systemInfoItem: {
    fontSize: 14,
    color: '#374151',
  },
  systemInfoLabel: {
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderColor: '#7C3AED',
  },
  signOutButton: {
    marginTop: 8,
  },
});