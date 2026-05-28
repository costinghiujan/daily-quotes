import { apiClient } from './client';
import { Quote } from '../types/Quote';

export interface Comment {
  id: number;
  text: string;
  user_id: number;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string;
}

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
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/quotes/${id}`);
    } catch (error) {
      console.error(`[Eroare Frontend] Nu s-a putut șterge citatul cu ID ${id}:`, error);
      throw error;
    }
  },

  update: async (
    id: number,
    updatedQuote: Partial<Omit<Quote, 'id' | 'created_at'>>,
  ): Promise<Quote> => {
    try {
      const response = await apiClient.put<ApiResponse>(`/quotes/${id}`, updatedQuote);

      return response.data.data as Quote;
    } catch (error) {
      console.error(`[Eroare Frontend] Nu s-a putut actualiza citatul cu ID ${id}:`, error);
      throw error;
    }
  },

  getFeed: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/quotes/feed');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-a putut prelua feed-ul:', error);
      throw error;
    }
  },

  toggleReaction: async (quoteId: number, reactionType: string): Promise<void> => {
    try {
      await apiClient.post(`/quotes/${quoteId}/react`, { reactionType });
    } catch (error) {
      console.error('[Eroare Frontend] Nu s-a putut trimite reacția:', error);
      throw error;
    }
  },

  getComments: async (quoteId: number): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/quotes/${quoteId}/comments`);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare comentarii:', error);
      throw error;
    }
  },

  addComment: async (quoteId: number, text: string): Promise<Comment> => {
    try {
      const response = await apiClient.post(`/quotes/${quoteId}/comments`, { text });
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Adăugare comentariu:', error);
      throw error;
    }
  },

  getExploreFeed: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/quotes/explore');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare Explore:', error);
      throw error;
    }
  },

  searchQuotes: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/quotes/search?q=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Căutare citate:', error);
      throw error;
    }
  },

  getQuoteOfTheDay: async (): Promise<any | null> => {
    try {
      const response = await apiClient.get('/quotes/hall-of-fame');
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare Citatul Zilei:', error);
      return null;
    }
  },

  // Feature G: Semantic Search
  semanticSearchQuotes: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/quotes/search?q=${encodeURIComponent(query)}&semantic=true`);
      return response.data.data;
    } catch (error) {
      console.error('[Eroare Frontend] Căutare semantică:', error);
      throw error;
    }
  },

  // Feature H: Similar Quotes
  getSimilarQuotes: async (quoteId: number): Promise<{ source: any; data: any[] }> => {
    try {
      const response = await apiClient.get(`/quotes/${quoteId}/similar`);
      return response.data;
    } catch (error) {
      console.error('[Eroare Frontend] Preluare citate similare:', error);
      throw error;
    }
  },
};
