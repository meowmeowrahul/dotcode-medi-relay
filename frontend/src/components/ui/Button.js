import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Radii, Shadows } from '../../constants/Theme';

export const Button = ({ title, onPress, variant = 'primary', style, disabled = false, textStyle }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getBackgroundColor = (pressed) => {
    switch (variant) {
      case 'secondary': return Colors.secondary;
      case 'danger': return Colors.critical;
      case 'outline': return 'transparent';
      case 'primary':
      default: return pressed ? '#1C60D6' : Colors.primary; // darker when pressed
    }
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'secondary') return Colors.primary;
    return Colors.surface;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: getBackgroundColor(pressed) },
          variant === 'primary' && Shadows.soft,
          variant === 'outline' && styles.outline,
          variant === 'secondary' && styles.secondary,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2, // subtle tight tracking
  },
  disabled: {
    opacity: 0.55,
  }
});
