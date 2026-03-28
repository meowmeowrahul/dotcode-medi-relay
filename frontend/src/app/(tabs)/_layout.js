import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Send Transfer',
          tabBarLabel: 'Sender',
        }}
      />
      <Tabs.Screen
        name="receiver"
        options={{
          title: 'Receive Updates',
          tabBarLabel: 'Receiver',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Timeline',
          tabBarLabel: 'History',
        }}
      />
    </Tabs>
  );
}
