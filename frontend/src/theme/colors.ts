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

export const oceanTheme: ThemeColors = {
  background: '#1B262C', card: '#0F4C75', primary: '#3282B8', secondary: '#0F4C75',
  textDark: '#BBE1FA', textLight: '#88B0C7', white: '#FFFFFF',
  error: '#FF6B6B', errorBg: '#4A1C1C', success: '#4CAF50', gray: '#2B3A42', border: '#23343F',
};

export const natureTheme: ThemeColors = {
  background: '#F5F5F0', card: '#FFFFFF', primary: '#5D866C', secondary: '#C2A68C',
  textDark: '#2D3A33', textLight: '#7A8C81', white: '#FFFFFF',
  error: '#D32F2F', errorBg: '#FFEBEB', success: '#33cc33', gray: '#D1D1CD', border: '#E6D8C3',
};

export const autumnTheme: ThemeColors = {
  background: '#FFF8F0', card: '#FFFFFF', primary: '#C08552', secondary: '#8C5A3C',
  textDark: '#4B2E2B', textLight: '#A17D6E', white: '#FFFFFF',
  error: '#D32F2F', errorBg: '#FFEBEB', success: '#4CAF50', gray: '#E3D7CE', border: '#EFE5DD',
};

export const minimalistTheme: ThemeColors = {
  background: '#F2F2F2', card: '#FFFFFF', primary: '#000000', secondary: '#B6B09F',
  textDark: '#000000', textLight: '#737065', white: '#FFFFFF',
  error: '#D32F2F', errorBg: '#FFEBEB', success: '#33cc33', gray: '#D9D9D9', border: '#EAE4D5',
};

export const colors = lightTheme;