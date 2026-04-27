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
  primaryLight?: string;
  inputBg?: string;
};

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#1877F2',
  secondary: '#45BD62',
  textDark: '#1C1E21',
  textLight: '#8A8D91',
  white: '#FFFFFF',
  error: '#F02849',
  errorBg: '#FEE2E2',
  success: '#45BD62',
  gray: '#F0F2F5',
  border: '#EAEAEA',
  primaryLight: '#E5EFFF',
  inputBg: '#F0F2F5',
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