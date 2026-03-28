import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Theme';
import { acknowledgeTransfer, updateTransfer } from '../utils/api';
import AcknowledgeModal from '../components/AcknowledgeModal';

const FIELD_LABELS = {
  pid: 'Patient ID',
  nam: 'Patient Name',
  age: 'Age',
  pd: 'Primary Diagnosis',
  rt: 'Reason for Transfer',
  alg: 'Known Allergies',
  med: 'Active Medications',
  vit: 'Vitals',
  pi: 'Pending Investigations',
  sum: 'Clinical Summary',
};

// ── KeyValueRow ──
function KeyValueRow({ label, value, isEditing, onChangeText, multiline, keyboardType }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.kvInput, multiline && styles.kvInputMultiline]}
          value={String(value ?? '')}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType || 'default'}
          placeholderTextColor={Colors.textSecondary}
        />
      ) : (
        <Text style={styles.kvValue}>{value || '—'}</Text>
      )}
    </View>
  );
}

// ── MedicationRow ──
function MedicationRow({ med, index, isEditing, onUpdate, onRemove }) {
  if (isEditing) {
    return (
      <View style={styles.medEditRow}>
        <View style={styles.medEditFields}>
          <TextInput
            style={styles.medInput}
            value={med.n}
            onChangeText={(t) => onUpdate(index, 'n', t)}
            placeholder="Drug"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.medInput, styles.medInputSmall]}
            value={med.d}
            onChangeText={(t) => onUpdate(index, 'd', t)}
            placeholder="Dose"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.medInput, styles.medInputSmall]}
            value={med.r}
            onChangeText={(t) => onUpdate(index, 'r', t)}
            placeholder="Route"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeMedBtn}>
          <Text style={styles.removeMedText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <Text style={styles.medDisplayText}>
      {'  •  '}{med.n} — {med.d} — {med.r}
    </Text>
  );
}

