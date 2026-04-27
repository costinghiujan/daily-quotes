import { apiClient } from './client';
import { storage } from '../utils/storage';

export const authService = {
  register: async (userData: any) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('[Eroare Frontend - Auth/Register]:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Nu am putut contacta serverul. Verifică conexiunea!');
    }
  },

  login: async (credentials: { identifier: string; password: string }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);

      const token = response.data.data.token;

      if (token) {
        await storage.setToken(token);
        console.log('[Auth Service] Token JWT salvat cu succes în memorie!');
      }

      return response.data;
    } catch (error: any) {
      console.error('[Eroare Frontend - Auth/Login]:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Eroare de conexiune la server.');
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error: any) {
      console.error('[Eroare Frontend - Auth/Logout]:', error);
      // Don't throw - we still want to clear local state even if server call fails
    }
  },
};
