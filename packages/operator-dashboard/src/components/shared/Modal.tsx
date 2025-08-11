import React from 'react';
import { Platform } from '../utils/platform';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (Platform.isNative()) {
    const { View, Text, Modal: RNModal, TouchableOpacity, ScrollView } = require('react-native');
    
    return (
      <RNModal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-4">
          <View className={`bg-white rounded-lg w-full ${sizeClasses[size]} max-h-4/5`}>
            {title && (
              <View className="flex-row justify-between items-center p-4 border-b border-secondary-200">
                <Text className="text-lg font-semibold text-secondary-900">{title}</Text>
                <TouchableOpacity onPress={onClose} className="p-1">
                  <Text className="text-secondary-500 text-xl">×</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView className="flex-1">
              <View className="p-4">
                {children}
              </View>
            </ScrollView>
          </View>
        </View>
      </RNModal>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}>
          {title && (
            <div className="flex justify-between items-center px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <span className="text-2xl">×</span>
              </button>
            </div>
          )}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};