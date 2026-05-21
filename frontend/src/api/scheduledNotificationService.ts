import { apiClient } from './client';

export interface ScheduledNotification {
  id: number;
  hour: number;
  minute: number;
  emotion: string;
  is_active: boolean;
  created_at: string;
}

export const scheduledNotificationService = {
  getAll: async (): Promise<ScheduledNotification[]> => {
    try {
      const response = await apiClient.get('/scheduled-notifications');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare notificări programate:', error);
      throw error;
    }
  },

  create: async (data: {
    hour: number;
    minute: number;
    emotion: string;
  }): Promise<ScheduledNotification> => {
    try {
      const response = await apiClient.post('/scheduled-notifications', data);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Creare notificare programată:', error);
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<{
      hour: number;
      minute: number;
      emotion: string;
      is_active: boolean;
    }>,
  ): Promise<ScheduledNotification> => {
    try {
      const response = await apiClient.put(`/scheduled-notifications/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Actualizare notificare programată:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/scheduled-notifications/${id}`);
    } catch (error) {
      console.error('[Eroare Frontend] Ștergere notificare programată:', error);
      throw error;
    }
  },
};
