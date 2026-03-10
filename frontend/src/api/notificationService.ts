import { apiClient } from './client';

export interface NotificationSettings {
  notify_reactions: boolean;
  notify_friend_requests: boolean;
  notify_friend_accepted: boolean;
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
  }
};