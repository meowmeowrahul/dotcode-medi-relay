import React from 'react';
import { Redirect } from 'expo-router';

export default function ScannerRedirect() {
	return <Redirect href="/(tabs)/scanner" />;
}
