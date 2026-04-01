import { apiClient } from './client';

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  earned_at?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  created_at?: string;
  xp?: number;
  level?: number;
  badges?: Badge[];
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

  getMyProfile: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare profil:', error);
      throw error;
    }
  },

  uploadAvatar: async (imageUri: string) => {
    try {
      const formData = new FormData();

      const filename = imageUri.split('/').pop() || 'profile-picture.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('[Eroare Frontend] Upload avatar:', error);
      throw error;
    }
  },

  updateProfile: async (data: { full_name?: string; bio?: string }): Promise<UserProfile> => {
    try {
      const response = await apiClient.put('/users/profile', data);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Actualizare profil:', error);
      throw error;
    }
  },
};
