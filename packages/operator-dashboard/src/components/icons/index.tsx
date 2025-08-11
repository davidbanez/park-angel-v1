import React from 'react';
import { Platform } from '../utils/platform';

interface IconProps {
  color?: string;
  size?: number;
}

export const DashboardIcon: React.FC<IconProps> = ({ color = '#64748b', size = 24 }) => {
  if (Platform.isNative()) {
    const { Text } = require('react-native');
    return <Text style={{ color, fontSize: size }}>📊</Text>;
  }
  return <span style={{ color, fontSize: size }}>📊</span>;
};

export const ParkingIcon: React.FC<IconProps> = ({ color = '#64748b', size = 24 }) => {
  if (Platform.isNative()) {
    const { Text } = require('react-native');
    return <Text style={{ color, fontSize: size }}>🅿️</Text>;
  }
  return <span style={{ color, fontSize: size }}>🅿️</span>;
};

export const PricingIcon: React.FC<IconProps> = ({ color = '#64748b', size = 24 }) => {
  if (Platform.isNative()) {
    const { Text } = require('react-native');
    return <Text style={{ color, fontSize: size }}>💰</Text>;
  }
  return <span style={{ color, fontSize: size }}>💰</span>;
};

export const CustomersIcon: React.FC<IconProps> = ({ color = '#64748b', size = 24 }) => {
  if (Platform.isNative()) {
    const { Text } = require('react-native');
    return <Text style={{ color, fontSize: size }}>👥</Text>;
  }
  return <span style={{ color, fontSize: size }}>👥</span>;
};

export const ReportsIcon: React.FC<IconProps> = ({ color = '#64748b', size = 24 }) => {
  if (Platform.isNative()) {
    const { Text } = require('react-native');
    return <Text style={{ color, fontSize: size }}>📈</Text>;
  }
  return <span style={{ color, fontSize: size }}>📈</span>;
};