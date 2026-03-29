import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function PinEntryModal({
  visible,
  title,
  subtitle,
  pin,
  onChangePin,
  onSubmit,
  onCancel,
  loading,
  error,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title || 'Enter 6-Digit PIN'}</Text>
          <Text style={styles.subtitle}>{subtitle || 'Enter PIN to decrypt transfer record.'}</Text>

          <TextInput
            value={pin}
            onChangeText={(value) => onChangePin(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Decrypting...' : 'Decrypt Record'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  error: {
    marginTop: 10,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 12,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
