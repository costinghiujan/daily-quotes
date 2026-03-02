import { apiClient } from './client';

export interface UserProfile {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  created_at?: string;
}

export const userService = {
  searchUsers: async (query: string): Promise<UserProfile[]> => {
    try {
      const response = await apiClient.get(`/users/search?q=${query}`);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Căutare utilizatori:', error);
      throw error;
    }
  },
};