import { apiClient } from './client';

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
      
      return response.data;
    } catch (error: any) {
      console.error('[Eroare Frontend - Auth/Login]:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Eroare de conexiune la server.');
    }
  }
};