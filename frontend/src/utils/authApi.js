import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getToken as getStoredToken } from './authStorage';

const DEFAULT_API_PORT = 3001;

function ensureApiSuffix(url) {
  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

function resolveApiBase() {
  // Explicit Android override (useful for emulator 10.0.2.2 or LAN IP)
  if (Platform.OS === 'android' && process.env.EXPO_PUBLIC_API_URL_ANDROID) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL_ANDROID);
  }

  // Explicit override takes priority
  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }

  // Prefer host from Expo dev server (works on physical devices when using LAN)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:${DEFAULT_API_PORT}/api`;
    }
  }

  // Emulator fallback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

const API_BASE = resolveApiBase();

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_e) {
    return { error: text };
  }
}

async function buildHeaders(includeAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function registerUser(payload) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    const isNetworkError = /Network request failed/i.test(error?.message || '');
    const message = isNetworkError
      ? `Network request failed. Tried: ${API_BASE}/auth/register`
      : error.message;
    return { success: false, error: message };
  }
}

export async function loginUser(payload) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    const isNetworkError = /Network request failed/i.test(error?.message || '');
    const message = isNetworkError
      ? `Network request failed. Tried: ${API_BASE}/auth/login`
      : error.message;
    return { success: false, error: message };
  }
}

export async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: await buildHeaders(true),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    const isNetworkError = /Network request failed/i.test(error?.message || '');
    const message = isNetworkError
      ? `Network request failed. Tried: ${API_BASE}/auth/me`
      : error.message;
    return { success: false, error: message };
  }
}

export { API_BASE };
