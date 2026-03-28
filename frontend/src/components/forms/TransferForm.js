import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { H2, Body1 } from '../ui/Typography';
import { Colors } from '../../constants/Theme';

export const TransferForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    reason: '',
    allergies: '',
    criticalMeds: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <H2 style={styles.header}>Patient Details</H2>
        <TextInput 
          style={styles.input}
          placeholder="Patient Name"
          value={formData.patientName}
          onChangeText={(val) => handleChange('patientName', val)}
        />
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Primary Diagnosis / Reason for Transfer"
          multiline
          numberOfLines={3}
          value={formData.reason}
          onChangeText={(val) => handleChange('reason', val)}
        />
      </Card>

      <Card>
        <H2 style={styles.header}>Clinical Alerts</H2>
        <TextInput 
          style={styles.input}
          placeholder="Known Allergies (e.g. Penicillin)"
          value={formData.allergies}
          onChangeText={(val) => handleChange('allergies', val)}
        />
        <TextInput 
          style={styles.input}
          placeholder="Critical Meds (Do Not Stop)"
          value={formData.criticalMeds}
          onChangeText={(val) => handleChange('criticalMeds', val)}
        />
      </Card>

      <Button title="Generate Transfer Record" onPress={() => onSubmit(formData)} style={styles.submitBtn} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 16,
    marginBottom: 40,
  }
});
