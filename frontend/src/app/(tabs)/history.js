import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TransferTimeline } from '../../components/patient/TransferTimeline';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/Theme';

// Simulated Data
const mockTimeline = [
  {
    location: 'District Hospital A (Sender)',
    timestamp: '10:30 AM',
    note: 'Initial stabilization. Decision to transfer.'
  },
  {
    location: 'Ambulance Unit 42',
    timestamp: '11:15 AM',
    note: 'In transit. SpO2 stable at 95%.'
  },
  {
    location: 'Tertiary Care Center (Receiver - Expected)',
    timestamp: 'Pending',
    note: ''
  }
];

export default function HistoryTab() {
  return (
    <View style={styles.container}>
      <Card>
        <TransferTimeline timelineEvents={mockTimeline} />
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