// ════════════════════════════════════════════════════════════
//   MAIN SCREEN
// ════════════════════════════════════════════════════════════
export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let initialData = {};
  try {
    initialData = JSON.parse(params.data || '{}');
  } catch {
    initialData = {};
  }

  const [record, setRecord] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ ...initialData });
  const [showAckModal, setShowAckModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const transferId = record._id;

  // ── Edit helpers ──
  const updateDraftField = useCallback((field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateMedField = useCallback((index, key, value) => {
    setEditDraft((prev) => {
      const meds = [...(prev.med || [])];
      meds[index] = { ...meds[index], [key]: value };
      return { ...prev, med: meds };
    });
  }, []);

  const removeMed = useCallback((index) => {
    setEditDraft((prev) => {
      const meds = [...(prev.med || [])];
      meds.splice(index, 1);
      return { ...prev, med: meds };
    });
  }, []);

  const addMed = useCallback(() => {
    setEditDraft((prev) => ({
      ...prev,
      med: [...(prev.med || []), { n: '', d: '', r: '' }],
    }));
  }, []);

  const updateVitalField = useCallback((key, value) => {
    setEditDraft((prev) => ({
      ...prev,
      vit: { ...(prev.vit || {}), [key]: value },
    }));
  }, []);

  const startEditing = () => {
    setEditDraft({ ...record });
    setIsEditing(true);
    setSaveError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditDraft({ ...record });
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const payload = {
      pid: editDraft.pid,
      nam: editDraft.nam,
      age: editDraft.age ? Number(editDraft.age) : undefined,
      pd: editDraft.pd,
      rt: editDraft.rt,
      alg: typeof editDraft.alg === 'string'
        ? editDraft.alg.split(',').map((s) => s.trim()).filter(Boolean)
        : editDraft.alg,
      med: editDraft.med,
      vit: editDraft.vit,
      pi: typeof editDraft.pi === 'string'
        ? editDraft.pi.split(',').map((s) => s.trim()).filter(Boolean)
        : editDraft.pi,
      sum: editDraft.sum,
    };

    const result = await updateTransfer(transferId, payload);
    setSaving(false);

    if (result.success) {
      const updatedRecord = result.data || { ...record, ...payload };
      setRecord(updatedRecord);
      setEditDraft(updatedRecord);
      setIsEditing(false);
      Alert.alert('Success', 'Record updated successfully.');
    } else {
      setSaveError(result.error);
    }
  };

  const handleAcknowledgeSuccess = () => {
    setShowAckModal(false);
    Alert.alert('Acknowledged', 'Transfer receipt has been acknowledged and recorded.');
  };

  // ── Formatters ──
  const formatAllergies = (alg) => {
    if (!alg || alg.length === 0) return 'None reported';
    return Array.isArray(alg) ? alg.join(', ') : String(alg);
  };

  const formatPendingInvestigations = (pi) => {
    if (!pi || pi.length === 0) return 'None';
    return Array.isArray(pi) ? pi.join(', ') : String(pi);
  };

  const formatVitals = (vit) => {
    if (!vit) return '—';
    const parts = [];
    if (vit.hr) parts.push(`HR: ${vit.hr} bpm`);
    if (vit.bp) parts.push(`BP: ${vit.bp} mmHg`);
    return parts.length > 0 ? parts.join('   |   ') : '—';
  };

  const getAllergiesEditValue = () => {
    if (typeof editDraft.alg === 'string') return editDraft.alg;
    return Array.isArray(editDraft.alg) ? editDraft.alg.join(', ') : '';
  };

  const getPiEditValue = () => {
    if (typeof editDraft.pi === 'string') return editDraft.pi;
    return Array.isArray(editDraft.pi) ? editDraft.pi.join(', ') : '';
  };

  // ════════════════════════════════════════════════════════
  //   RENDER
  // ════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ CRITICAL SECTION ═══ */}

        {/* 1. ALLERGIES */}
        <View style={styles.allergyStrip}>
          <Text style={styles.allergySectionLabel}>⚠ KNOWN ALLERGIES</Text>
          {isEditing ? (
            <TextInput
              style={styles.allergyInput}
              value={getAllergiesEditValue()}
              onChangeText={(t) => updateDraftField('alg', t)}
              placeholder="Comma-separated allergies"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          ) : (
            <Text style={styles.allergyValue}>{formatAllergies(record.alg)}</Text>
          )}
        </View>

        {/* 2. ACTIVE MEDICATIONS */}
        <View style={styles.medStrip}>
          <Text style={styles.medSectionLabel}>⚠ ACTIVE MEDICATIONS — DO NOT STOP</Text>
          {isEditing ? (
            <View>
              {(editDraft.med || []).map((med, i) => (
                <MedicationRow
                  key={i} med={med} index={i} isEditing={true}
                  onUpdate={updateMedField} onRemove={removeMed}
                />
              ))}
              <TouchableOpacity style={styles.addMedBtn} onPress={addMed}>
                <Text style={styles.addMedText}>+ Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {(record.med || []).length > 0 ? (
                record.med.map((med, i) => (
                  <MedicationRow key={i} med={med} index={i} isEditing={false} />
                ))
              ) : (
                <Text style={styles.medDisplayText}>  None reported</Text>
              )}
            </View>
          )}
        </View>

        {/* 3. REASON FOR TRANSFER */}
        <View style={styles.reasonStrip}>
          <Text style={styles.reasonLabel}>REASON FOR TRANSFER</Text>
          {isEditing ? (
            <TextInput
              style={styles.reasonInput}
              value={editDraft.rt || ''}
              onChangeText={(t) => updateDraftField('rt', t)}
              multiline
              placeholderTextColor={Colors.textSecondary}
            />
          ) : (
            <Text style={styles.reasonValue}>{record.rt || '—'}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* ═══ REMAINING FIELDS ═══ */}
        <KeyValueRow
          label={FIELD_LABELS.pid}
          value={isEditing ? editDraft.pid : record.pid}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('pid', t)}
        />
        <KeyValueRow
          label={FIELD_LABELS.nam}
          value={isEditing ? editDraft.nam : record.nam}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('nam', t)}
        />
        <KeyValueRow
          label={FIELD_LABELS.age}
          value={isEditing ? String(editDraft.age ?? '') : record.age ? `${record.age} years` : '—'}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('age', t)}
          keyboardType="numeric"
        />
        <KeyValueRow
          label={FIELD_LABELS.pd}
          value={isEditing ? editDraft.pd : record.pd}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('pd', t)}
          multiline
        />

        {/* Vitals */}
        <View style={styles.kvRow}>
          <Text style={styles.kvLabel}>{FIELD_LABELS.vit}</Text>
          {isEditing ? (
            <View style={styles.vitalsEditRow}>
              <View style={styles.vitalField}>
                <Text style={styles.vitalSubLabel}>HR (bpm)</Text>
                <TextInput
                  style={styles.kvInput}
                  value={String(editDraft.vit?.hr ?? '')}
                  onChangeText={(t) => updateVitalField('hr', t ? Number(t) : undefined)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.vitalField}>
                <Text style={styles.vitalSubLabel}>BP</Text>
                <TextInput
                  style={styles.kvInput}
                  value={editDraft.vit?.bp ?? ''}
                  onChangeText={(t) => updateVitalField('bp', t)}
                  placeholder="e.g. 120/80"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.kvValue}>{formatVitals(record.vit)}</Text>
          )}
        </View>

        <KeyValueRow
          label={FIELD_LABELS.pi}
          value={isEditing ? getPiEditValue() : formatPendingInvestigations(record.pi)}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('pi', t)}
          multiline
        />
        <KeyValueRow
          label={FIELD_LABELS.sum}
          value={isEditing ? editDraft.sum : record.sum}
          isEditing={isEditing}
          onChangeText={(t) => updateDraftField('sum', t)}
          multiline
        />

        {/* Save error */}
        {saveError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Error: {saveError}</Text>
          </View>
        )}

        {/* ═══ ACTION BUTTONS ═══ */}
        <View style={styles.actionSection}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave} disabled={saving} activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.actionButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelEditButton]}
                onPress={cancelEditing} activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acknowledgeButton]}
                onPress={() => setShowAckModal(true)} activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Send Acknowledgement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={startEditing} activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Update / Edit Record</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <AcknowledgeModal
        visible={showAckModal}
        transferId={transferId}
        onClose={() => setShowAckModal(false)}
        onSuccess={handleAcknowledgeSuccess}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Critical strips
  allergyStrip: {
    backgroundColor: '#FFEBEE', padding: 16,
    borderBottomWidth: 2, borderBottomColor: Colors.critical,
  },
  allergySectionLabel: {
    fontSize: 13, fontWeight: 'bold', color: Colors.critical,
    letterSpacing: 0.5, marginBottom: 6,
  },
  allergyValue: {
    fontSize: 20, fontWeight: 'bold', color: Colors.critical, textTransform: 'uppercase',
  },
  allergyInput: {
    fontSize: 18, fontWeight: 'bold', color: Colors.critical,
    borderBottomWidth: 1, borderBottomColor: Colors.critical, paddingVertical: 4,
  },
  medStrip: { backgroundColor: Colors.warning, padding: 16 },
  medSectionLabel: {
    fontSize: 13, fontWeight: 'bold', color: Colors.surface,
    letterSpacing: 0.5, marginBottom: 8,
  },
  medDisplayText: { fontSize: 15, color: Colors.surface, lineHeight: 24, fontWeight: '500' },
  medEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  medEditFields: { flex: 1, flexDirection: 'row', gap: 6 },
  medInput: {
    flex: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, color: Colors.textPrimary,
  },
  medInputSmall: { flex: 1 },
  removeMedBtn: {
    marginLeft: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  removeMedText: { color: Colors.surface, fontSize: 14, fontWeight: 'bold' },
  addMedBtn: {
    marginTop: 8, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 6, borderStyle: 'dashed',
  },
  addMedText: { color: Colors.surface, fontSize: 14, fontWeight: '600' },
  reasonStrip: {
    backgroundColor: Colors.background, padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  reasonLabel: {
    fontSize: 13, fontWeight: 'bold', color: Colors.primary,
    letterSpacing: 0.5, marginBottom: 6,
  },
  reasonValue: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, lineHeight: 24 },
  reasonInput: {
    fontSize: 16, color: Colors.textPrimary, borderBottomWidth: 1,
    borderBottomColor: Colors.primary, paddingVertical: 4,
  },

  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16, marginVertical: 8 },

  // Key-Value rows
  kvRow: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  kvLabel: {
    fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  kvValue: { fontSize: 16, color: Colors.textPrimary, lineHeight: 22 },
  kvInput: {
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: Colors.surface,
  },
  kvInputMultiline: { minHeight: 60, textAlignVertical: 'top' },

  vitalsEditRow: { flexDirection: 'row', gap: 12 },
  vitalField: { flex: 1 },
  vitalSubLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },

  errorBanner: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFEBEE',
    padding: 12, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: Colors.critical,
  },
  errorText: { fontSize: 14, color: Colors.critical },

  actionSection: { padding: 16, paddingTop: 24, gap: 12 },
  actionButton: {
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', minHeight: 56,
  },
  acknowledgeButton: { backgroundColor: Colors.secondary },
  editButton: { backgroundColor: Colors.primary },
  saveButton: { backgroundColor: Colors.secondary },
  cancelEditButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary },
  actionButtonText: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' },
});
