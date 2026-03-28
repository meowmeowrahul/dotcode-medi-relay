import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Pressable, Text } from 'react-native';
import { Colors } from '../constants/Theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Prevent the splash screen from auto-hiding so we can control it
SplashScreen.preventAutoHideAsync();

function AuthGate({ children }) {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  const inAuthFlow = segments[0] === 'login' || segments[0] === 'register';

  useEffect(() => {
    if (loading || !navState?.key) return;
    if (!token && !inAuthFlow) {
      router.replace('/login');
    }
    if (token && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [token, loading, inAuthFlow, router, navState?.key]);

  if (loading || !navState?.key) return null;
  return children;
}

function AppStack() {
  const router = useRouter();
  const { token } = useAuth();

  return (
    <Stack
      screenOptions={({ route }) => {
        const isAuthRoute = route.name === 'login' || route.name === 'register';
        const isTabsRoute = route.name === '(tabs)';
        const showHamburger = !!token && !isAuthRoute && !isTabsRoute;

        return {
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.surface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: showHamburger
            ? () => (
                <Pressable
                  onPress={() => router.replace('/(tabs)')}
                  style={{ paddingHorizontal: 12, paddingVertical: 4 }}
                  accessibilityLabel="Open navigation"
                >
                  <Text style={{ color: Colors.surface, fontSize: 24, lineHeight: 24 }}>☰</Text>
                </Pressable>
              )
            : undefined,
        };
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: true, headerBackVisible: false }} />
      <Stack.Screen name="register" options={{ title: 'Register', headerShown: true }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(secure-qr)/transfer/[uuid]"
        options={{
          title: 'Secure Transfer',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="transfer/[id]"
        options={{ title: 'Patient Handoff Record', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="scan-result"
        options={{
          title: 'Patient Transfer Record',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once the layout is mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar style="light" />
        <AppStack />
      </AuthGate>
    </AuthProvider>
  );
}
