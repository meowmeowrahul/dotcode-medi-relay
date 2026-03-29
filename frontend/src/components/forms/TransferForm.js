import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { H2, Body1 } from '../ui/Typography';
import { Colors } from '../../constants/Theme';
import { Input } from '../ui/Input';

const SUMMARY_MAX_CHARACTERS = 200;

export const TransferForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    fromHospital: '',
    toHospital: '',
    bloodGroup: '',
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
  const voiceDictationEnabled = false; 
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
      did: String(formData.doctorId || '').trim() || undefined,
      doctorId: String(formData.doctorId || '').trim() || undefined,
      fromHospital: String(formData.fromHospital || '').trim(),
      toHospital: String(formData.toHospital || '').trim(),
      bloodGroup: String(formData.bloodGroup || '').trim(),
      med: normalizedMedications,
      vit: normalizedVitals,
      activeMedications: medicationSummary,
      lastVitals: vitalsSummaryParts.join(' | '),
      age: formData.age ? Number.parseInt(String(formData.age), 10) : undefined,
    };
  };

  const summaryCharCount = useMemo(() => {
    return String(formData.clinicalSummary || '').length;
  }, [formData.clinicalSummary]);

  const isSummaryOverLimit = summaryCharCount > SUMMARY_MAX_CHARACTERS;

  const handleSummaryChange = (value) => {
    setFormData((prev) => ({ ...prev, clinicalSummary: value }));
  };

  const handleSubmit = () => {
    if (isSummaryOverLimit) {
      Alert.alert(
        'Summary too long',
        `Clinical Summary must be ${SUMMARY_MAX_CHARACTERS} characters or fewer (including spaces and line breaks).`
      );
      return;
    }
    onSubmit(buildSubmitPayload());
  };

  const startVoiceDictation = () => {
    Alert.alert('Voice dictation disabled', 'This feature is temporarily turned off for testing.');
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <H2 style={styles.header}>Patient Identifiers</H2>
        <Input
          placeholder="Doctor ID"
          value={formData.doctorId}
          onChangeText={(val) => handleChange('doctorId', val)}
        />
        <Input
          placeholder="From Hospital"
          value={formData.fromHospital}
          onChangeText={(val) => handleChange('fromHospital', val)}
        />
        <Input
          placeholder="To Hospital"
          value={formData.toHospital}
          onChangeText={(val) => handleChange('toHospital', val)}
        />
        <Input
          placeholder="Blood Group (e.g. O+, AB-)"
          value={formData.bloodGroup}
          onChangeText={(val) => handleChange('bloodGroup', val)}
        />
        <Input
          placeholder="Full name"
          value={formData.patientName}
          onChangeText={(val) => handleChange('patientName', val)}
        />
        <Input
          placeholder="MRN / Patient ID"
          value={formData.patientId}
          onChangeText={(val) => handleChange('patientId', val)}
        />
        <Input
          placeholder="Age"
          value={formData.age}
          keyboardType="numeric"
          onChangeText={(val) => handleChange('age', val)}
        />
      </Card>

      <Card>
        <H2 style={styles.header}>Clinical Information</H2>
        <Input
          placeholder="Primary diagnosis"
          multiline
          numberOfLines={3}
          value={formData.primaryDiagnosis}
          onChangeText={(val) => handleChange('primaryDiagnosis', val)}
        />
        <H2 style={styles.subHeader}>Active Medications</H2>
        {(formData.med || []).map((med, index) => (
          <View key={index} style={styles.medRow}>
            <Input
              style={styles.medInput}
              placeholder="Drug"
              value={med.n}
              onChangeText={(val) => handleMedicationChange(index, 'n', val)}
            />
            <Input
              style={styles.medInputSmall}
              placeholder="Dose"
              value={med.d}
              onChangeText={(val) => handleMedicationChange(index, 'd', val)}
            />
            <Input
              style={styles.medInputSmall}
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

        <Input
          placeholder="Known allergies"
          multiline
          numberOfLines={2}
          value={formData.allergies}
          onChangeText={(val) => handleChange('allergies', val)}
        />
        <Input
          placeholder="Reason for transfer"
          multiline
          numberOfLines={3}
          value={formData.transferReason}
          onChangeText={(val) => handleChange('transferReason', val)}
        />
        <H2 style={styles.subHeader}>Vitals</H2>
        <View style={styles.vitalsRow}>
          <Input
            style={styles.vitalInput}
            placeholder="HR (bpm)"
            keyboardType="numeric"
            value={String(formData.vit?.hr ?? '')}
            onChangeText={(val) => handleVitalsChange('hr', val)}
          />
          <Input
            style={styles.vitalInput}
            placeholder="BP (e.g., 120/80)"
            value={String(formData.vit?.bp ?? '')}
            onChangeText={(val) => handleVitalsChange('bp', val)}
          />
        </View>
        <Input
          placeholder="Pending investigations"
          multiline
          numberOfLines={3}
          value={formData.pendingInvestigations}
          onChangeText={(val) => handleChange('pendingInvestigations', val)}
        />
      </Card>

      <Card>
        <View style={styles.summaryHeader}>
          <H2 style={styles.header}>Clinical Summary (max 200 characters)</H2>
          <TouchableOpacity style={styles.micButton} onPress={startVoiceDictation} disabled={!voiceDictationEnabled}>
            <Text style={[styles.micIcon, isListening && styles.micActive]}>{isListening ? '●' : '🎤'}</Text>
          </TouchableOpacity>
        </View>
        <Input
          style={styles.summaryInput}
          placeholder="Concise clinical narrative"
          multiline
          numberOfLines={6}
          value={formData.clinicalSummary}
          onChangeText={handleSummaryChange}
        />
        <Body1 style={[styles.helperText, isSummaryOverLimit && styles.helperTextError]}>
          {summaryCharCount}/{SUMMARY_MAX_CHARACTERS} characters
        </Body1>
      </Card>

      <Button title="Generate Transfer Record" onPress={handleSubmit} style={styles.submitBtn} />
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
    marginBottom: 16, // spaced out
  },
  subHeader: {
    marginBottom: 12,
    fontSize: 18,
  },
  summaryInput: {
    minHeight: 140,
  },
  helperText: {
    textAlign: 'right',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  helperTextError: {
    color: '#B00020',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    elevation: 1,
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
    alignItems: 'flex-start',
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  addMedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  removeMedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  removeMedText: {
    fontSize: 16,
    color: Colors.critical,
    fontWeight: '700',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalInput: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 40,
  }
});
