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
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Medi Relay</Text>
        <Text style={styles.subtitle}>Sign in to continue to clinical handoff tools.</Text>
        <Button title="Sign In" onPress={handleLogin} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
