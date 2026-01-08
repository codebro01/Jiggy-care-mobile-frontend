/**
 * Jiggy Care Mobile - Color Palette
 * Primary: Deep Blue #0583D2
 * Secondary: Coral #FF7F50
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#E6F4FB',
    100: '#CCE9F7',
    200: '#99D3EF',
    300: '#66BDE7',
    400: '#33A7DF',
    500: '#0583D2', // Main primary
    600: '#0469A8',
    700: '#034F7E',
    800: '#023554',
    900: '#011A2A',
  },

  // Secondary Colors (Coral)
  secondary: {
    50: '#FFF5F0',
    100: '#FFEAE0',
    200: '#FFD5C2',
    300: '#FFC0A3',
    400: '#FFAB85',
    500: '#FF7F50', // Main secondary
    600: '#CC6640',
    700: '#994C30',
    800: '#663320',
    900: '#331910',
  },

  // Semantic Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Light Theme Colors
export const lightTheme = {
  background: {
    primary: colors.white,
    secondary: colors.gray[50],
    tertiary: colors.gray[100],
  },
  surface: {
    primary: colors.white,
    secondary: colors.gray[50],
    elevated: colors.white,
  },
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[400],
    inverse: colors.white,
  },
  border: {
    primary: colors.gray[200],
    secondary: colors.gray[100],
  },
  accent: colors.primary[500],
  accentSecondary: colors.secondary[500],
};

// Dark Theme Colors
export const darkTheme = {
  background: {
    primary: '#0A0A0A',
    secondary: '#111111',
    tertiary: '#1A1A1A',
  },
  surface: {
    primary: '#151515',
    secondary: '#1A1A1A',
    elevated: '#202020',
  },
  text: {
    primary: colors.gray[50],
    secondary: colors.gray[400],
    tertiary: colors.gray[500],
    inverse: colors.gray[900],
  },
  border: {
    primary: colors.gray[800],
    secondary: colors.gray[700],
  },
  accent: colors.primary[400],
  accentSecondary: colors.secondary[400],
};

export type ThemeColors = typeof lightTheme;
