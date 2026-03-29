import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { buildPinEncryptedQrPayload } from '../utils/pinCrypto';

export default function GenerateQR({ formData }) {
  const primaryColor = '#0047AB';
  const [loadingPayload, setLoadingPayload] = useState(true);
  const [qrPayload, setQrPayload] = useState('');
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

    async function createEncryptedPayload() {
      const recordId = formData?.recordId;
      const pinAuth = String(formData?.pinAuth || '').trim();

      if (!recordId) {
        if (active) {
          setTokenError('Missing recordId. Submit transfer first to generate a secure QR.');
          setLoadingPayload(false);
        }
        return;
      }

      if (!/^\d{6}$/.test(pinAuth)) {
        if (active) {
          setTokenError('Missing 6-digit PIN. Regenerate transfer and try again.');
          setLoadingPayload(false);
        }
        return;
      }

      setLoadingPayload(true);
      setTokenError('');

      try {
        const encryptedPayload = buildPinEncryptedQrPayload({
          recordId,
          pin: pinAuth,
          payload: {
            _id: recordId,
            pid: formData.pid || pinAuth,
            pinAuth,
            did: formData.did || formData.doctorId,
            fh: formData.fh || formData.fromHospital,
            th: formData.th || formData.toHospital,
            bg: formData.bg || formData.bloodGroup,
            nam: formData.nam || formData.patientName,
            age: formData.age,
            pd: formData.pd || formData.primaryDiagnosis,
            rt: formData.rt || formData.transferReason,
            alg: formData.alg || formData.allergies,
            med: formData.med,
            vit: formData.vit,
            pi: formData.pi || formData.pendingInvestigations,
            sum: formData.sum || formData.clinicalSummary,
            submissionTimestamp: formData.submissionTimestamp,
            status: formData.status || 'IN_TRANSIT',
          },
        });

        if (active) {
          setQrPayload(encryptedPayload);
          setLoadingPayload(false);
        }
      } catch (error) {
        if (active) {
          setTokenError(error.message || 'Unable to generate encrypted QR payload.');
          setQrPayload('');
          setLoadingPayload(false);
        }
      }
    }

    createEncryptedPayload();

    return () => {
      active = false;
    };
  }, [formData]);

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: primaryColor }]}>
        <Text style={[styles.headerText, { color: primaryColor }]}>Handover QR Code</Text>
        <Text style={styles.subText}>Scan this code with the MediRelay app or a standard camera.</Text>
        
        {loadingPayload ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Generating encrypted PIN-auth QR...</Text>
          </View>
        ) : tokenError ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{tokenError}</Text>
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <QRCode
              value={qrPayload}
              size={250}
              color="black"
              backgroundColor="white"
              ecl="M"
            />
          </View>
        )}

        <View style={styles.pinCard}>
          <Text style={styles.pinLabel}>Patient PIN</Text>
          <Text style={styles.pinValue}>{formData.pinAuth || '------'}</Text>
          <Text style={styles.pinHint}>Share this PIN securely with the patient.</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Doctor ID: {formData.doctorId || formData.did || 'N/A'}</Text>
          <Text style={styles.infoText}>Patient: {formData.patientName || formData.nam || 'N/A'}</Text>
          <Text style={styles.infoText}>Record ID: {formData.recordId || 'N/A'}</Text>
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
  pinCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: '#1E3A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pinValue: {
    marginTop: 4,
    fontSize: 38,
    letterSpacing: 6,
    color: '#0F172A',
    fontWeight: '800',
  },
  pinHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#334155',
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
