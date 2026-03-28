import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';

export const Badge = ({ text, type = 'warning', style }) => {
  const backgroundColor = type === 'critical' ? Colors.critical : Colors.warning;

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  }
});
