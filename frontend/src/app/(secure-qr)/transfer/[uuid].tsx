import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/Theme';
import { API_BASE } from '@/utils/authApi';
import { getToken } from '@/utils/authStorage';

type TransferRecord = {
  _id?: string;
  pid?: string;
  nam?: string;
  pd?: string;
  status?: string;
};

type ValidationResult = {
  success: boolean;
  data?: {
    uuid: string;
    record: TransferRecord;
  };
  error?: string;
};

export default function SecureQrTransferRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();

  const uuid = useMemo(() => {
    const value = params?.uuid;
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<TransferRecord | null>(null);

  useEffect(() => {
    let active = true;

    async function runValidation() {
      if (!uuid) {
        if (active) {
          setError('Invalid scan. Missing transfer token.');
          setLoading(false);
        }
        return;
      }

      const token = await getToken();

      if (!token) {
        if (active) {
          setError('Please log in to continue. Redirecting to login...');
          setLoading(false);
        }

        router.push({
          pathname: '/login',
          params: {
            redirect: `/(secure-qr)/transfer/${uuid}`,
          },
        });
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/qr/validate/${encodeURIComponent(uuid)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const rawText = await response.text();
        const payload: ValidationResult = rawText ? JSON.parse(rawText) : { success: false };

        if (!response.ok) {
          throw new Error(payload.error || `Request failed with status ${response.status}`);
        }

        if (active) {
          const resolvedRecord = payload?.data?.record || null;
          setRecord(resolvedRecord);
          setError(null);

          if (resolvedRecord?._id) {
            fetch(`${API_BASE}/transfers/${encodeURIComponent(String(resolvedRecord._id))}/scan-event`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ scannedAt: Date.now() }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : 'Unable to validate this secure link.';
          setError(message);
          setRecord(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    runValidation();

    return () => {
      active = false;
    };
  }, [router, uuid]);

  const isDenied = !!error && /access denied|only doctors|unsupported role|403/i.test(error);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.message}>Validating secure transfer link...</Text>
      </View>
    );
  }

  if (error || !record) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.title, isDenied && styles.deniedTitle]}>
          {isDenied ? 'Access Denied' : 'Unable to Open Record'}
        </Text>
        <Text style={styles.message}>{error || 'No transfer data was returned.'}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Transfer Record</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Token UUID</Text>
        <Text style={styles.value}>{uuid}</Text>

        <Text style={styles.label}>Record ID</Text>
        <Text style={styles.value}>{record._id || 'N/A'}</Text>

        <Text style={styles.label}>Patient ID</Text>
        <Text style={styles.value}>{record.pid || 'N/A'}</Text>

        <Text style={styles.label}>Patient Name</Text>
        <Text style={styles.value}>{record.nam || 'N/A'}</Text>

        <Text style={styles.label}>Primary Diagnosis</Text>
        <Text style={styles.value}>{record.pd || 'N/A'}</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{record.status || 'N/A'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  deniedTitle: {
    color: Colors.critical,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
