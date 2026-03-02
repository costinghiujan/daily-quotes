import { apiClient } from './client';
import { UserProfile } from './userService';

export interface FriendRequest extends UserProfile {
  created_at: string;
}

export const friendshipService = {
  sendRequest: async (receiverId: number): Promise<void> => {
    try {
      await apiClient.post('/friendships/request', { receiverId });
    } catch (error) {
      console.error('[Eroare Frontend] Trimitere cerere:', error);
      throw error;
    }
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await apiClient.get('/friendships/pending');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare notificări:', error);
      throw error;
    }
  },

  acceptRequest: async (requesterId: number): Promise<void> => {
    try {
      await apiClient.put('/friendships/accept', { requesterId });
    } catch (error) {
      console.error('[Eroare Frontend] Acceptare cerere:', error);
      throw error;
    }
  },

  removeFriendOrRequest: async (targetUserId: number): Promise<void> => {
    try {
      await apiClient.delete(`/friendships/remove/${targetUserId}`);
    } catch (error) {
      console.error('[Eroare Frontend] Ștergere/Respingere cerere:', error);
      throw error;
    }
  }
};