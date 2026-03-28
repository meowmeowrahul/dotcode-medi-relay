/**
 * API service layer for backend communication.
 * All methods return a consistent { success, data, error } shape.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getToken as getStoredToken } from '../../src/utils/authStorage';

const DEFAULT_API_PORT = 3001;

function ensureApiSuffix(url) {
  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

function resolveApiBase() {
  if (Platform.OS === 'android' && process.env.EXPO_PUBLIC_API_URL_ANDROID) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL_ANDROID);
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }

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

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

const API_BASE = resolveApiBase();

async function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { error: text };
  }
}

export async function createTransfer(payload) {
  try {
    const response = await fetch(`${API_BASE}/transfers`, {
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
    return { success: false, error: error.message };
  }
}

export async function acknowledgeTransfer(id, payload) {
  try {
    const response = await fetch(`${API_BASE}/transfers/${id}/acknowledge`, {
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
    return { success: false, error: error.message };
  }
}

export async function updateTransfer(id, payload) {
  try {
    const response = await fetch(`${API_BASE}/transfers/${id}/updates`, {
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
    return { success: false, error: error.message };
  }
}

export async function getTransfer(id) {
  try {
    const response = await fetch(`${API_BASE}/transfers/${id}`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentTransferByPid(pid) {
  try {
    const response = await fetch(`${API_BASE}/transfers/pid/${encodeURIComponent(pid)}/current`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTransferTimelineByPid(pid) {
  try {
    const response = await fetch(`${API_BASE}/transfers/pid/${encodeURIComponent(pid)}/timeline`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTransferVersionByTimestamp(pid, timestamp) {
  try {
    const response = await fetch(`${API_BASE}/transfers/pid/${encodeURIComponent(pid)}/version/${timestamp}`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function listTransfers({ status, limit = 200, skip = 0 } = {}) {
  try {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    query.append('limit', String(limit));
    query.append('skip', String(skip));

    const response = await fetch(`${API_BASE}/transfers?${query.toString()}`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data || [], pagination: result.pagination };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserProfile() {
  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(payload) {
  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserProfile() {
  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });
    const result = await parseResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
