import { apiClient } from './client';
import { Quote } from '../types/Quote';

interface ApiResponse {
  status: string;
  results?: number;
  data: Quote[] | Quote; 
  message?: string;
}

export const quoteService = {
  getAll: async (): Promise<Quote[]> => {
    try {
      const response = await apiClient.get<ApiResponse>('/quotes');
      return response.data.data as Quote[];
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-au putut prelua citatele:', error);
      throw error;
    }
  },

  create: async (newQuote: Omit<Quote, 'id' | 'created_at'>): Promise<Quote> => {
    try {
      const response = await apiClient.post<ApiResponse>('/quotes', newQuote);
      return response.data.data as Quote;
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-a putut crea citatul:', error);
      throw error;
    }
  }
};