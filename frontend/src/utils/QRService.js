import LZString from 'lz-string';

// Map to compress the JSON keys for the payload
export const MinificationMap = {
  patientId: 'i',
  patientName: 'pn',
  age: 'ag',
  primaryDiagnosis: 'dx',
  activeMedications: 'md',
  allergies: 'al',
  transferReason: 'rs',
  lastVitals: 'vt',
  pendingInvestigations: 'in',
  clinicalSummary: 'sm',
};

// Create a reverse map for decompression
export const DeminificationMap = Object.entries(MinificationMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

/**
 * Minifies the form keys to reduce payload size.
 */
const minifyData = (data) => {
  const minified = {};
  for (const [key, value] of Object.entries(data)) {
    const minKey = MinificationMap[key] || key; // fallback to original key if not found
    minified[minKey] = value;
  }
  return minified;
};

/**
 * Reverses the minification process.
 */
const deminifyData = (minifiedData) => {
  const deminified = {};
  for (const [key, value] of Object.entries(minifiedData)) {
    const origKey = DeminificationMap[key] || key;
    deminified[origKey] = value;
  }
  return deminified;
};

/**
 * Generates the human-readable text + Data payload.
 * Format:
 * [MEDRELAY]
 * Name: {patientName}
 * DX: {diagnosis}
 * Allergy: {allergies}
 * Summary: {summary}
 * DATA:{Compressed_Base64_JSON}
 */
export const generatePayload = (formData) => {
  const minified = minifyData(formData);
  const jsonString = JSON.stringify(minified);
  
  // Compress and encode to Base64 using lz-string
  const compressed = LZString.compressToBase64(jsonString);

  // Build the human-readable header that native cameras can parse
  // using default Fallback strings to avoid undefined
  const patientName = formData.patientName || 'Unknown Patient';
  const dx = formData.primaryDiagnosis || 'None';
  const allergy = formData.allergies || 'None';
  const summary = formData.clinicalSummary || 'No summary provided';
  const age = formData.age || 'No Age given';
  const activeMedications = formData.activeMedications
    || (Array.isArray(formData.med)
      ? formData.med
        .map((med) => {
          const n = med?.n || '';
          const d = med?.d || '';
          const r = med?.r || '';
          return [n, d, r].filter(Boolean).join(' | ');
        })
        .filter(Boolean)
        .join('; ')
      : '')
    || 'No Data Provided';

  
  
  // Return the strict formatting required
  return `[MEDRELAY]\nName: ${patientName}\nAge: ${age}\nDX: ${dx}\nAllergy: ${allergy}\nActive Medications: ${activeMedications}\nSummary: ${summary}\nDATA:${compressed}`;
};

/**
 * Parses a QR string back into the original form object.
 */
export const parsePayload = (qrString) => {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error("Invalid QR string.");
  }

  // Find the base64 payload after "DATA:"
  const dataTag = "DATA:";
  const dataIndex = qrString.indexOf(dataTag);

  if (dataIndex === -1) {
    throw new Error("Invalid format: 'DATA:' tag not found.");
  }

  const compressedData = qrString.substring(dataIndex + dataTag.length).trim();
  
  if (!compressedData) {
    throw new Error("No compressed data found after 'DATA:'.");
  }

  // Decompress the base64 back into JSON string
  const decompressedString = LZString.decompressFromBase64(compressedData);
  
  if (!decompressedString) {
    throw new Error("Failed to decompress the QR payload.");
  }

  try {
    const minifiedObj = JSON.parse(decompressedString);
    return deminifyData(minifiedObj);
  } catch (_error) {
    throw new Error("Failed to parse the decompressed JSON data.");
  }
};
