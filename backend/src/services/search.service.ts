import { db } from '../db/client.js';
import { generateEmbedding, rerankCandidates } from './bedrock.service.js';
import { createDownloadUrl } from './s3.service.js';

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
    const vectorString = `[${queryVector.join(',')}]`;

    // 2. Perform hybrid search SQL CTE
    let sql = `
        WITH dense AS (
            SELECT chunk_id, document_id, text_content, 
                   RANK() OVER (ORDER BY embedding <-> $1::vector) as dense_rank
            FROM document_chunks
            WHERE tenant_id = $2
              AND (acl_user_ids @> ARRAY[$3]::uuid[] OR acl_user_ids = '{}'::uuid[])
              __DOC_FILTER__
            ORDER BY embedding <-> $1::vector
            LIMIT 100
        ),
        lexical AS (
            SELECT chunk_id, document_id, text_content,
                   RANK() OVER (ORDER BY ts_rank_cd(ts_vector, plainto_tsquery('english', $4)) DESC) as lex_rank
            FROM document_chunks
            WHERE tenant_id = $2
              AND (acl_user_ids @> ARRAY[$3]::uuid[] OR acl_user_ids = '{}'::uuid[])
              AND ts_vector @@ plainto_tsquery('english', $4)
              __DOC_FILTER__
            ORDER BY ts_rank_cd(ts_vector, plainto_tsquery('english', $4)) DESC
            LIMIT 100
        ),
        fused AS (
            SELECT 
                COALESCE(d.chunk_id, l.chunk_id) as chunk_id,
                COALESCE(d.document_id, l.document_id) as document_id,
                COALESCE(d.text_content, l.text_content) as text_content,
                (COALESCE(1.0 / (60 + d.dense_rank), 0.0) + COALESCE(1.0 / (60 + l.lex_rank), 0.0)) as rrf_score
            FROM dense d
            FULL OUTER JOIN lexical l ON d.chunk_id = l.chunk_id
        )
        SELECT 
            f.chunk_id as "chunkId",
            f.document_id as "documentId",
            f.text_content as "chunkText",
            f.rrf_score as "rrfScore",
            doc.storage_key as "storageKey"
        FROM fused f
        JOIN documents doc ON f.document_id = doc.document_id
        ORDER BY f.rrf_score DESC
        LIMIT 100;
    `;

    const params: any[] = [vectorString, tenantId, userId, query];
    
    if (documentIds && documentIds.length > 0) {
        sql = sql.replace(/__DOC_FILTER__/g, `AND document_id = ANY($5)`);
        params.push(documentIds);
    } else {
        sql = sql.replace(/__DOC_FILTER__/g, '');
    }

    const { rows } = await db.query(sql, params);

    if (rows.length === 0) return [];

    // 3. Rerank top 100 candidates
    const candidates = rows.map(r => ({
        chunkId: r.chunkId,
        chunkText: r.chunkText
    }));

    const reranked = await rerankCandidates(query, candidates, limit);

    // 4. Generate presigned URLs & map to SearchResult
    const results: SearchResult[] = await Promise.all(
        reranked.map(async (ranked) => {
            const row = rows.find(r => r.chunkId === ranked.chunkId)!;
            const downloadUrl = await createDownloadUrl(row.storageKey);
            
            return {
                chunkId: ranked.chunkId,
                chunkText: ranked.chunkText,
                documentId: row.documentId,
                downloadUrl,
                relevanceScore: ranked.relevanceScore
            };
        })
    );

    return results;
}
