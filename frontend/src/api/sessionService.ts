import { apiClient } from './client';

export interface Session {
  id: number;
  device_name: string;
  created_at: string;
}

export interface SessionsResponse {
  currentSessionId: number;
  sessions: Session[];
}

export const sessionService = {
  getActiveSessions: async (): Promise<SessionsResponse> => {
    try {
      const response = await apiClient.get('/sessions');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare sesiuni:', error);
      throw error;
    }
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    try {
      await apiClient.delete(`/sessions/${sessionId}`);
    } catch (error) {
      console.error('[Eroare Frontend] Revocare sesiune:', error);
      throw error;
    }
  },
};
