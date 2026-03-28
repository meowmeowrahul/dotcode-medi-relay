export const Colors = {
  primary: '#0E6BA8',          // Calm medical blue
  secondary: '#0FA3B1',        // Teal accent
  critical: '#C62828',         // Emergency Red
  warning: '#F9A825',          // Amber warning
  background: '#F5F7FB',       // Soft cool gray-blue
  surface: '#FFFFFF',          // Card / panels
  textPrimary: '#1C2A3D',      // Deep navy-gray
  textSecondary: '#5F6B7A',    // Muted label
  border: '#E3E8EF',           // Gentle border
};

export const Typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.critical, // Can be overridden
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    color: Colors.textPrimary,
  },
  body2: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
};
