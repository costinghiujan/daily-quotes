import { apiClient } from './client';

export interface MoodSearchResult {
  id: number;
  text: string;
  author: string;
  created_at: string;
  user_id: number;
  post_user_id: number;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  blue_heart_count: number;
  applause_count: number;
  sad_count: number;
  touching_count: number;
  hug_count: number;
  mind_blown_count: number;
  user_reactions: string[];
  recommendation_score?: number;
}

export const moodService = {
  searchByMood: async (mood: string): Promise<MoodSearchResult[]> => {
    try {
      const response = await apiClient.post('/quotes/mood-search', { mood });
      return response.data.data;
    } catch (error) {
      console.error('[MoodService] Error searching by mood:', error);
      throw error;
    }
  },
};
