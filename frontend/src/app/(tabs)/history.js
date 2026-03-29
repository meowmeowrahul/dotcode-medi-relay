import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Colors, Shadows } from '../../constants/Theme';
import { listDoctorIssuedTransfers, listPatientPastTransfers } from '../../../ScanImplementation/utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Pill, Clock } from 'lucide-react-native';

export default function HistoryTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedTimeline, setGroupedTimeline] = useState([]);

  const loadTimeline = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const role = user?.role || 'doctor';
    const did = user?.did || 'DOC-DEMO-001';
    const pid = user?.pid || 'PID-DEMO-001';

    const result = role === 'patient'
      ? await listPatientPastTransfers(pid, { limit: 300, skip: 0 })
      : await listDoctorIssuedTransfers(did, { limit: 300, skip: 0 });

    if (!silent) {
      setLoading(false);
    }

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
  }, [user]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTimeline({ silent: true });
    }, 2000);
    return () => clearInterval(intervalId);
  }, [loadTimeline]);

  const formatVersionDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString();
  };
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <Text style={styles.metaText}>Loading patient timelines...</Text>
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTimeline()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </Card>
      ) : groupedTimeline.length === 0 ? (
        <Card>
          <Text style={styles.metaText}>No transfer history yet.</Text>
        </Card>
      ) : (
        groupedTimeline.map((group) => (
          <View key={group.pid} style={styles.groupWrap}>
            <Text style={styles.groupTitle}>Patient ID: {group.pid}</Text>
            {group.entries.map((entry) => {
              const isCurrent = !!entry.isCurrent;
              const isAck = entry.acknowledgementStatus === 'ACKNOWLEDGED';
              return (
                <TouchableOpacity
                  key={entry._id}
                  onPress={() => openVersion(entry)}
                  style={[styles.pillCard, isCurrent && styles.pillCardCurrent]}
                  activeOpacity={0.8}
                >
                  <View style={styles.pillIconWrap}>
                    <Pill color={isCurrent ? '#FFF' : Colors.primary} size={24} />
                  </View>
                  
                  <View style={styles.pillContent}>
                    <Text style={[styles.timelineTitle, isCurrent && { color: '#FFF' }]}>
                      {isCurrent ? 'Latest Handoff' : 'Historical Record'}
                    </Text>
                    <Text style={[styles.timelineMeta, isCurrent && { color: 'rgba(255,255,255,0.8)' }]}>
                      {formatVersionDate(entry.submissionTimestamp)}
                    </Text>
                    
                    <View style={styles.statusWrap}>
                       {/* Progress Dot Indicator matching MedTech spec */}
                       <View style={[styles.statusDot, { backgroundColor: isAck ? Colors.success : Colors.textSecondary }]} />
                       <Text style={[styles.timelineAck, isAck ? styles.timelineAckYes : styles.timelineAckNo, isCurrent && { color: '#FFF' }]}>
                         {isAck ? 'Acknowledged' : 'Pending'}
                       </Text>
                    </View>
                  </View>

                  {/* Time Badge in top right corner as requested */}
                  <View style={[styles.timeBadge, isCurrent && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Clock color={isCurrent ? '#FFF' : Colors.textSecondary} size={12} style={styles.timeIcon} />
                    <Text style={[styles.timeText, isCurrent && { color: '#FFF' }]}>{formatTime(entry.submissionTimestamp)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  groupWrap: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: -0.2,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16, // Pill-like radius
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    ...Shadows.soft,
    position: 'relative',
  },
  pillCardCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 124, 255, 0.1)',
  },
  pillContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timelineMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timelineAck: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineAckYes: {
    color: Colors.success,
  },
  timelineAckNo: {
    color: Colors.textSecondary, // gray for unacknowledged
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
