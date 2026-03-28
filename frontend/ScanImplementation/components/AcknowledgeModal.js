import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '../../src/constants/Theme';
import { acknowledgeTransfer } from '../utils/api';

export default function AcknowledgeModal({ visible, transferId, onClose, onSuccess }) {
  const [arrivalNote, setArrivalNote] = useState('');
  const [discrepancies, setDiscrepancies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      timestamp: Date.now(),
      arrivalNote: arrivalNote.trim(),
      discrepancies: discrepancies.trim(),
    };

    const result = await acknowledgeTransfer(transferId, payload);
    setLoading(false);

    if (result.success) {
      setArrivalNote('');
      setDiscrepancies('');
      setError(null);
      onSuccess(result.data);
    } else {
      setError(result.error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setArrivalNote('');
      setDiscrepancies('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Acknowledgement</Text>
              <Text style={styles.modalSubtitle}>
                Confirm receipt of the patient transfer and note any observations.
              </Text>
            </View>

            {/* Arrival Note */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Arrival Note</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={arrivalNote}
                onChangeText={setArrivalNote}
                placeholder="Patient condition on arrival, initial observations…"
                placeholderTextColor={Colors.textSecondary}
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Discrepancies */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Flag Discrepancies</Text>
              <Text style={styles.fieldHint}>
                Note any differences between the transfer record and patient&apos;s actual condition.
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={discrepancies}
                onChangeText={setDiscrepancies}
                placeholder="e.g., Patient reports different medications…"
                placeholderTextColor={Colors.textSecondary}
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Acknowledgement</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 16,
    borderTopRightRadius: 16, maxHeight: '85%',
  },
  modalScrollContent: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 13, fontWeight: 'bold', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  fieldHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, lineHeight: 18 },
  textInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  textInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  errorBanner: {
    backgroundColor: '#FFEBEE', padding: 12, borderRadius: 6,
    borderLeftWidth: 3, borderLeftColor: Colors.critical, marginBottom: 16,
  },
  errorText: { fontSize: 14, color: Colors.critical },
  buttonRow: { gap: 12, marginTop: 8 },
  button: {
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  submitButton: { backgroundColor: Colors.secondary },
  submitButtonText: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  cancelButtonText: { color: Colors.textSecondary, fontSize: 15 },
});
