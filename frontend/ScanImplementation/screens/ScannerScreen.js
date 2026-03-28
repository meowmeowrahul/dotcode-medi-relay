import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import LZString from 'lz-string';
import { Colors } from '../../src/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_WIDTH * 0.7;

function extractSecureTransferUuid(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();

  const withProtocolMatch = value.match(/https?:\/\/[^\s]+\/transfer\/([^/?#\s]+)/i);
  if (withProtocolMatch?.[1]) return decodeURIComponent(withProtocolMatch[1]);

  const barePathMatch = value.match(/(?:^|\s|\/)transfer\/([^/?#\s]+)/i);
  if (barePathMatch?.[1]) return decodeURIComponent(barePathMatch[1]);

  return null;
}

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

  return {
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
}

function decodeLegacyPayload(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('Invalid QR data: expected a non-empty string');
  }

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

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unable to decode QR payload. Expected secure URL or valid transfer JSON payload.');
  }

  const normalized = normalizePayloadShape(parsed);
  if (!normalized.pid || !normalized.nam) {
    throw new Error('Decoded payload is missing required patient fields.');
  }

  return normalized;
}

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    setError(null);

    try {
      const secureUuid = extractSecureTransferUuid(data);
      if (secureUuid) {
        router.replace({
          pathname: '/(secure-qr)/transfer/[uuid]',
          params: { uuid: secureUuid },
        });
        return;
      }

      const parsed = decodeLegacyPayload(data);
      router.replace({
        pathname: '/(tabs)/scan-result',
        params: { data: JSON.stringify(parsed) },
      });
    } catch (err) {
      setError(err.message);
      setProcessing(false);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleClose = () => {
    router.back();
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.permissionText}>Requesting camera access…</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionBody}>
            MediRelay needs access to your camera to scan patient transfer QR codes.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.instructionText}>
            Align the Transfer QR code within the frame
          </Text>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
              <Text style={styles.errorSubtext}>Scanning will retry automatically…</Text>
            </View>
          )}
          {processing && !error && (
            <View style={styles.processingBanner}>
              <ActivityIndicator size="small" color={Colors.surface} />
              <Text style={styles.processingText}>Processing QR data…</Text>
            </View>
          )}
        </View>
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centeredContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  permissionCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 32,
    alignItems: 'center', width: '100%', maxWidth: 360,
  },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  permissionTitle: {
    fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary,
    marginBottom: 12, textAlign: 'center',
  },
  permissionText: { fontSize: 16, color: Colors.textSecondary, marginTop: 16 },
  permissionBody: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  grantButton: {
    backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12,
  },
  grantButtonText: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  cancelButtonText: { color: Colors.textSecondary, fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: VIEWFINDER_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', paddingTop: 32,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: Colors.secondary },
  cornerTL: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  instructionText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 15,
    textAlign: 'center', paddingHorizontal: 24,
  },
  errorBanner: {
    marginTop: 16, backgroundColor: Colors.critical,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
    alignItems: 'center', marginHorizontal: 24,
  },
  errorText: { color: Colors.surface, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorSubtext: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  processingBanner: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
  },
  processingText: { color: Colors.surface, fontSize: 14, marginLeft: 10 },
  closeButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, left: 20,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});
