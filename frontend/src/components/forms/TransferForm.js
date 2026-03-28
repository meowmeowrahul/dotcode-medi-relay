import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { H2, Body1 } from '../ui/Typography';
import { Colors } from '../../constants/Theme';

export const TransferForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    primaryDiagnosis: '',
    activeMedications: '',
    allergies: '',
    transferReason: '',
    lastVitals: '',
    pendingInvestigations: '',
    clinicalSummary: '',
  });
  const voiceDictationEnabled = false; // temporarily disabled
  const isListening = false;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const wordCount = useMemo(() => {
    if (!formData.clinicalSummary.trim()) return 0;
    return formData.clinicalSummary.trim().split(/\s+/).length;
  }, [formData.clinicalSummary]);

  const applySummaryWithLimit = (text) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const limitedWords = words.slice(0, 200);
    const limitedText = limitedWords.join(' ');
    setFormData(prev => ({ ...prev, clinicalSummary: limitedText }));
    if (words.length > 200) {
      Alert.alert('Summary truncated', 'Only the first 200 words were kept.');
    }
  };

  const handleSummaryChange = (value) => {
    applySummaryWithLimit(value);
  };

  const startVoiceDictation = () => {
    Alert.alert('Voice dictation disabled', 'This feature is temporarily turned off for testing.');
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <H2 style={styles.header}>Patient Identifiers</H2>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={formData.patientName}
          onChangeText={(val) => handleChange('patientName', val)}
        />
        <TextInput
          style={styles.input}
          placeholder="MRN / Patient ID"
          value={formData.patientId}
          onChangeText={(val) => handleChange('patientId', val)}
        />
      </Card>

      <Card>
        <H2 style={styles.header}>Clinical Information</H2>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Primary diagnosis"
          multiline
          numberOfLines={3}
          value={formData.primaryDiagnosis}
          onChangeText={(val) => handleChange('primaryDiagnosis', val)}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Active medications (include dose & route)"
          multiline
          numberOfLines={4}
          value={formData.activeMedications}
          onChangeText={(val) => handleChange('activeMedications', val)}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Known allergies"
          multiline
          numberOfLines={2}
          value={formData.allergies}
          onChangeText={(val) => handleChange('allergies', val)}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Reason for transfer"
          multiline
          numberOfLines={3}
          value={formData.transferReason}
          onChangeText={(val) => handleChange('transferReason', val)}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Last set of vitals (e.g., HR, BP, RR, Temp, SpO2)"
          multiline
          numberOfLines={3}
          value={formData.lastVitals}
          onChangeText={(val) => handleChange('lastVitals', val)}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Pending investigations"
          multiline
          numberOfLines={3}
          value={formData.pendingInvestigations}
          onChangeText={(val) => handleChange('pendingInvestigations', val)}
        />
      </Card>

      <Card>
        <View style={styles.summaryHeader}>
          <H2 style={styles.header}>Clinical Summary (max 200 words)</H2>
          <TouchableOpacity style={styles.micButton} onPress={startVoiceDictation} disabled={!voiceDictationEnabled}>
            <Text style={[styles.micIcon, isListening && styles.micActive]}>{isListening ? '●' : '🎤'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, styles.textArea, styles.summaryInput]}
          placeholder="Concise clinical narrative"
          multiline
          numberOfLines={6}
          value={formData.clinicalSummary}
          onChangeText={handleSummaryChange}
        />
        <Body1 style={styles.helperText}>{wordCount}/200 words</Body1>
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
  summaryInput: {
    minHeight: 140,
  },
  helperText: {
    textAlign: 'right',
    color: Colors.textSecondary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  micIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  micActive: {
    color: Colors.primary,
  },
  submitBtn: {
    marginTop: 16,
    marginBottom: 40,
  }
});
