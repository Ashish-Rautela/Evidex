import { generateEmbedding, rerankCandidates } from './bedrock.service.js';
import { createDownloadUrl } from './s3.service.js';
import { hybridSearchQuery } from '../db/queries/search.queries.js';

export interface SearchResult {
    chunkId: string;
    chunkText: string;
    documentId: string;
    downloadUrl: string;
    metadata?: any;
    relevanceScore?: number;
}

export async function hybridSearch(
    query: string, 
    tenantId: string, 
    userId: string, 
    limit: number, 
    documentIds?: string[]
): Promise<SearchResult[]> {
    // 1. Generate query embedding
    const queryVector = await generateEmbedding(query);

    // 2. Perform hybrid search SQL using the dedicated query function
    // We fetch a larger candidate pool (e.g., 100) and let the reranker pick the top `limit`
    const rows = await hybridSearchQuery(queryVector, tenantId, userId, query, 100, documentIds);

    if (rows.length === 0) return [];

    // 3. Rerank top candidates using Cross-Encoder
    const candidates = rows.map(r => ({
        chunkId: r.chunk_id,
        chunkText: r.chunk_text
    }));

    const reranked = await rerankCandidates(query, candidates, limit);

    // 4. Generate presigned URLs & map to SearchResult
    const results: SearchResult[] = await Promise.all(
        reranked.map(async (ranked) => {
            const row = rows.find(r => r.chunk_id === ranked.chunkId)!;
            const downloadUrl = await createDownloadUrl(row.storage_key);
            
            return {
                chunkId: ranked.chunkId,
                chunkText: ranked.chunkText,
                documentId: row.document_id,
                downloadUrl,
                relevanceScore: ranked.relevanceScore,
                metadata: {
                    pageNumber: row.page_number,
                    coordinates: row.coordinates,
                    clauseIdentifier: row.clause_identifier,
                    clauseTitle: row.clause_title,
                    parentClauseText: row.parent_clause_text,
                    fileName: row.file_name
                }
            };
        })
    );

    return results;
}
