import React, { useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Colors } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

function DrawerLabel({ title, subtitle }) {
  return (
    <View>
      <Text style={styles.drawerLabel}>{title}</Text>
      {subtitle ? <Text style={styles.drawerSubLabel}>{subtitle}</Text> : null}
    </View>
  );
}

function ProfileSection({ onToggleMenu, menuOpen, user, onNavigateProfile, onLogout }) {
  const insets = useSafeAreaInsets();
  const displayName = (user?.username || user?.name || 'Unknown User').trim();
  const role = user?.role || 'patient';
  const hospitalName = user?.hospitalName || '';
  const isDoctor = role === 'doctor';

  const initials = (displayName || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  return (
    <View style={[styles.profileContainer, { paddingBottom: insets.bottom + 8 }]}>
      <Pressable
        onPress={onToggleMenu}
        style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{displayName}</Text>
          {isDoctor && hospitalName ? (
            <Text style={styles.profileMeta}>{hospitalName}</Text>
          ) : (
            <Text style={styles.profileMeta}>{isDoctor ? 'Doctor' : 'Patient'}</Text>
          )}
        </View>
      </Pressable>
      {menuOpen && (
        <View style={styles.profileMenu}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={onNavigateProfile}
          >
            <Text style={styles.menuItemText}>Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={onLogout}
          >
            <Text style={[styles.menuItemText, { color: Colors.critical }]}>Logout</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CustomDrawerContent(props) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleProfileNavigate = () => {
    setMenuOpen(false);
    props.navigation.navigate('profile');
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    props.navigation.closeDrawer();
    router.replace('/login');
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >
      <View style={styles.drawerHeader}>
        <Text style={styles.appTitle}>Medi Relay</Text>
        <Text style={styles.appSubtitle}>Clinical Handoff</Text>
      </View>

      <View style={styles.drawerItems}>
        {session.user?.role !== 'patient' ? (
          <DrawerItem
            label={() => <DrawerLabel title="Issuer" subtitle="Create handoff" />}
            onPress={() => props.navigation.navigate('index')}
            style={styles.drawerItem}
          />
        ) : null}
        <DrawerItem
          label={() => <DrawerLabel title="Recipient" subtitle="Receive updates" />}
          onPress={() => props.navigation.navigate('receiver')}
          style={styles.drawerItem}
        />
        <DrawerItem
          label={() => <DrawerLabel title="History" subtitle="Timeline & logs" />}
          onPress={() => props.navigation.navigate('history')}
          style={styles.drawerItem}
        />
      </View>

      <ProfileSection
        onToggleMenu={toggleMenu}
        menuOpen={menuOpen}
        user={user}
        onNavigateProfile={handleProfileNavigate}
        onLogout={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Drawer
      screenOptions={{
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.08)',
        sceneContainerStyle: { backgroundColor: Colors.background },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerActiveBackgroundColor: '#E9F2FF',
        drawerItemStyle: { borderRadius: 12 },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Issuer',
          headerTitle: 'Issuer',
        }}
      />
      <Drawer.Screen
        name="receiver"
        options={{
          title: 'Recipient',
          headerTitle: 'Recipient',
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'History',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          headerTitle: 'Scan Transfer QR',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="scan-result"
        options={{
          title: 'Scan Result',
          headerTitle: 'Patient Transfer Record',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 12,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  drawerItems: {
    paddingVertical: 8,
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 8,
    paddingVertical: 2,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drawerSubLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileContainer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
  micActive: {
    color: Colors.primary,
  },
});
