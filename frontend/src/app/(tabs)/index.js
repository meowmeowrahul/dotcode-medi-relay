import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { TransferForm } from '../../components/forms/TransferForm';
import { Colors } from '../../constants/Theme';
import GenerateQR from '../../components/GenerateQR';
import { createTransfer } from '../../../ScanImplementation/utils/api';

export default function SenderTab() {
  const [formData, setFormData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        submissionTimestamp: Date.now(),
      };

      const result = await createTransfer(payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit transfer');
      }

      setFormData(data);
      Alert.alert('Submitted', 'Transfer submitted to backend successfully.');
    } catch (error) {
      Alert.alert('Submission failed', error.message || 'Unable to submit transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {formData ? (
        <View style={styles.qrSection}>
          <GenerateQR formData={formData} />
          <View style={styles.buttonContainer}>
            <Button title="Create Another Form" onPress={() => setFormData(null)} color="#0047AB" disabled={submitting} />
          </View>
        </View>
      ) : (
        <TransferForm onSubmit={handleSubmit} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  qrSection: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  }
});
