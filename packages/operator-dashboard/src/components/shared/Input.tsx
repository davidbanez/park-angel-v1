import React from 'react';
import { Platform } from '../utils/platform';

interface InputProps {
  value: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  required?: boolean;
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
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200';
  const errorClasses = error ? 'border-red-500' : 'border-secondary-300';
  const disabledClasses = disabled ? 'bg-secondary-100 cursor-not-allowed' : 'bg-white';
  
  const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  const handleChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    if (onChange) {
      onChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  if (Platform.isNative()) {
    const { View, Text, TextInput } = require('react-native');
    
    return (
      <View className="mb-4">
        {label && (
          <Text className="text-sm font-medium text-secondary-700 mb-1">
            {label}
            {required && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          secureTextEntry={type === 'password'}
          keyboardType={type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default'}
          editable={!disabled}
          className={inputClasses}
        />
        {error && (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        )}
      </View>
    );
  }

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};