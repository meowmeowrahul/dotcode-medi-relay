import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radii, Shadows } from '../../constants/Theme';

export const Card = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card, // 16px radius
    padding: 16,
    marginBottom: 16,
    borderWidth: 1, // subtle border 
    borderColor: Colors.border,
    ...Shadows.soft, // 0 4px 20px soft shadow
  }
});
