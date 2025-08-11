import React from 'react';
import { Platform } from '../utils/platform';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'secondary';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    secondary: 'border-secondary-500 border-t-transparent',
  };

  const classes = `animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  if (Platform.isNative()) {
    const { View } = require('react-native');
    return <View className={classes} />;
  }

  return <div className={classes} />;
};