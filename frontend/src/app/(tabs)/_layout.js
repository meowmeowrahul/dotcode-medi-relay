import React, { useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Colors } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Inbox, History as HistoryIcon, User, LogOut } from 'lucide-react-native';

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
            <User color={Colors.textPrimary} size={18} strokeWidth={2} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={onLogout}
          >
            <LogOut color={Colors.critical} size={18} strokeWidth={2} style={styles.menuIcon} />
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
        {user?.role !== 'patient' ? (
          <DrawerItem
            icon={({ color, size }) => <ClipboardList color={color} size={size} strokeWidth={2} />}
            label={() => <DrawerLabel title="Issuer" subtitle="Create handoff" />}
            onPress={() => props.navigation.navigate('index')}
            style={styles.drawerItem}
          />
        ) : null}
        <DrawerItem
          icon={({ color, size }) => <Inbox color={color} size={size} strokeWidth={2} />}
          label={() => <DrawerLabel title="Recipient" subtitle="Receive updates" />}
          onPress={() => props.navigation.navigate('receiver')}
          style={styles.drawerItem}
        />
        <DrawerItem
          icon={({ color, size }) => <HistoryIcon color={color} size={size} strokeWidth={2} />}
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
        overlayColor: 'rgba(45,124,255,0.08)', // Using the soft primary hue
        sceneContainerStyle: { backgroundColor: Colors.background },
        headerStyle: { backgroundColor: Colors.surface, shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', letterSpacing: -0.3 },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerActiveBackgroundColor: Colors.secondary,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  drawerItems: {
    paddingVertical: 8,
    paddingHorizontal: 8, 
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 8, // wide spacing
    paddingVertical: 4,
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
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // more generous spacing
  },
  avatar: {
    width: 48, // larger avatar
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1E4FF', // softer blue background
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
});
