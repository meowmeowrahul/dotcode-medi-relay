/**
 * API service layer for backend communication.
 * All methods return a consistent { success, data, error } shape.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function ensureApiSuffix(url) {
  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

function resolveApiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiSuffix(process.env.EXPO_PUBLIC_API_URL);
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:3000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

const API_BASE = resolveApiBase();

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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

export async function listDoctorIssuedTransfers(did, { limit = 200, skip = 0 } = {}) {
  try {
    const query = new URLSearchParams();
    query.append('limit', String(limit));
    query.append('skip', String(skip));

    const response = await fetch(`${API_BASE}/transfers/doctor/${encodeURIComponent(did)}/issued?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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

export async function listPatientPastTransfers(pid, { limit = 200, skip = 0 } = {}) {
  try {
    const query = new URLSearchParams();
    query.append('limit', String(limit));
    query.append('skip', String(skip));

    const response = await fetch(`${API_BASE}/transfers/patient/${encodeURIComponent(pid)}/past?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
