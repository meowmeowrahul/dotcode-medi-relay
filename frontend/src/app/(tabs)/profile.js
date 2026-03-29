import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/Theme';
import { deleteUserProfile, getUserProfile, updateUserProfile } from '../../../ScanImplementation/utils/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, CircleUserRound } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, saveAuth, logout } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [draft, setDraft] = useState(user || null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedProfile = useRef(false);
  const authUserRef = useRef(user || null);

  useEffect(() => {
    setProfile(user || null);
    setDraft(user || null);
    authUserRef.current = user || null;
  }, [user]);

  useEffect(() => {
    if (hasLoadedProfile.current) return;
    let mounted = true;

    const loadProfile = async () => {
      hasLoadedProfile.current = true;
      setLoading(true);
      setError(null);
      const result = await getUserProfile();
      setLoading(false);

      if (!mounted) return;

      if (!result.success) {
        setError(result.error || 'Failed to load profile.');
        return;
      }

      const safeApi = result.data || {};
      const safeAuth = authUserRef.current || {};
      const stableRole = safeAuth.role || 'patient';
      const displayName = safeAuth.name || safeAuth.username || safeApi.name || safeApi.username || '';

      const next = {
        ...safeApi, ...safeAuth,
        name: displayName,
        username: safeAuth.username || safeApi.username,
        role: stableRole,
        hospitalName: safeAuth.hospitalName ?? safeApi.hospitalName ?? '',
        profileImage: safeApi.profileImage || safeAuth.profileImage || '',
      };

      setProfile(next);
      setDraft(next);
      await saveAuth(token, next);
    };

    loadProfile();
    return () => { mounted = false; };
  }, [saveAuth, token]);

  const initials = useMemo(() => {
    const name = profile?.name || profile?.username || '';
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  }, [profile?.name, profile?.username]);

  const isDoctor = (draft?.role || profile?.role) === 'doctor';

  const startEdit = () => {
    setDraft(profile);
    setIsEditing(true);
    setError(null);
  };
  const cancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
    setError(null);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to update profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setDraft((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const validate = () => {
    const draftName = (draft?.name || draft?.username || '').trim();
    if (!draftName) { setError('Name cannot be empty.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: (draft.name || draft.username || '').trim(),
      role: authUserRef.current?.role || profile?.role || 'patient',
      hospitalName: isDoctor ? (draft.hospitalName || '').trim() : '',
      profileImage: draft.profileImage || '',
    };

    const result = await updateUserProfile(payload);
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Failed to save profile changes.');
      return;
    }

    const next = {
      ...result.data,
      role: authUserRef.current?.role || profile?.role || 'patient',
      username: authUserRef.current?.username || result.data?.username,
      name: result.data?.name || draft.name || authUserRef.current?.name || authUserRef.current?.username,
    };

    setProfile(next);
    setDraft(next);
    await saveAuth(token, next);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully.');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const result = await deleteUserProfile();
    setDeleting(false);

    if (!result.success) {
      setError(result.error || 'Failed to delete account.');
      return;
    }
    await logout();
    Alert.alert('Account deleted', 'Your account has been removed.');
    router.replace('/login');
  };

  const current = draft || profile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Visual Radar Overaly Wrapper */}
      <View style={styles.radarWrapper}>
        <View style={styles.radarOuterRing}></View>
        <View style={styles.radarInnerRing}></View>
        
        {/* Placeholder orbit nodes for Family Circle visual mapping */}
        {!isDoctor && (
          <>
            <View style={[styles.orbitNode, { top: 10, left: '20%' }]}><CircleUserRound color={Colors.textSecondary} size={28} /></View>
            <View style={[styles.orbitNode, { bottom: 20, right: '20%' }]}><CircleUserRound color={Colors.textSecondary} size={28} /></View>
            <View style={[styles.addMemberNode, { top: -10, right: '10%' }]}><UserPlus color={Colors.primary} size={20} /></View>
          </>
        )}

        <View style={styles.avatarSection}>
          {current?.profileImage ? (
            <Image source={{ uri: current.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {isEditing && (
            <TouchableOpacity style={styles.photoButton} onPress={pickImage} activeOpacity={0.8}>
              <Text style={styles.photoButtonText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoWrapper}>
        <Text style={styles.title}>Personal Info</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : current ? (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <Input
                editable={isEditing && !saving && !deleting}
                value={current.name || current.username || ''}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
                placeholder="Enter your full name"
                style={[styles.inputSoft, !isEditing && styles.readOnly]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email / Username</Text>
              <Input
                editable={false}
                value={current.username || ''}
                placeholder="system-generated"
                style={[styles.inputSoft, styles.readOnly]}
              />
            </View>

            {isDoctor && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Hospital Name</Text>
                <Input
                  editable={isEditing && !saving && !deleting}
                  value={current.hospitalName || ''}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, hospitalName: value }))}
                  placeholder="Enter hospital name"
                  style={[styles.inputSoft, !isEditing && styles.readOnly]}
                />
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonStack}>
              {!isEditing ? (
                <Button title="Edit Profile" onPress={startEdit} />
              ) : (
                <>
                  <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving || deleting} />
                  <Button title="Cancel" onPress={cancelEdit} variant="outline" />
                </>
              )}
            </View>

            <Button
              title={deleting ? 'Deleting...' : 'Delete Account'}
              onPress={confirmDelete}
              variant="danger"
              style={styles.deleteButton}
              disabled={saving || deleting}
            />
          </>
        ) : (
          <Text style={styles.errorText}>No profile available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface, // Clean pure white for the whole page
  },
  contentContainer: {
    paddingBottom: 40,
  },
  radarWrapper: {
    paddingVertical: 40,
    backgroundColor: Colors.background, // Soft sky background for the radar section
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 24,
  },
  radarOuterRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: '#D1E4FF',
    borderStyle: 'dashed',
  },
  radarInnerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: '#E5EDFF',
    borderStyle: 'dashed',
  },
  orbitNode: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  addMemberNode: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarSection: {
    alignItems: 'center',
    zIndex: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    color: Colors.surface,
    fontWeight: '700',
  },
  photoButton: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  photoButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  infoWrapper: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputSoft: {
    marginBottom: 8,
    borderWidth: 0,
    backgroundColor: Colors.background, // The soft background input mapping
  },
  readOnly: {
    opacity: 0.8,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: Colors.critical,
    marginBottom: 12,
    fontSize: 14,
  },
  buttonStack: {
    gap: 12,
    marginTop: 16,
  },
  deleteButton: {
    marginTop: 32,
    backgroundColor: Colors.critical,
  },
});
