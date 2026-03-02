import { apiClient } from './client';

export const friendshipService = {
  sendRequest: async (receiverId: number): Promise<void> => {
    try {
      await apiClient.post('/friendships/request', { receiverId });
    } catch (error) {
      console.error('[Eroare Frontend] Trimitere cerere prietenie:', error);
      throw error;
    }
  }
};