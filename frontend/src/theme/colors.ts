export type ThemeColors = {
  background: string;
  card: string;
  primary: string;
  secondary: string;
  textDark: string;
  textLight: string;
  white: string;
  error: string;
  errorBg: string;
  success: string;
  gray: string;
  border: string;
};

export const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#2563EB',
  secondary: '#38BDF8',
  textDark: '#2D3748',
  textLight: '#718096',
  white: '#FFFFFF',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  success: '#10B981',
  gray: '#CBD5E1',
  border: '#E2E8F0',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  primary: '#3B82F6',
  secondary: '#38BDF8',
  textDark: '#F1F5F9',
  textLight: '#94A3B8',
  white: '#FFFFFF',
  error: '#F87171',
  errorBg: '#450A0A',
  success: '#34D399',
  gray: '#475569',
  border: '#334155',
};

export const colors = lightTheme;