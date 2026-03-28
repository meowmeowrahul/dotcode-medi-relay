import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';
import { H1, H2, Body1, Body2 } from '../ui/Typography';
import { Badge } from '../ui/Badge';

export const HeroSummary = ({ patient }) => {
  return (
    <View style={styles.container}>
      {/* Top Warning Strip */}
      {patient?.allergies && (
        <View style={styles.alertStrip}>
          <H1 critical>ALLERGIES: {patient.allergies.toUpperCase()}</H1>
        </View>
      )}

      {patient?.criticalMeds && (
        <View style={styles.warningStrip}>
          <Badge type="warning" text="⚠️ DO NOT STOP: " style={styles.medswarning} />
          <Body1 style={{ color: Colors.surface, fontWeight: 'bold' }}>
            {patient.criticalMeds}
          </Body1>
        </View>
      )}

      <View style={styles.content}>
        <H2>{patient?.name || 'Unknown Patient'}</H2>
        <Body2>Transferring from: {patient?.senderHospital || 'Unknown'}</Body2>
        
        <View style={styles.reasonBlock}>
          <Body2 style={styles.label}>Primary Reason for Transfer:</Body2>
          <H2>{patient?.reason || 'Not specified'}</H2>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  alertStrip: {
    backgroundColor: '#FFEBEE', // Very light red background for high contrast with critical red
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.critical,
  },
  warningStrip: {
    backgroundColor: Colors.warning,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  medswarning: {
    marginRight: 8,
  },
  content: {
    padding: 16,
  },
  reasonBlock: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  label: {
    marginBottom: 4,
  }
});
