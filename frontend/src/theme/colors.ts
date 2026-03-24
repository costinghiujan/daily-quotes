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
  background: '#FFFDF1', card: '#FFFFFF', primary: '#ff9849', secondary: '#FFCE99',
  textDark: '#562F00', textLight: '#8A5A2B', white: '#FFFFFF',
  error: '#D32F2F', errorBg: '#FFEBEB', success: '#33cc33', gray: '#e0e0e0', border: '#eeeeee',
};

export const darkTheme: ThemeColors = {
  background: '#121212', card: '#1E1E1E', primary: '#ff9849', secondary: '#8a5a2b',
  textDark: '#FFFFFF', textLight: '#B0B0B0', white: '#FFFFFF',
  error: '#FF6B6B', errorBg: '#4A1C1C', success: '#4CAF50', gray: '#424242', border: '#2C2C2C',
};

export const colors = lightTheme;