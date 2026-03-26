import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@daily_quotes_auth_token';

export const storage = {
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('[Eroare Storage] Nu s-a putut salva tokenul:', error);
      throw new Error('Eroare la salvarea sesiunii.');
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('[Eroare Storage] Nu s-a putut citi tokenul:', error);
      return null;
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('[Eroare Storage] Nu s-a putut șterge tokenul:', error);
      throw new Error('Eroare la delogare.');
    }
  },
};
