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
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
