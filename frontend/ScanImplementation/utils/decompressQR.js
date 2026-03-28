import LZString from 'lz-string';

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

  // Step 1: Decompress
  let jsonString;
  try {
    jsonString = LZString.decompressFromEncodedURIComponent(rawString);
  } catch (err) {
    throw new Error(`Decompression failed: ${err.message}`);
  }

  if (!jsonString) {
    throw new Error(
      'Decompression returned empty result. The QR code may not contain a valid lz-string compressed payload.'
    );
  }

  // Step 2: Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`JSON parse failed after decompression: ${err.message}`);
  }

  // Step 3: Basic shape validation
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed payload is not a valid object');
  }

  const requiredFields = ['pid', 'nam'];
  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsed;
}
