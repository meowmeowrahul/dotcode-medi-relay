import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/Theme';
import { deleteUserProfile, getUserProfile, updateUserProfile } from '../../../ScanImplementation/utils/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

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
    if (hasLoadedProfile.current) {
      return;
    }

    let mounted = true;

    const mergeProfile = (apiProfile, authUser) => {
      const safeApi = apiProfile || {};
      const safeAuth = authUser || {};
      const stableRole = safeAuth.role || authUserRef.current?.role || 'patient';

      const displayName =
        safeAuth.name ||
        safeAuth.username ||
        safeApi.name ||
        safeApi.username ||
        '';

      return {
        ...safeApi,
        ...safeAuth,
        name: displayName,
        username: safeAuth.username || safeApi.username,
        role: stableRole,
        hospitalName: safeAuth.hospitalName ?? safeApi.hospitalName ?? '',
        profileImage: safeApi.profileImage || safeAuth.profileImage || '',
      };
    };

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

      const next = mergeProfile(result.data, authUserRef.current);
      setProfile(next);
      setDraft(next);
      await saveAuth(token, next);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
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
    if (!draftName) {
      setError('Name cannot be empty.');
      return false;
    }
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
        {
          text: 'Confirm Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
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
      <Card>
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.subtitle}>Manage your account details securely.</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : current ? (
          <>
            <View style={styles.avatarSection}>
              {current.profileImage ? (
                <Image source={{ uri: current.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              {isEditing && (
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputReadOnly]}
              editable={isEditing && !saving && !deleting}
              value={current.name || current.username || ''}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
            />

            {isDoctor && (
              <>
                <Text style={styles.label}>Hospital Name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputReadOnly]}
                  editable={isEditing && !saving && !deleting}
                  value={current.hospitalName || ''}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, hospitalName: value }))}
                  placeholder="Enter hospital name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!isEditing ? (
              <Button
                title="Edit Profile"
                onPress={startEdit}
                style={styles.primaryButton}
              />
            ) : (
              <>
                <Button
                  title={saving ? 'Saving...' : 'Save Changes'}
                  onPress={handleSave}
                  style={styles.primaryButton}
                  disabled={saving || deleting}
                />
                <Button
                  title="Cancel"
                  onPress={cancelEdit}
                  variant="outline"
                  style={styles.secondaryButton}
                />
              </>
            )}

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
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '700',
  },
  photoButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  photoButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputReadOnly: {
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    color: Colors.critical,
    marginBottom: 12,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 4,
  },
  secondaryButton: {
    marginTop: 10,
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: Colors.critical,
  },
});
