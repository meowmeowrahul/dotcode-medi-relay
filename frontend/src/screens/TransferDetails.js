import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { parsePayload } from '../utils/QRService';
import GenerateQR from '../components/GenerateQR';

const Tab = createBottomTabNavigator();

// --- Tab 1: View (Displays Parsed Data) ---
const ViewTab = ({ route }) => {
  const { parsedData } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Patient Identifiers */}
        <View style={styles.headerRow}>
          <Text style={styles.nameText}>{parsedData.patientName}</Text>
          <Text style={styles.idText}>ID: {parsedData.patientId}</Text>
        </View>

        <Text style={styles.label}>Diagnosis</Text>
        <Text style={styles.dxText}>{parsedData.primaryDiagnosis}</Text>

        {/* High-Contrast Critical Info */}
        <View style={styles.criticalContainer}>
          <View style={styles.criticalBox}>
            <Text style={styles.criticalLabel}>ALLERGIES</Text>
            <Text style={styles.criticalValue}>{parsedData.allergies}</Text>
          </View>
          <View style={styles.criticalBox}>
            <Text style={styles.criticalLabel}>MEDICATIONS</Text>
            <Text style={styles.criticalValue}>{parsedData.activeMedications}</Text>
          </View>
        </View>

        {/* Vitals Card Layout */}
        <Text style={styles.label}>Vitals & Investigations</Text>
        <View style={styles.vitalsCard}>
          <Text style={styles.bodyText}><Text style={styles.bold}>Vitals: </Text>{parsedData.lastVitals}</Text>
          <Text style={styles.bodyText}><Text style={styles.bold}>Investigations: </Text>{parsedData.pendingInvestigations}</Text>
        </View>

        <Text style={styles.label}>Reason for Transfer</Text>
        <Text style={styles.bodyText}>{parsedData.transferReason}</Text>

        <Text style={styles.label}>Summary</Text>
        <Text style={styles.bodyText}>{parsedData.clinicalSummary}</Text>
        
        {/* Synced Status */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Status: Local-Only (Scanned)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// --- Tab 2: History (Fetches Timeline from Backend) ---
const HistoryTab = ({ route }) => {
  const { parsedData } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking an API call to MongoDB /api/records/history/:pid
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // In a real app we would use fetch(`http://BACKEND_URL/api/records/history/${parsedData.patientId}`)
        // Let's mock a 1-second delay and return fake history.
        await new Promise((res) => setTimeout(res, 1000));
        setHistory([
          { date: '2026-03-27 10:00 AM', from: 'ER', to: 'ICU', note: 'Initial Admission' },
          { date: '2026-03-28 08:30 AM', from: 'ICU', to: 'Ward', note: 'Stabilized, transferring' }
        ]);
      } catch (e) {
        Alert.alert("Error", "Failed to fetch history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [parsedData.patientId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
        <Text style={styles.loadingText}>Fetching Timeline...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Transfer History for PID: {parsedData.patientId}</Text>
      {history.map((item, idx) => (
        <View key={idx} style={styles.timelineItem}>
          <Text style={styles.timelineDate}>{item.date}</Text>
          <Text style={styles.timelineRoute}>{item.from}  ➡️  {item.to}</Text>
          <Text style={styles.timelineNote}>{item.note}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// --- Tab 3: Update (Clone & Edit Form) ---
const UpdateTab = ({ route }) => {
  const { parsedData } = route.params;
  const [formData, setFormData] = useState(parsedData);
  const [showNewQR, setShowNewQR] = useState(false);

  const handleUpdate = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (showNewQR) {
    return (
      <ScrollView contentContainerStyle={styles.centerContainer}>
        <GenerateQR formData={formData} />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowNewQR(false)}>
          <Text style={styles.secondaryButtonText}>Back to Edit</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Clone & Edit Transfer Record</Text>
      
      <Text style={styles.inputLabel}>Vitals (Update if changed)</Text>
      <TextInput 
        style={styles.input} 
        value={formData.lastVitals} 
        onChangeText={(val) => handleUpdate('lastVitals', val)}
        multiline
      />

      <Text style={styles.inputLabel}>Investigations (Add new labs)</Text>
      <TextInput 
        style={styles.input} 
        value={formData.pendingInvestigations} 
        onChangeText={(val) => handleUpdate('pendingInvestigations', val)}
        multiline
      />

      <Text style={styles.inputLabel}>Clinical Summary</Text>
      <TextInput 
        style={[styles.input, { height: 100 }]} 
        value={formData.clinicalSummary} 
        onChangeText={(val) => handleUpdate('clinicalSummary', val)}
        multiline
      />

      <TouchableOpacity style={styles.primaryButton} onPress={() => setShowNewQR(true)}>
        <Text style={styles.primaryButtonText}>Generate New QR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- Main Navigator Component ---
export default function TransferDetails({ route }) {
  // Try to parse the scanned QR string from params
  const { qrString } = (route && route.params) || { qrString: '' };
  
  let parsedData = {};
  let parseError = null;

  try {
    parsedData = parsePayload(qrString);
  } catch (error) {
    parseError = error.message;
  }

  if (parseError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid QR Code!</Text>
        <Text style={styles.bodyText}>{parseError}</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0047AB',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#0047AB' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="View" 
        component={ViewTab} 
        initialParams={{ parsedData }} 
        options={{ title: 'Patient File' }} 
      />
      <Tab.Screen 
        name="History" 
        component={HistoryTab} 
        initialParams={{ parsedData }} 
        options={{ title: 'Timeline' }} 
      />
      <Tab.Screen 
        name="Update" 
        component={UpdateTab} 
        initialParams={{ parsedData }} 
        options={{ title: 'Clone & Edit' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#0047AB' },
  idText: { fontSize: 16, color: '#666' },
  label: { fontSize: 14, color: '#666', marginTop: 12, fontWeight: '600' },
  dxText: { fontSize: 18, color: '#333', fontWeight: '500', marginBottom: 8 },
  bodyText: { fontSize: 16, color: '#444', lineHeight: 24 },
  bold: { fontWeight: 'bold' },
  criticalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  criticalBox: { flex: 0.48, backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFCDD2' },
  criticalLabel: { fontSize: 12, color: '#D32F2F', fontWeight: 'bold', marginBottom: 4 },
  criticalValue: { fontSize: 16, color: '#B71C1C', fontWeight: '700' },
  vitalsCard: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#BBDEFB' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: '#FFE0B2' },
  statusText: { color: '#E65100', fontSize: 14, fontWeight: 'bold' },
  errorText: { fontSize: 20, color: '#D32F2F', fontWeight: 'bold', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  timelineItem: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#0047AB' },
  timelineDate: { fontSize: 12, color: '#888', marginBottom: 4 },
  timelineRoute: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  timelineNote: { fontSize: 14, color: '#555' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#0047AB' },
  inputLabel: { fontSize: 16, color: '#333', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#0047AB', padding: 16, borderRadius: 8, marginTop: 24, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#E0E0E0', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center', width: '100%' },
  secondaryButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});
