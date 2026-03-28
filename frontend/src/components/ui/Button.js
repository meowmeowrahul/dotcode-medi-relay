import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';

export const Button = ({ title, onPress, variant = 'primary', style, disabled = false }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary': return Colors.secondary;
      case 'danger': return Colors.critical;
      case 'outline': return 'transparent';
      case 'primary':
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return Colors.primary;
    return Colors.surface;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style
      ]} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Massive, obvious as per guidelines
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.55,
  }
});
