import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Typography as ThemeTypography, Colors } from '../../constants/Theme';

export const H1 = ({ children, style, critical = false }) => (
  <Text style={[styles.h1, critical && { color: Colors.critical }, style]}>
    {children}
  </Text>
);

export const H2 = ({ children, style }) => (
  <Text style={[styles.h2, style]}>
    {children}
  </Text>
);

export const Body1 = ({ children, style }) => (
  <Text style={[styles.body1, style]}>
    {children}
  </Text>
);

export const Body2 = ({ children, style }) => (
  <Text style={[styles.body2, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  h1: ThemeTypography.h1,
  h2: ThemeTypography.h2,
  body1: ThemeTypography.body1,
  body2: ThemeTypography.body2,
});
