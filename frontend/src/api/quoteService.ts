import { apiClient } from './client';
import { Quote } from '../types/Quote';

interface ApiResponse {
  status: string;
  results?: number;
  data: Quote[];
}

export const quoteService = {
  getAll: async (): Promise<Quote[]> => {
    try {
      const response = await apiClient.get<ApiResponse>('/quotes');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-au putut prelua citatele:', error);
      throw error;
    }
  }
};