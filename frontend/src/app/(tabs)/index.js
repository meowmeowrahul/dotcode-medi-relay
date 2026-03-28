import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Button, Alert, Text } from 'react-native';
import { TransferForm } from '../../components/forms/TransferForm';
import { Colors } from '../../constants/Theme';
import GenerateQR from '../../components/GenerateQR';
import { createTransfer } from '../../../ScanImplementation/utils/api';
import { getSessionState, setSessionState, subscribeSession } from '../../state/userSession';

const DUMMY_ROLE = 'patient';
const DUMMY_DOCTOR_ID = 'DOC-DEMO-001';
const DUMMY_PATIENT_ID = 'PID-DEMO-001';

export default function SenderTab() {
  const [formData, setFormData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(getSessionState());

  useEffect(() => {
    return subscribeSession(setSession);
  }, []);

  useEffect(() => {
    const user = session.user || {};
    if (!user.role || !user.did || !user.pid) {
      setSessionState({
        user: {
          ...user,
          role: user.role || DUMMY_ROLE,
          did: user.did || DUMMY_DOCTOR_ID,
          pid: user.pid || DUMMY_PATIENT_ID,
        },
      });
    }
  }, [session.user]);

  const userRole = session.user?.role || DUMMY_ROLE;
  const doctorId = session.user?.did || DUMMY_DOCTOR_ID;

  const handleSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        did: doctorId,
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
      {userRole === 'patient' ? (
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyTitle}>Issuer access disabled</Text>
          <Text style={styles.readOnlyText}>Patients cannot issue transfer QRs. Use Recipient to scan and view records.</Text>
        </View>
      ) : null}

      {userRole === 'doctor' && (formData ? (
        <View style={styles.qrSection}>
          <GenerateQR formData={formData} />
          <View style={styles.buttonContainer}>
            <Button title="Create Another Form" onPress={() => setFormData(null)} color="#0047AB" disabled={submitting} />
          </View>
        </View>
      ) : (
        <TransferForm onSubmit={handleSubmit} />
      ))}
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
  },
  readOnlyBox: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  readOnlyTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  readOnlyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  }
});
