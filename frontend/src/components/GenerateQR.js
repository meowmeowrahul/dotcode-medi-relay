import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateSecureQrToken } from '../../ScanImplementation/utils/api';

export default function GenerateQR({ formData }) {
  // Medical-Grade UI styling: Cobalt Blue primary color (#0047AB)
  const primaryColor = '#0047AB';
  const [loadingToken, setLoadingToken] = useState(true);
  const [secureUrl, setSecureUrl] = useState('');
  const [tokenError, setTokenError] = useState('');

  // Make sure we have formData, else show a placeholder.
  if (!formData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No patient data available to generate QR code.</Text>
      </View>
    );
  }

  useEffect(() => {
    let active = true;

    async function createToken() {
      const recordId = formData?.recordId;
      if (!recordId) {
        if (active) {
          setTokenError('Missing recordId. Submit transfer first to generate a secure QR.');
          setLoadingToken(false);
        }
        return;
      }

      setLoadingToken(true);
      setTokenError('');

      const result = await generateSecureQrToken(recordId);

      if (!active) return;

      if (!result.success || !result.data?.deepLink) {
        setTokenError(result.error || 'Unable to generate secure QR token.');
        setSecureUrl('');
        setLoadingToken(false);
        return;
      }

      setSecureUrl(result.data.deepLink);
      setLoadingToken(false);
    }

    createToken();

    return () => {
      active = false;
    };
  }, [formData]);

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: primaryColor }]}>
        <Text style={[styles.headerText, { color: primaryColor }]}>Handover QR Code</Text>
        <Text style={styles.subText}>Scan this code with the MediRelay app or a standard camera.</Text>
        
        {loadingToken ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Generating secure tokenized QR...</Text>
          </View>
        ) : tokenError ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{tokenError}</Text>
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <QRCode
              value={secureUrl}
              size={250}
              color="black"
              backgroundColor="white"
              ecl="M"
            />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Doctor ID: {formData.doctorId || formData.did || 'N/A'}</Text>
          <Text style={styles.infoText}>Patient: {formData.patientName || 'N/A'}</Text>
          <Text style={styles.infoText} numberOfLines={2}>Secure Link: {secureUrl || 'N/A'}</Text>
          <Text style={styles.infoText}>Status: <Text style={styles.syncedText}>Ready for Transfer</Text></Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA', // Soft light background
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 6, // Accentuates the primary color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  syncedText: {
    color: '#0047AB', // Synced/Ready color
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F', // Urgent Red for alerts
    textAlign: 'center',
  },
});
