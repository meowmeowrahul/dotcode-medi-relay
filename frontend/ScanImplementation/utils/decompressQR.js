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

function parseMedicationText(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  return value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [n, d = '', r = ''] = item.split('|').map((part) => part.trim());
      return { n, d, r };
    });
}

function parseVitals(value) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;

  const hrMatch = text.match(/(?:^|\b)hr\s*[:=]?\s*(\d{2,3})\b/i);
  const bpMatch = text.match(/(?:^|\b)bp\s*[:=]?\s*(\d{2,3}\s*\/\s*\d{2,3})\b/i);

  const vitals = { raw: text };
  if (hrMatch) vitals.hr = Number(hrMatch[1]);
  if (bpMatch) vitals.bp = bpMatch[1].replace(/\s+/g, '');

  return vitals;
}

function normalizePayloadShape(parsed) {
  const expanded = {
    ...parsed,
    doctorId: parsed.doctorId || parsed.di || parsed.did,
    fromHospital: parsed.fromHospital || parsed.fh,
    toHospital: parsed.toHospital || parsed.th,
    bloodGroup: parsed.bloodGroup || parsed.bg,
    patientId: parsed.patientId || parsed.i,
    patientName: parsed.patientName || parsed.pn,
    age: parsed.age ?? parsed.ag,
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
    did: expanded.did || expanded.doctorId,
    fh: expanded.fh || expanded.fromHospital,
    th: expanded.th || expanded.toHospital,
    bg: expanded.bg || expanded.bloodGroup,
    pid: expanded.pid || expanded.patientId,
    nam: expanded.nam || expanded.patientName,
    pd: expanded.pd || expanded.primaryDiagnosis,
    rt: expanded.rt || expanded.transferReason,
    alg: expanded.alg ?? toArray(expanded.allergies),
    med: Array.isArray(expanded.med)
      ? expanded.med
      : parseMedicationText(expanded.activeMedications),
    vit: typeof expanded.vit === 'object' && expanded.vit !== null
      ? expanded.vit
      : (typeof expanded.lastVitals === 'object' && expanded.lastVitals !== null
        ? expanded.lastVitals
        : parseVitals(expanded.lastVitals)),
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
