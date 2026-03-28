import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/Theme';
import { listDoctorIssuedTransfers, listPatientPastTransfers } from '../../../ScanImplementation/utils/api';
import { getSessionState, subscribeSession } from '../../state/userSession';

export default function HistoryTab() {
  const router = useRouter();
  const [session, setSession] = useState(getSessionState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedTimeline, setGroupedTimeline] = useState([]);

  useEffect(() => {
    return subscribeSession(setSession);
  }, []);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);

    const role = session.user?.role || 'doctor';
    const did = session.user?.did || 'DOC-DEMO-001';
    const pid = session.user?.pid || 'PID-DEMO-001';

    const result = role === 'patient'
      ? await listPatientPastTransfers(pid, { limit: 300, skip: 0 })
      : await listDoctorIssuedTransfers(did, { limit: 300, skip: 0 });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to load role-based history timeline.');
      return;
    }

    const grouped = new Map();
    for (const entry of result.data || []) {
      if (!entry.pid) continue;
      if (!grouped.has(entry.pid)) {
        grouped.set(entry.pid, []);
      }
      grouped.get(entry.pid).push(entry);
    }

    const sortedGroups = Array.from(grouped.entries())
      .map(([pid, entries]) => ({
        pid,
        entries: entries.sort((a, b) => (b.submissionTimestamp || 0) - (a.submissionTimestamp || 0)),
      }))
      .sort((a, b) => {
        const aLatest = a.entries[0]?.submissionTimestamp || 0;
        const bLatest = b.entries[0]?.submissionTimestamp || 0;
        return bLatest - aLatest;
      });

    setGroupedTimeline(sortedGroups);
  }, [session.user]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const formatVersionDate = (timestamp) => {
    if (!timestamp) return 'Unknown timestamp';
    return new Date(timestamp).toLocaleString();
  };

  const openVersion = (entry) => {
    router.push({
      pathname: '/(tabs)/scan-result',
      params: { data: JSON.stringify(entry) },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.metaText}>Loading role-based timeline...</Text>
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTimeline} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </Card>
      ) : groupedTimeline.length === 0 ? (
        <Card>
          <Text style={styles.metaText}>No transfer history yet.</Text>
        </Card>
      ) : (
        groupedTimeline.map((group) => (
          <Card key={group.pid} style={styles.groupCard}>
            <Text style={styles.groupTitle}>PID: {group.pid}</Text>
            {group.entries.map((entry) => {
              const isCurrent = !!entry.isCurrent;
              return (
                <TouchableOpacity
                  key={entry._id}
                  onPress={() => openVersion(entry)}
                  style={[styles.timelineItem, isCurrent && styles.timelineItemCurrent]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timelineTitle}>
                    {isCurrent ? 'Current Version' : 'Historical Snapshot'}
                  </Text>
                  <Text style={styles.timelineMeta}>{formatVersionDate(entry.submissionTimestamp)}</Text>
                  <Text
                    style={[
                      styles.timelineAck,
                      entry.acknowledgementStatus === 'ACKNOWLEDGED'
                        ? styles.timelineAckYes
                        : styles.timelineAckNo,
                    ]}
                  >
                    {entry.acknowledgementStatus === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Unacknowledged'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingWrap: {
    paddingTop: 40,
    alignItems: 'center',
  },
  metaText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.critical,
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    color: Colors.surface,
    fontWeight: '700',
  },
  groupCard: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
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
  timelineItemCurrent: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF2FF',
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelineMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timelineAck: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineAckYes: {
    color: '#1E7A43',
  },
  timelineAckNo: {
    color: '#A13A2A',
  },
});
