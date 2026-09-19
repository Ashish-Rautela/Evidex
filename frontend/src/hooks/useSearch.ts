import { useState } from 'react';
import { apiClient } from '../api/client';

export interface SearchResult {
  documentId: string;
  fileName: string;
  clauseIdentifier?: string;
  clauseTitle?: string;
  parentClauseText?: string;
  matchedChunkText: string;
  pageNumber: number;
  coordinates?: { x1: number; y1: number; x2: number; y2: number };
  relevanceScore: number;
  pdfUrl: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, options?: any) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await apiClient.post('/api/v1/search', { query, ...options });
      setResults(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return { search, results, isSearching, error };
}
