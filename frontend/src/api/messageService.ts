import { apiClient } from './client';

export interface Conversation {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture_url: string | null;
  last_message: string;
  last_message_date: string;
  is_read: boolean;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare conversații:',
        error.response?.data?.message || error.message,
      );
      throw error;
    }
  },

  getHistory: async (userId: number): Promise<Message[]> => {
    try {
      const response = await apiClient.get(`/messages/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare istoric:',
        error.response?.data?.message || error.message,
      );
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/messages/unread-count');
      return response.data.data;
    } catch (error: any) {
      console.error(
        '[Eroare Frontend] Preluare număr mesaje necitite:',
        error.response?.data?.message || error.message,
      );
      return 0;
    }
  },
};
