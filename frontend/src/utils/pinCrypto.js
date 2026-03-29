import CryptoJS from 'crypto-js';
import LZString from 'lz-string';

const HEADER = '[MEDIRELAY_PIN_V1]';

function deriveKeyFromPin(pin) {
  return CryptoJS.SHA256(String(pin));
}

function deriveIvFromRecordId(recordId) {
  // AES-CBC needs a 16-byte IV. We derive a stable one from recordId.
  return CryptoJS.MD5(String(recordId));
}

export function buildPinEncryptedQrPayload({ recordId, payload, pin }) {
  if (!recordId) {
    throw new Error('recordId is required to build encrypted QR payload');
  }
  if (!pin || String(pin).length !== 6) {
    throw new Error('A 6-digit PIN is required to encrypt payload');
  }

  const serialized = JSON.stringify(payload || {});
  const compressed = LZString.compressToBase64(serialized);
  const key = deriveKeyFromPin(pin);
  const iv = deriveIvFromRecordId(recordId);
  const cipher = CryptoJS.AES.encrypt(compressed, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return `${HEADER}\nRID:${recordId}\nENC:${recordId}:${cipher}`;
}

export function parsePinEncryptedQrPayload(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return null;

  const text = rawValue.trim();
  if (!text.startsWith(HEADER)) return null;

  const ridMatch = text.match(/(?:^|\n)RID:([^\n]+)/);
  const encMatch = text.match(/(?:^|\n)ENC:([^\n]+)/);

  if (!ridMatch?.[1] || !encMatch?.[1]) {
    return null;
  }

  return {
    recordId: ridMatch[1].trim(),
    cipherText: encMatch[1].trim(),
  };
}

export function decryptPinEncryptedPayload(cipherText, pin) {
  if (!cipherText) {
    throw new Error('Encrypted payload is missing');
  }
  if (!pin || String(pin).length !== 6) {
    throw new Error('PIN must be exactly 6 digits');
  }

  let compressed = '';

  // First try new deterministic mode: ENC is "recordId:cipherText".
  const split = String(cipherText).split(':');
  if (split.length >= 2) {
    const encryptedPart = split.slice(1).join(':');
    const key = deriveKeyFromPin(pin);
    const iv = deriveIvFromRecordId(split[0]);
    const bytes = CryptoJS.AES.decrypt(encryptedPart, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    compressed = bytes.toString(CryptoJS.enc.Utf8);
  }

  // Backward compatibility for older passphrase-encrypted QR payloads.
  if (!compressed) {
    const fallback = CryptoJS.AES.decrypt(String(cipherText), String(pin));
    compressed = fallback.toString(CryptoJS.enc.Utf8);
  }

  if (!compressed) {
    throw new Error('Invalid PIN');
  }

  const jsonText = LZString.decompressFromBase64(compressed);
  if (!jsonText) {
    throw new Error('Invalid PIN');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (_error) {
    throw new Error('Invalid decrypted payload format');
  }

  return parsed;
}
