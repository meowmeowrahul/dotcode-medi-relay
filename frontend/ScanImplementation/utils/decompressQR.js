import LZString from 'lz-string';

function extractDataSection(rawString) {
  const dataTag = 'DATA:';
  const idx = rawString.indexOf(dataTag);
  if (idx === -1) return null;
  return rawString.substring(idx + dataTag.length).trim();
}

function tryParseJson(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.replace(/^\uFEFF/, '').trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizePayloadShape(parsed) {
  const expanded = {
    ...parsed,
    patientId: parsed.patientId || parsed.i,
    patientName: parsed.patientName || parsed.pn,
    primaryDiagnosis: parsed.primaryDiagnosis || parsed.dx,
    activeMedications: parsed.activeMedications || parsed.md,
    allergies: parsed.allergies || parsed.al,
    transferReason: parsed.transferReason || parsed.rs,
    lastVitals: parsed.lastVitals || parsed.vt,
    pendingInvestigations: parsed.pendingInvestigations || parsed.in,
    clinicalSummary: parsed.clinicalSummary || parsed.sm,
  };

  const normalized = {
    ...expanded,
    pid: expanded.pid || expanded.patientId,
    nam: expanded.nam || expanded.patientName,
    pd: expanded.pd || expanded.primaryDiagnosis,
    rt: expanded.rt || expanded.transferReason,
    alg: expanded.alg ?? toArray(expanded.allergies),
    med: Array.isArray(expanded.med) ? expanded.med : [],
    vit: typeof expanded.vit === 'object' && expanded.vit !== null
      ? expanded.vit
      : (typeof expanded.lastVitals === 'object' && expanded.lastVitals !== null ? expanded.lastVitals : undefined),
    pi: expanded.pi ?? toArray(expanded.pendingInvestigations),
    sum: expanded.sum || expanded.clinicalSummary,
  };

  return normalized;
}

/**
 * Decompress and parse a QR code payload.
 *
 * The QR code contains a raw string that was compressed using
 * LZString.compressToEncodedURIComponent(). This function reverses
 * that process and returns the parsed JSON object.
 *
 * @param {string} rawString — The raw string scanned from the QR code
 * @returns {Object} The parsed patient transfer record
 * @throws {Error} If decompression or parsing fails
 */
export function decompressQRPayload(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('Invalid QR data: expected a non-empty string');
  }

  // Support both compact payloads and MEDRELAY text envelopes.
  const candidates = [
    rawString,
    extractDataSection(rawString),
    LZString.decompressFromEncodedURIComponent(rawString),
    LZString.decompressFromBase64(rawString),
    (() => {
      const dataSection = extractDataSection(rawString);
      return dataSection ? LZString.decompressFromBase64(dataSection) : null;
    })(),
  ].filter(Boolean);

  let parsed = null;
  for (const candidate of candidates) {
    parsed = tryParseJson(candidate);
    if (parsed) break;
  }

  if (!parsed) {
    throw new Error(
      'Unable to decode QR payload. Expected JSON or a valid compressed DATA section.'
    );
  }

  // Step 3: Basic shape validation
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed payload is not a valid object');
  }

  parsed = normalizePayloadShape(parsed);

  const requiredFields = ['pid', 'nam'];
  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsed;
}
