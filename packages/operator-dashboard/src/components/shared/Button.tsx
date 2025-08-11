import React from 'react';
import { Platform } from '../utils/platform';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) => {
  const handlePress = onPress || onClick;

  const baseClasses =
    'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center';

  const variantClasses = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary:
      'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700',
    outline:
      'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses =
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  if (Platform.isNative()) {
    // React Native implementation
    const { TouchableOpacity, Text } = require('react-native');

    return (
      <TouchableOpacity
        onPress={disabled || loading ? undefined : handlePress}
        className={classes}
        disabled={disabled || loading}
      >
        {loading && <LoadingSpinner size='sm' />}
        <Text className={`${loading ? 'ml-2' : ''}`}>{children}</Text>
      </TouchableOpacity>
    );
  }

  // Web implementation
  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : handlePress}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {loading && <LoadingSpinner size='sm' />}
      <span className={loading ? 'ml-2' : ''}>{children}</span>
    </button>
  );
};

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-white border-t-transparent ${sizeClasses[size]}`}
    />
  );
};
