import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { NavigationService, VoiceGuidanceSettings as VoiceSettings } from '../../services/navigationService';

interface VoiceGuidanceSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceGuidanceSettings: React.FC<VoiceGuidanceSettingsProps> = ({
  visible,
  onClose,
}) => {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    language: 'en',
    volume: 0.8,
    announceDistance: 100,
  });

  useEffect(() => {
    loadSettings();
  }, [visible]);

  const loadSettings = async () => {
    // In a real implementation, this would load from NavigationService
    // For now, we'll use default settings
    setSettings({
      enabled: true,
      language: 'en',
      volume: 0.8,
      announceDistance: 100,
    });
  };

  const handleSettingChange = async (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await NavigationService.setVoiceGuidance(newSettings);
    } catch (error) {
      console.error('Error updating voice settings:', error);
      Alert.alert('Error', 'Failed to update voice guidance settings.');
    }
  };

  const testVoiceGuidance = async () => {
    try {
      // Test voice guidance with current settings
      await NavigationService.setVoiceGuidance(settings);
      
      // In a real implementation, this would use the actual TTS service
      Alert.alert(
        'Voice Test',
        'Voice guidance test would play here with current settings.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error testing voice guidance:', error);
      Alert.alert('Error', 'Failed to test voice guidance.');
    }
  };

  const getLanguageName = (code: string): string => {
    switch (code) {
      case 'en': return 'English';
      case 'fil': return 'Filipino';
      default: return 'English';
    }
  };

  const getDistanceText = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
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
          <Text style={styles.headerTitle}>Voice Guidance</Text>
          <TouchableOpacity onPress={testVoiceGuidance} style={styles.testButton}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enable/Disable Voice Guidance */}
          <View style={styles.settingSection}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Voice Guidance</Text>
                <Text style={styles.settingDescription}>
                  Enable spoken turn-by-turn directions
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => handleSettingChange('enabled', value)}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={settings.enabled ? '#8B5CF6' : '#9CA3AF'}
              />
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* Language Selection */}
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Language</Text>
                <View style={styles.languageOptions}>
                  {['en', 'fil'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.languageOption,
                        settings.language === lang && styles.selectedLanguageOption
                      ]}
                      onPress={() => handleSettingChange('language', lang)}
                    >
                      <Text style={[
                        styles.languageOptionText,
                        settings.language === lang && styles.selectedLanguageOptionText
                      ]}>
                        {getLanguageName(lang)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Volume Control */}
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Volume</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>🔈</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={settings.volume}
                    onValueChange={(value) => handleSettingChange('volume', value)}
                    minimumTrackTintColor="#8B5CF6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbStyle={{ backgroundColor: '#8B5CF6' }}
                  />
                  <Text style={styles.sliderLabel}>🔊</Text>
                </View>
                <Text style={styles.sliderValue}>
                  {Math.round(settings.volume * 100)}%
                </Text>
              </View>

              {/* Announcement Distance */}
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Announcement Distance</Text>
                <Text style={styles.settingDescription}>
                  How far before a turn to announce instructions
                </Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Near</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={50}
                    maximumValue={500}
                    step={25}
                    value={settings.announceDistance}
                    onValueChange={(value) => handleSettingChange('announceDistance', value)}
                    minimumTrackTintColor="#8B5CF6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbStyle={{ backgroundColor: '#8B5CF6' }}
                  />
                  <Text style={styles.sliderLabel}>Far</Text>
                </View>
                <Text style={styles.sliderValue}>
                  {getDistanceText(settings.announceDistance)}
                </Text>
              </View>

              {/* Voice Guidance Tips */}
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Tips</Text>
                <View style={styles.tipsContainer}>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipIcon}>💡</Text>
                    <Text style={styles.tipText}>
                      Voice guidance works best with headphones or Bluetooth audio
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipIcon}>🔋</Text>
                    <Text style={styles.tipText}>
                      Voice guidance may use more battery during navigation
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipIcon}>🎵</Text>
                    <Text style={styles.tipText}>
                      Music will be paused automatically during announcements
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
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
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  settingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedLanguageOption: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedLanguageOptionText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    textAlign: 'center',
    marginTop: 4,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});