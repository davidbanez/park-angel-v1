import React from 'react';
import { Platform } from '../utils/platform';

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'size'
  > {
  value: string | number;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  label,
  className = '',
  required = false,
  size = 'md',
  ...rest
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg',
  };

  const baseClasses =
    'w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200';
  const errorClasses = error ? 'border-red-500' : 'border-secondary-300';
  const disabledClasses = disabled
    ? 'bg-secondary-100 cursor-not-allowed'
    : 'bg-white';

  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${disabledClasses} ${className}`;

  const handleChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    if (onChange) {
      onChange({
        target: { value: text },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  if (Platform.isNative()) {
    const { View, Text, TextInput } = require('react-native');

    return (
      <View className='mb-4'>
        {label && (
          <Text className='text-sm font-medium text-secondary-700 mb-1'>
            {label}
            {required && <Text className='text-red-500 ml-1'>*</Text>}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          secureTextEntry={type === 'password'}
          keyboardType={
            type === 'email'
              ? 'email-address'
              : type === 'number'
                ? 'numeric'
                : 'default'
          }
          editable={!disabled}
          className={inputClasses}
        />
        {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
      </View>
    );
  }

  return (
    <div className='mb-4'>
      {label && (
        <label className='block text-sm font-medium text-secondary-700 mb-1'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...rest}
      />
      {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
    </div>
  );
};
