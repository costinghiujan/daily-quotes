import { apiClient } from './client';

export interface NotificationSettings {
  notify_reactions: boolean;
  notify_friend_requests: boolean;
  notify_friend_accepted: boolean;
}

export interface AppNotification {
  id: number;
  type: string;
  reference_id: number;
  is_read: boolean;
  created_at: string;
  sender_id: number;
  username: string;
  full_name: string;
  profile_picture_url: string;
}

export const notificationService = {
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get('/notifications/settings');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare setări notificări:', error);
      throw error;
    }
  },

  updateSettings: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.put('/notifications/settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Actualizare setări notificări:', error);
      throw error;
    }
  },

  getHistory: async (): Promise<AppNotification[]> => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare istoric notificări:', error);
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/notifications/read');
    } catch (error) {
      console.error('[Eroare Frontend] Marcare notificări ca citite:', error);
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare număr notificări:', error);
      return 0;
    }
  },

  savePushToken: async (pushToken: string): Promise<void> => {
    try {
      await apiClient.post('/notifications/push-token', { pushToken });
      console.log('[Frontend] Push Token salvat cu succes în baza de date.');
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-a putut salva Push Token-ul:', error);
    }
  }
};