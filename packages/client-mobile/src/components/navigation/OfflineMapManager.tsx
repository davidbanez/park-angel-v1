import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationService } from '../../services/navigationService';

interface OfflineMapManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface OfflineRegion {
  id: string;
  name: string;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  downloadedAt: Date;
  size: number; // in MB
}

export const OfflineMapManager: React.FC<OfflineMapManagerProps> = ({
  visible,
  onClose,
}) => {
  const [offlineRegions, setOfflineRegions] = useState<OfflineRegion[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);

  useEffect(() => {
    if (visible) {
      loadOfflineRegions();
      getCurrentLocation();
    }
  }, [visible]);

  const loadOfflineRegions = async () => {
    try {
      const regions = await AsyncStorage.getItem('offlineRegions');
      if (regions) {
        const parsedRegions = JSON.parse(regions);
        setOfflineRegions(parsedRegions);
        
        // Calculate total storage used
        const totalSize = parsedRegions.reduce((sum: number, region: OfflineRegion) => sum + region.size, 0);
        setTotalStorageUsed(totalSize);
      }
    } catch (error) {
      console.error('Error loading offline regions:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const downloadCurrentArea = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available. Please enable location services.');
      return;
    }

    Alert.alert(
      'Download Offline Maps',
      'This will download map data for a 10km radius around your current location. This may use significant data and storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: performDownload }
      ]
    );
  };

  const performDownload = async () => {
    if (!currentLocation) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.1, // ~10km radius
        longitudeDelta: 0.1,
      };

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Download offline data
      await NavigationService.downloadOfflineData(region);

      // Create offline region record
      const newRegion: OfflineRegion = {
        id: `region_${Date.now()}`,
        name: `Current Area (${new Date().toLocaleDateString()})`,
        region,
        downloadedAt: new Date(),
        size: 25 + Math.random() * 50, // Simulate size between 25-75 MB
      };

      const updatedRegions = [...offlineRegions, newRegion];
      setOfflineRegions(updatedRegions);
      await AsyncStorage.setItem('offlineRegions', JSON.stringify(updatedRegions));

      // Update total storage
      const totalSize = updatedRegions.reduce((sum, region) => sum + region.size, 0);
      setTotalStorageUsed(totalSize);

      Alert.alert('Success', 'Offline maps downloaded successfully!');
    } catch (error) {
      console.error('Error downloading offline maps:', error);
      Alert.alert('Error', 'Failed to download offline maps. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const deleteOfflineRegion = async (regionId: string) => {
    Alert.alert(
      'Delete Offline Maps',
      'Are you sure you want to delete this offline map region?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedRegions = offlineRegions.filter(region => region.id !== regionId);
            setOfflineRegions(updatedRegions);
            await AsyncStorage.setItem('offlineRegions', JSON.stringify(updatedRegions));
            
            // Update total storage
            const totalSize = updatedRegions.reduce((sum, region) => sum + region.size, 0);
            setTotalStorageUsed(totalSize);
          }
        }
      ]
    );
  };

  const clearAllOfflineMaps = async () => {
    Alert.alert(
      'Clear All Offline Maps',
      'This will delete all downloaded offline maps. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setOfflineRegions([]);
            setTotalStorageUsed(0);
            await AsyncStorage.removeItem('offlineRegions');
            await AsyncStorage.removeItem('offlineMapData');
          }
        }
      ]
    );
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offline Maps</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Storage Usage */}
          <View style={styles.storageSection}>
            <Text style={styles.sectionTitle}>Storage Usage</Text>
            <View style={styles.storageInfo}>
              <Text style={styles.storageText}>
                {formatFileSize(totalStorageUsed)} used
              </Text>
              <Text style={styles.storageSubtext}>
                {offlineRegions.length} region{offlineRegions.length !== 1 ? 's' : ''} downloaded
              </Text>
            </View>
          </View>

          {/* Download Current Area */}
          <View style={styles.downloadSection}>
            <Text style={styles.sectionTitle}>Download Maps</Text>
            <TouchableOpacity
              style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
              onPress={downloadCurrentArea}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.downloadButtonText}>
                    Downloading... {downloadProgress}%
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.downloadIcon}>📍</Text>
                  <View style={styles.downloadTextContainer}>
                    <Text style={styles.downloadButtonText}>Download Current Area</Text>
                    <Text style={styles.downloadButtonSubtext}>
                      10km radius around your location
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Downloaded Regions */}
          <View style={styles.regionsSection}>
            <View style={styles.regionsSectionHeader}>
              <Text style={styles.sectionTitle}>Downloaded Regions</Text>
              {offlineRegions.length > 0 && (
                <TouchableOpacity onPress={clearAllOfflineMaps}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {offlineRegions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🗺️</Text>
                <Text style={styles.emptyStateTitle}>No Offline Maps</Text>
                <Text style={styles.emptyStateText}>
                  Download maps for offline navigation when you don't have internet connection.
                </Text>
              </View>
            ) : (
              <View style={styles.regionsList}>
                {offlineRegions.map((region) => (
                  <View key={region.id} style={styles.regionItem}>
                    <View style={styles.regionInfo}>
                      <Text style={styles.regionName}>{region.name}</Text>
                      <Text style={styles.regionDetails}>
                        Downloaded {formatDate(region.downloadedAt)} • {formatFileSize(region.size)}
                      </Text>
                      <Text style={styles.regionCoords}>
                        {region.region.latitude.toFixed(4)}, {region.region.longitude.toFixed(4)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteOfflineRegion(region.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Offline Navigation Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About Offline Navigation</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📱</Text>
                <Text style={styles.infoText}>
                  Works without internet connection
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🗺️</Text>
                <Text style={styles.infoText}>
                  Includes basic navigation and parking spot locations
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🔄</Text>
                <Text style={styles.infoText}>
                  Real-time features require internet connection
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💾</Text>
                <Text style={styles.infoText}>
                  Maps are automatically updated when online
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  storageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  storageInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  storageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  storageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  downloadSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  downloadButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  downloadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  downloadTextContainer: {
    flex: 1,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  downloadButtonSubtext: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 2,
  },
  regionsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  regionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  regionsList: {
    gap: 12,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  regionDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  regionCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  infoSection: {
    padding: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});