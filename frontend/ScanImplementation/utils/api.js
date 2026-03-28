/**
 * API service layer for backend communication.
 * All methods return a consistent { success, data, error } shape.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function acknowledgeTransfer(id, payload) {
  try {
    const response = await fetch(`${API_BASE}/transfers/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
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
    const response = await fetch(`${API_BASE}/transfers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
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
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
