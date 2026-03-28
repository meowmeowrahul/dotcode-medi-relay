import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { HeroSummary } from '../../components/patient/HeroSummary';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/Theme';

// Simulated Data representing what the QR code payload/Network fetch would return
const mockPatientData = {
  name: 'John Doe',
  allergies: 'Penicillin, Peanuts',
  criticalMeds: 'Epinephrine Infusion at 5mcg/min',
  reason: 'Acute Myocardial Infarction, ST Elevation. Patient requires immediate Cath Lab.',
  senderHospital: 'Rural Health Center B'
};

export default function TransferScreen() {
  const { id } = useLocalSearchParams();

  const handleAcknowledge = () => {
    // Audit Action
    console.log(`[TransferScreen] Patient ${id} acknowledged by receiver.`);
  };

  return (
    <View style={styles.container}>
      {/* Zero Scroll Expected Portion */}
      <HeroSummary patient={mockPatientData} />

      {/* Remaining Form Details can scroll below the fold */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.actionContainer}>
          <Button 
            title="Acknowledge Receipt" 
            variant="secondary" 
            onPress={handleAcknowledge} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  actionContainer: {
    marginTop: 32,
    marginBottom: 40,
  }
});
