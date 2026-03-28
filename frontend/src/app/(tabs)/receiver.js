import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { H2, Body1 } from '../../components/ui/Typography';
import { Colors } from '../../constants/Theme';

export default function ReceiverTab() {
  const router = useRouter();

  const handleScanSimulation = () => {
    Alert.alert('Simulating Camera Scan...', 'Navigating to parsed patient record [123]');
    // Simulating scanning a QR code which routes to transfer/[id]
    router.push('/transfer/123');
  };

  return (
    <View style={styles.container}>
      <Card>
        <H2 style={{ marginBottom: 12 }}>Wait for Transfer</H2>
        <Body1 style={{ marginBottom: 24 }}>
          Scan a QR code from the transferring ambulance or hospital to immediately access the critical handoff record.
        </Body1>
        <Button title="Simulate QR Scan" onPress={handleScanSimulation} variant="primary" />
      </Card>
      
      <Card style={{ marginTop: 16 }}>
        <H2>Incoming Network Transmissions</H2>
        <Body1 style={{ marginTop: 8 }}>
          No pending transfers assigned to this hospital at this moment.
        </Body1>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
});
