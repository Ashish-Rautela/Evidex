import { z } from 'zod';
import { BoundingBox } from './chunk.types';

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().min(1).max(20).optional().default(5),
  documentIds: z.array(z.string()).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export interface SearchResult {
  documentId: string;
  fileName: string;
  clauseIdentifier: string | null;
  clauseTitle: string | null;
  parentClauseText: string;
  matchedChunkText: string;
  pageNumber: number;
  coordinates: BoundingBox;
  relevanceScore: number;
  pdfUrl: string;
}

export interface RankedChunk {
  chunkId: string;
  clauseId: string;
  documentId: string;
  chunkText: string;
  pageNumber: number;
  coordinates: BoundingBox;
  rrfScore: number;
}
