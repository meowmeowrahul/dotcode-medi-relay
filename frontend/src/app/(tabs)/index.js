import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TransferForm } from '../../components/forms/TransferForm';
import { Colors } from '../../constants/Theme';

export default function SenderTab() {
  const handleSubmit = (data) => {
    console.log('Generating QR code & Link for: ', data);
  };

  return (
    <View style={styles.container}>
      <TransferForm onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
