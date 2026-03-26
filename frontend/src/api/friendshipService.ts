import { apiClient } from './client';

export interface FriendRequest {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
}

export interface BlockedUser {
  id: number;
  username: string;
  full_name: string;
  profile_picture_url: string;
  blocked_at: string;
}

export const friendshipService = {
  sendRequest: async (receiverId: number): Promise<void> => {
    try {
      await apiClient.post('/friendships/request', { receiverId });
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.message;
      console.error('[Eroare Frontend] Trimitere cerere:', backendMessage);
      throw new Error(backendMessage);
    }
  },

  acceptRequest: async (requestId: number): Promise<void> => {
    try {
      await apiClient.put(`/friendships/accept/${requestId}`, { requestId });
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.message;
      console.error('[Eroare Frontend] Acceptare cerere:', backendMessage);
      throw new Error(backendMessage);
    }
  },

  removeFriendOrRequest: async (requestId: number): Promise<void> => {
    try {
      await apiClient.delete(`/friendships/${requestId}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.message;
      console.error('[Eroare Frontend] Respingere cerere/prietenie:', backendMessage);
      throw new Error(backendMessage);
    }
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await apiClient.get('/friendships/requests');
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare cereri:',
        error.response?.data?.message || error.message,
      );
      throw error;
    }
  },

  getFriends: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/friendships/friends');
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare prieteni:',
        error.response?.data?.message || error.message,
      );
      throw error;
    }
  },

  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    try {
      const response = await apiClient.get('/friendships/blocks');
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare blocați:',
        error.response?.data?.message || error.message,
      );
      throw error;
    }
  },

  blockUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.post(`/friendships/blocks/${userId}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.message;
      console.error('[Eroare Frontend] Blocare utilizator:', backendMessage);
      throw new Error(backendMessage);
    }
  },

  unblockUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.delete(`/friendships/blocks/${userId}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.message;
      console.error('[Eroare Frontend] Deblocare utilizator:', backendMessage);
      throw new Error(backendMessage);
    }
  },

  checkStatus: async (
    userId: number,
  ): Promise<'FRIENDS' | 'BLOCKED_BY_ME' | 'BLOCKED_BY_THEM' | 'NOT_FRIENDS'> => {
    try {
      const response = await apiClient.get(`/friendships/status/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Status relație:',
        error.response?.data?.message || error.message,
      );
      return 'NOT_FRIENDS';
    }
  },
};
