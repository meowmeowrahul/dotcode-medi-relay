export const Colors = {
  primary: '#0A5C8C',          // Medical Blue
  secondary: '#00897B',        // Teal/Green
  critical: '#D32F2F',         // Emergency Red
  warning: '#F57C00',          // Interaction Orange
  background: '#F4F6F8',       // Soft Gray
  surface: '#FFFFFF',          // Card Color
  textPrimary: '#1D1D1D',      // Near Black
  textSecondary: '#5C6670',    // Subtitles
  border: '#E0E0E0',           // Light border for inputs
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
