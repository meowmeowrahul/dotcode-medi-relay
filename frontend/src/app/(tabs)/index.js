import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Alert, Text, TouchableOpacity } from 'react-native';
import { TransferForm } from '../../components/forms/TransferForm';
import { Colors, Shadows } from '../../constants/Theme';
import GenerateQR from '../../components/GenerateQR';
import { createTransfer } from '../../../ScanImplementation/utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus } from 'lucide-react-native';

export default function SenderTab() {
  const [formData, setFormData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const userRole = String(user?.role || '').toLowerCase();
  const doctorId = user?.did || user?.id || user?.username || '';

  const handleSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        did: data.did || data.doctorId || doctorId,
        submissionTimestamp: Date.now(),
      };

      const result = await createTransfer(payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit transfer');
      }

      const createdRecordId = result.data?._id || result.data?.id || result.data?.recordId;
      setFormData({
        ...data,
        ...result.data,
        recordId: createdRecordId,
        patientName: data.patientName || result.data?.nam,
        doctorId: data.doctorId || result.data?.did,
      });
      setShowForm(false);
      Alert.alert('Submitted', 'Transfer submitted to backend successfully.');
    } catch (error) {
      Alert.alert('Submission failed', error.message || 'Unable to submit transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole !== 'doctor') {
    return (
      <View style={styles.container}>
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyTitle}>Issuer access disabled</Text>
          <Text style={styles.readOnlyText}>Patients cannot issue transfer QRs. Use Recipient to scan and view records.</Text>
        </View>
      </View>
    );
  }

  // Dashboard Overview View (When form is not active and no QR is generated)
  const renderDashboard = () => (
    <View style={styles.dashboard}>
      <View style={styles.dashHeader}>
        <Text style={styles.dashTitle}>Hello, Dr. {user?.username || 'Clinician'}</Text>
        <Text style={styles.dashSubtitle}>Here is your activity for today.</Text>
      </View>
      
      <View style={{ height: 120, marginBottom: 24 }} />

      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Ready to begin a clinical handoff?</Text>
        <Text style={styles.emptySub}>Tap the + button below to start tracking a patient transfer.</Text>
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => setShowForm(true)}
      >
        <Plus color="#FFF" size={28} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {showForm ? (
        <ScrollView style={styles.formScroll}>
           <TransferForm onSubmit={handleSubmit} />
           <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
             <Text style={styles.cancelText}>Cancel</Text>
           </TouchableOpacity>
        </ScrollView>
      ) : formData ? (
        <ScrollView contentContainerStyle={styles.qrSection}>
          <GenerateQR formData={formData} />
          <TouchableOpacity style={styles.finishBtn} onPress={() => setFormData(null)}>
            <Text style={styles.finishText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        renderDashboard()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dashboard: {
    flex: 1,
    paddingTop: 16,
  },
  dashHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dashTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  dashSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  formScroll: {
    flex: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 40,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  qrSection: {
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  finishText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  readOnlyBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
