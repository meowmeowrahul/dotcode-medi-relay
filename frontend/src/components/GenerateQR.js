import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generatePayload } from '../utils/QRService';

export default function GenerateQR({ formData }) {
  // Medical-Grade UI styling: Cobalt Blue primary color (#0047AB)
  const primaryColor = '#0047AB';

  // Make sure we have formData, else show a placeholder.
  if (!formData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No patient data available to generate QR code.</Text>
      </View>
    );
  }

  const payload = generatePayload(formData);

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: primaryColor }]}>
        <Text style={[styles.headerText, { color: primaryColor }]}>Handover QR Code</Text>
        <Text style={styles.subText}>Scan this code with the MediRelay app or a standard camera.</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={payload}
            size={250}
            color="black"
            backgroundColor="white"
            ecl="M" // Medium error correction level
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Patient: {formData.patientName || 'N/A'}</Text>
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
