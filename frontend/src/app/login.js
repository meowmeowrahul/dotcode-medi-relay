<<<<<<< HEAD
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Theme';
import { Button } from '../components/ui/Button';
import { loginUser } from '../utils/authApi';
import { useAuth } from '../contexts/AuthContext';

const roles = ['doctor', 'patient'];

export default function LoginScreen() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password || !role) {
      Alert.alert('Missing fields', 'Please provide username, password, and role.');
      return;
    }
    setLoading(true);
    const result = await loginUser({ username, password, role });
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login failed', result.error || 'Unable to login');
      return;
    }
    const { token, user } = result.data;
    await saveAuth(token, user);
=======
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Theme';
import { getSessionState, restoreDemoSession } from '../state/userSession';

export default function LoginScreen() {
  const router = useRouter();
  const session = getSessionState();

  if (session.isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = () => {
    restoreDemoSession();
>>>>>>> 4c1612deaf4d47488e4b360322e26ee92b497901
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={[styles.chip, role === r && styles.chipActive]}
            >
              <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{r === 'doctor' ? 'Doctor' : 'Patient'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button title={loading ? 'Signing in...' : 'Login'} onPress={handleLogin} style={{ marginTop: 8 }} />
      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />}

      <Pressable onPress={() => router.push('/register')} style={{ marginTop: 16 }}>
        <Text style={styles.link}>New here? Create an account</Text>
      </Pressable>
=======
      <Card style={styles.card}>
        <Text style={styles.title}>Medi Relay</Text>
        <Text style={styles.subtitle}>Sign in to continue to clinical handoff tools.</Text>
        <Button title="Sign In" onPress={handleLogin} />
      </Card>
>>>>>>> 4c1612deaf4d47488e4b360322e26ee92b497901
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E9F2FF',
  },
  chipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
=======
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
>>>>>>> 4c1612deaf4d47488e4b360322e26ee92b497901
  },
});
