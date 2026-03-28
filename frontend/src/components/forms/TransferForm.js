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
    age: '',
    patientId: '',
    primaryDiagnosis: '',
    med: [{ n: '', d: '', r: '' }],
    allergies: '',
    transferReason: '',
    vit: { hr: '', bp: '' },
    pendingInvestigations: '',
    clinicalSummary: '',
  });
  const voiceDictationEnabled = false; // temporarily disabled
  const isListening = false;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMedicationChange = (index, key, value) => {
    setFormData((prev) => {
      const meds = [...prev.med];
      meds[index] = { ...meds[index], [key]: value };
      return { ...prev, med: meds };
    });
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      med: [...prev.med, { n: '', d: '', r: '' }],
    }));
  };

  const removeMedication = (index) => {
    setFormData((prev) => {
      const meds = [...prev.med];
      meds.splice(index, 1);
      return {
        ...prev,
        med: meds.length > 0 ? meds : [{ n: '', d: '', r: '' }],
      };
    });
  };

  const handleVitalsChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      vit: { ...prev.vit, [key]: value },
    }));
  };

  const buildSubmitPayload = () => {
    const normalizedMedications = (formData.med || [])
      .map((med) => ({
        n: String(med.n || '').trim(),
        d: String(med.d || '').trim(),
        r: String(med.r || '').trim(),
      }))
      .filter((med) => med.n || med.d || med.r)
      .filter((med) => med.n && med.d && med.r);

    const hrValue = String(formData.vit?.hr ?? '').trim();
    const bpValue = String(formData.vit?.bp ?? '').trim();
    const normalizedVitals = {
      hr: hrValue ? Number.parseInt(hrValue, 10) : undefined,
      bp: bpValue || undefined,
    };

    if (normalizedVitals.hr !== undefined && Number.isNaN(normalizedVitals.hr)) {
      normalizedVitals.hr = undefined;
    }

    const medicationSummary = normalizedMedications
      .map((med) => `${med.n} | ${med.d} | ${med.r}`)
      .join('; ');
    const vitalsSummaryParts = [];
    if (normalizedVitals.hr !== undefined) vitalsSummaryParts.push(`HR: ${normalizedVitals.hr}`);
    if (normalizedVitals.bp) vitalsSummaryParts.push(`BP: ${normalizedVitals.bp}`);

    return {
      ...formData,
      med: normalizedMedications,
      vit: normalizedVitals,
      activeMedications: medicationSummary,
      lastVitals: vitalsSummaryParts.join(' | '),
      age: formData.age ? Number.parseInt(String(formData.age), 10) : undefined,
    };
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
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={formData.age}
          keyboardType="numeric"
          onChangeText={(val) => handleChange('age', val)}
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
        <H2 style={styles.subHeader}>Active Medications</H2>
        {(formData.med || []).map((med, index) => (
          <View key={index} style={styles.medRow}>
            <TextInput
              style={[styles.input, styles.medInput]}
              placeholder="Drug"
              value={med.n}
              onChangeText={(val) => handleMedicationChange(index, 'n', val)}
            />
            <TextInput
              style={[styles.input, styles.medInputSmall]}
              placeholder="Dose"
              value={med.d}
              onChangeText={(val) => handleMedicationChange(index, 'd', val)}
            />
            <TextInput
              style={[styles.input, styles.medInputSmall]}
              placeholder="Route"
              value={med.r}
              onChangeText={(val) => handleMedicationChange(index, 'r', val)}
            />
            <TouchableOpacity onPress={() => removeMedication(index)} style={styles.removeMedBtn}>
              <Text style={styles.removeMedText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addMedBtn} onPress={addMedication}>
          <Text style={styles.addMedText}>+ Add Medication</Text>
        </TouchableOpacity>

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
        <H2 style={styles.subHeader}>Vitals</H2>
        <View style={styles.vitalsRow}>
          <TextInput
            style={[styles.input, styles.vitalInput]}
            placeholder="HR (bpm)"
            keyboardType="numeric"
            value={String(formData.vit?.hr ?? '')}
            onChangeText={(val) => handleVitalsChange('hr', val)}
          />
          <TextInput
            style={[styles.input, styles.vitalInput]}
            placeholder="BP (e.g., 120/80)"
            value={String(formData.vit?.bp ?? '')}
            onChangeText={(val) => handleVitalsChange('bp', val)}
          />
        </View>
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

      <Button title="Generate Transfer Record" onPress={() => onSubmit(buildSubmitPayload())} style={styles.submitBtn} />
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
  subHeader: {
    marginBottom: 10,
    fontSize: 18,
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
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medInput: {
    flex: 2,
  },
  medInputSmall: {
    flex: 1,
  },
  addMedBtn: {
    marginTop: -4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addMedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  removeMedBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  removeMedText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalInput: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 16,
    marginBottom: 40,
  }
});
