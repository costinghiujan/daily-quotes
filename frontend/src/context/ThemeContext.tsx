import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  lightTheme, darkTheme, oceanTheme, natureTheme, autumnTheme, minimalistTheme, ThemeColors 
} from '../theme/colors';

export type ThemeType = 'light' | 'dark' | 'ocean' | 'nature' | 'autumn' | 'minimalist';

interface ThemeContextProps {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  colors: lightTheme,
  setTheme: () => {},
});

const themeMap: Record<ThemeType, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  nature: natureTheme,
  autumn: autumnTheme,
  minimalist: minimalistTheme,
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@app_theme') as ThemeType;
        if (savedTheme && themeMap[savedTheme]) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Eroare la încărcarea temei:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('@app_theme', newTheme);
    } catch (error) {
      console.error('Eroare la salvarea temei:', error);
    }
  };

  const currentColors = themeMap[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors: currentColors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};