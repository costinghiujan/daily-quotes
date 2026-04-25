import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

const LANGUAGE_STORE_KEY = 'app_language';

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORE_KEY);

  if (!savedLanguage) {
    const locales = getLocales();
    savedLanguage = locales.length > 0 ? locales[0].languageCode : 'en';
    if (savedLanguage !== 'en' && savedLanguage !== 'ro') {
      savedLanguage = 'en';
    }
  }

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
};

initI18n();

export default i18n;
