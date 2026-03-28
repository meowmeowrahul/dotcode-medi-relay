import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'medirelay_token';
const USER_KEY = 'medirelay_user';

export async function storeAuth(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token || ''],
    [USER_KEY, JSON.stringify(user || {})],
  ]);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
