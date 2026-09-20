import { generateEmbedding, rerankCandidates } from './bedrock.service.js';
import { createDownloadUrl } from './s3.service.js';
import { hybridSearchQuery } from '../db/queries/search.queries.js';

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

    // Deduplicate identical or near-identical chunk texts
    const seenTexts = new Set<string>();
    const uniqueRows = rows.filter(r => {
        const key = (r.chunk_text || '').trim().substring(0, 80);
        if (seenTexts.has(key)) return false;
        seenTexts.add(key);
        return true;
    });

    // 3. Rerank top candidates using Cross-Encoder or calibrated scoring
    const candidates = uniqueRows.map(r => ({
        chunkId: r.chunk_id,
        chunkText: r.chunk_text,
        rrfScore: Number(r.rrf_score) || 0,
        denseSimilarity: Number(r.dense_similarity) || 0,
        isLexicalMatch: Boolean(r.is_lexical_match)
    }));

    const reranked = await rerankCandidates(query, candidates, limit);

    // 4. Generate presigned URLs & map to SearchResult
    const results: SearchResult[] = await Promise.all(
        reranked.map(async (ranked) => {
            const row = rows.find(r => r.chunk_id === ranked.chunkId)!;
            const downloadUrl = await createDownloadUrl(row.storage_key);
            
            return {
                documentId: row.document_id,
                fileName: row.file_name,
                clauseIdentifier: row.clause_identifier,
                clauseTitle: row.clause_title,
                parentClauseText: row.parent_clause_text,
                matchedChunkText: ranked.chunkText,
                pageNumber: row.page_number,
                coordinates: row.coordinates,
                relevanceScore: ranked.relevanceScore,
                pdfUrl: downloadUrl
            };
        })
    );

    return results;
}
