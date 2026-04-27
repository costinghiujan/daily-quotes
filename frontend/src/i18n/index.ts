import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem('app_language');
  } catch (error) {
    console.error('[i18n] Eroare la citirea limbii salvate:', error);
  }

  const deviceLanguage = Localization.getLocales?.()?.[0]?.languageCode || 'en';
  const fallbackLng = savedLanguage || deviceLanguage || 'en';

  i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLng,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

initI18n();

export default i18n;
