import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Button } from 'react-native';
import { TransferForm } from '../../components/forms/TransferForm';
import { Colors } from '../../constants/Theme';
import GenerateQR from '../../components/GenerateQR';

export default function SenderTab() {
  const [formData, setFormData] = useState(null);

  const handleSubmit = (data) => {
    console.log('Generating QR code & Link for: ', data);
    setFormData(data);
  };

  return (
    <ScrollView style={styles.container}>
      {formData ? (
        <View style={styles.qrSection}>
          <GenerateQR formData={formData} />
          <View style={styles.buttonContainer}>
            <Button title="Create Another Form" onPress={() => setFormData(null)} color="#0047AB" />
          </View>
        </View>
      ) : (
        <TransferForm onSubmit={handleSubmit} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  qrSection: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  }
});
