export const Colors = {
  primary: '#2D7CFF',          // Vibrant Action Blue
  secondary: '#F4F8FF',        // Soft Sky Tint (Used for background cards/chips)
  critical: '#EF4444',         // Keeping a distinct emergency error
  warning: '#FFB02E',          // Missed Dosage / Alert
  success: '#4CAF50',          // Pill Taken / Schedule Completed
  background: '#F4F8FF',       // Soft Sky Tint
  surface: '#FFFFFF',          // Pure White
  textPrimary: '#1A1C1E',      // Near Black
  textSecondary: '#70798C',    // Cool Gray
  border: '#E5EDFF',           // Gentle subtle border
};

export const Radii = {
  card: 16,
  button: 12,
  pill: 20,
};

export const Shadows = {
  soft: {
    shadowColor: '#2D7CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3, // For Android
  },
};

export const Typography = {
  h1: {
    fontFamily: 'System', // Will map to Inter/San-Serif inherently or customized via style
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5, // tight tracking
    color: Colors.textPrimary, 
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.primary,
  },
  body1: {
    fontSize: 16,
    fontWeight: '500', // Medium weight
    lineHeight: 25.6, // 1.6 line-height
    color: Colors.textPrimary,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 22.4,
    color: Colors.textSecondary,
  },
};
