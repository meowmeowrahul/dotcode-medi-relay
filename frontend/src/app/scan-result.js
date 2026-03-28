import React from 'react';
import { Redirect } from 'expo-router';

export default function ScanResultRedirect() {
	return <Redirect href="/(tabs)/scan-result" />;
}
