import { apiClient } from './client';

export const authService = {
  register: async (userData: any) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('[Eroare Frontend - Auth]:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Nu am putut contacta serverul. Verifică conexiunea!');
    }
  }
};