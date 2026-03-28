/**
 * Usage:
 * import SecureQRCodeGenerator from '@/components/isolated/SecureQRCodeGenerator';
 * <SecureQRCodeGenerator uuid={secureUuid} />
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/Theme';

type SecureQRCodeGeneratorProps = {
  uuid: string;
  size?: number;
};

export default function SecureQRCodeGenerator({ uuid, size = 220 }: SecureQRCodeGeneratorProps) {
  const deepLinkUrl = useMemo(() => {
    const clean = String(uuid || '').trim();
    return `https://medirelay.app/transfer/${encodeURIComponent(clean)}`;
  }, [uuid]);

  const showPlaceholder = !uuid || !String(uuid).trim();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Transfer QR</Text>
      {showPlaceholder ? (
        <Text style={styles.placeholder}>A valid UUID is required to generate the secure QR.</Text>
      ) : (
        <>
          <View style={styles.qrWrap}>
            <QRCode value={deepLinkUrl} size={size} />
          </View>
          <Text style={styles.url}>{deepLinkUrl}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  qrWrap: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  url: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  placeholder: {
    fontSize: 14,
    color: Colors.warning,
    textAlign: 'center',
  },
});
