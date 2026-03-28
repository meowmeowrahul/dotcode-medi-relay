import React, { useState, useCallback, useEffect } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/Theme';
import {
  updateTransfer,
  getCurrentTransferByPid,
  getTransferTimelineByPid,
  getTransferVersionByTimestamp,
} from '../utils/api';
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
  const medicationName = med?.n || med?.name || '';
  const medicationDose = med?.d || med?.dose || '';
  const medicationRoute = med?.r || med?.route || '';

  if (isEditing) {
    return (
      <View style={styles.medEditRow}>
        <View style={styles.medEditFields}>
          <TextInput
            style={styles.medInput}
            value={medicationName}
            onChangeText={(t) => onUpdate(index, 'n', t)}
            placeholder="Drug"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.medInput, styles.medInputSmall]}
            value={medicationDose}
            onChangeText={(t) => onUpdate(index, 'd', t)}
            placeholder="Dose"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.medInput, styles.medInputSmall]}
            value={medicationRoute}
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

  const displayParts = [medicationName, medicationDose, medicationRoute].filter(Boolean);
  return (
    <Text style={styles.medDisplayText}>
      {'  •  '}{displayParts.length > 0 ? displayParts.join(' — ') : 'Unknown medication'}
    </Text>
  );
}

// ════════════════════════════════════════════════════════════
//   MAIN SCREEN
// ════════════════════════════════════════════════════════════
export default function ScanResultScreen() {
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
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [activeVersionTimestamp, setActiveVersionTimestamp] = useState(initialData.submissionTimestamp || null);
  const [isHistoricalView, setIsHistoricalView] = useState(false);

  const transferId = record._id;
  const pid = record.pid || initialData.pid;

  const refreshTimeline = useCallback(async (patientId) => {
    if (!patientId) return;
    setTimelineLoading(true);
    const timelineResult = await getTransferTimelineByPid(patientId);
    setTimelineLoading(false);

    if (timelineResult.success) {
      setTimeline(timelineResult.data || []);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCurrent = async () => {
      if (!pid) return;
      setRecordLoading(true);

      const currentResult = await getCurrentTransferByPid(pid);
      if (isMounted && currentResult.success && currentResult.data) {
        setRecord(currentResult.data);
        setEditDraft(currentResult.data);
        setActiveVersionTimestamp(currentResult.data.submissionTimestamp || null);
        setIsHistoricalView(false);
      }

      if (isMounted) {
        setRecordLoading(false);
      }

      if (isMounted) {
        await refreshTimeline(pid);
      }
    };

    loadCurrent();

    return () => {
      isMounted = false;
    };
  }, [pid, refreshTimeline]);

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
    if (isHistoricalView) {
      Alert.alert('Read-only version', 'Historical timeline snapshots cannot be edited.');
      return;
    }
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
    if (!transferId) {
      setSaveError('Current record ID is missing. Please rescan the QR and try again.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const updateTimestamp = Date.now();

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
      timestamp: updateTimestamp,
    };

    const result = await updateTransfer(transferId, payload);
    setSaving(false);

    if (result.success) {
      const updatedRecord = result.data || { ...record, ...payload };
      setRecord(updatedRecord);
      setEditDraft(updatedRecord);
      setActiveVersionTimestamp(updatedRecord.submissionTimestamp || updateTimestamp);
      setIsHistoricalView(false);
      setIsEditing(false);
      await refreshTimeline(updatedRecord.pid || pid);
      Alert.alert('Success', 'Record updated successfully.');
    } else {
      setSaveError(result.error);
    }
  };

  const openTimelineVersion = async (timestamp) => {
    if (!pid || !timestamp) return;

    if (timestamp === activeVersionTimestamp && isHistoricalView) {
      return;
    }

    setRecordLoading(true);
    const versionResult = await getTransferVersionByTimestamp(pid, timestamp);
    setRecordLoading(false);

    if (!versionResult.success) {
      Alert.alert('Unable to open version', versionResult.error || 'Failed to load version snapshot.');
      return;
    }

    const versionRecord = versionResult.data;
    setRecord(versionRecord);
    setEditDraft(versionRecord);
    setActiveVersionTimestamp(versionRecord.submissionTimestamp || timestamp);
    setIsEditing(false);
    setIsHistoricalView(!versionRecord.isCurrent);
  };

  const goToCurrentVersion = async () => {
    if (!pid) return;
    setRecordLoading(true);
    const currentResult = await getCurrentTransferByPid(pid);
    setRecordLoading(false);

    if (!currentResult.success || !currentResult.data) {
      Alert.alert('Unable to load current version', currentResult.error || 'Please rescan the QR and try again.');
      return;
    }

    setRecord(currentResult.data);
    setEditDraft(currentResult.data);
    setActiveVersionTimestamp(currentResult.data.submissionTimestamp || null);
    setIsHistoricalView(false);
    setIsEditing(false);
    await refreshTimeline(pid);
  };

  const handleAcknowledgeSuccess = async (acknowledgedRecord) => {
    setShowAckModal(false);
    if (acknowledgedRecord) {
      setRecord(acknowledgedRecord);
      setEditDraft(acknowledgedRecord);
      setActiveVersionTimestamp(acknowledgedRecord.submissionTimestamp || activeVersionTimestamp);
    }
    await refreshTimeline(pid);
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
    if (parts.length > 0) return parts.join('   |   ');
    if (typeof vit.raw === 'string' && vit.raw.trim().length > 0) return vit.raw;
    return '—';
  };

  const getAllergiesEditValue = () => {
    if (typeof editDraft.alg === 'string') return editDraft.alg;
    return Array.isArray(editDraft.alg) ? editDraft.alg.join(', ') : '';
  };

  const getPiEditValue = () => {
    if (typeof editDraft.pi === 'string') return editDraft.pi;
    return Array.isArray(editDraft.pi) ? editDraft.pi.join(', ') : '';
  };

  const formatVersionDate = (timestamp) => {
    if (!timestamp) return 'Unknown timestamp';
    return new Date(timestamp).toLocaleString();
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
        {recordLoading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={Colors.surface} />
            <Text style={styles.loadingBannerText}>Loading transfer version...</Text>
          </View>
        )}

        <View style={styles.timelineContainer}>
          <Text style={styles.timelineHeading}>Version Timeline</Text>
          {timelineLoading ? (
            <Text style={styles.timelineMeta}>Fetching timeline...</Text>
          ) : timeline.length === 0 ? (
            <Text style={styles.timelineMeta}>No saved timeline versions found.</Text>
          ) : (
            timeline.map((entry) => {
              const isActive = entry.submissionTimestamp === activeVersionTimestamp;
              return (
                <TouchableOpacity
                  key={entry._id}
                  onPress={() => openTimelineVersion(entry.submissionTimestamp)}
                  style={[styles.timelineItem, isActive && styles.timelineItemActive]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timelineItemTitle}>
                    {entry.isCurrent ? 'Current Version' : 'Historical Snapshot'}
                  </Text>
                  <Text style={styles.timelineItemMeta}>{formatVersionDate(entry.submissionTimestamp)}</Text>
                  <Text
                    style={[
                      styles.timelineAckStatus,
                      entry.acknowledgementStatus === 'ACKNOWLEDGED'
                        ? styles.timelineAckStatusAck
                        : styles.timelineAckStatusUnack,
                    ]}
                  >
                    {entry.acknowledgementStatus === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Unacknowledged'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          {isHistoricalView && (
            <View style={styles.readOnlyBanner}>
              <Text style={styles.readOnlyText}>You are viewing a read-only historical snapshot.</Text>
              <TouchableOpacity onPress={goToCurrentVersion} style={styles.currentVersionBtn} activeOpacity={0.8}>
                <Text style={styles.currentVersionBtnText}>Open Current Editable Version</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
          ) : !isHistoricalView ? (
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
          ) : null}
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

  loadingBanner: {
    margin: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBannerText: {
    marginLeft: 10,
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  timelineContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  timelineMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timelineItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  timelineItemActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF2FF',
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelineItemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timelineAckStatus: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineAckStatusAck: {
    color: '#1E7A43',
  },
  timelineAckStatusUnack: {
    color: '#A13A2A',
  },
  readOnlyBanner: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFDF7E',
  },
  readOnlyText: {
    fontSize: 13,
    color: '#8A6D1F',
    marginBottom: 8,
    fontWeight: '600',
  },
  currentVersionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  currentVersionBtnText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },

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
