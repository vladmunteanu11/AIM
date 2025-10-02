/**
 * Service for handling search-related API requests.
 */
import { apiService as api } from './api';
import { SearchResponse } from '../types/api';

export const searchService = {
  search: async (query: string): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
    return response;
  },
};