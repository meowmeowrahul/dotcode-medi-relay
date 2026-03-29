import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { Colors, Shadows } from '../../constants/Theme';

export const Input = ({ style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && styles.textArea]}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={Colors.textSecondary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    overflow: 'hidden', // keeps inner input clean
  },
  containerFocused: {
    borderColor: Colors.primary,
    ...Shadows.soft,
    elevation: 4, // overwrite for android focus pop
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  }
});
