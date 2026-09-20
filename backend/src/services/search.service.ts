import { generateEmbedding, rerankCandidates } from './bedrock.service.js';
import { createDownloadUrl } from './s3.service.js';
import { hybridSearchQuery } from '../db/queries/search.queries.js';

// Legal abbreviation and synonym expansion to improve query embedding recall.
const LEGAL_EXPANSIONS: Record<string, string> = {
    'nda':                  'non-disclosure agreement confidentiality',
    'ip':                   'intellectual property rights',
    'sla':                  'service level agreement',
    'tos':                  'terms of service',
    'msa':                  'master service agreement',
    'sow':                  'statement of work',
    'liability':            'liability indemnification damages',
    'termination':          'termination expiry notice period end of contract',
    'payment':              'payment fees compensation remuneration',
    'breach':               'breach default violation non-performance',
    'governing law':        'governing law jurisdiction applicable law',
    'force majeure':        'force majeure act of god unforeseen circumstances',
    'confidential':         'confidential proprietary secret non-disclosure',
    'warranty':             'warranty representation guarantee indemnity',
    'assignment':           'assignment transfer delegation novation',
    'combination product':  'combination product bundled product composite article',
    'net sales':            'net sales gross revenue invoiced price deductions royalty base',
    'royalty':              'royalty royalties milestone payment license fee',
    'indemnify':            'indemnify indemnification hold harmless defend',
};

function expandLegalQuery(query: string): string {
    const lower = query.toLowerCase();
    const expansions: string[] = [];
    for (const [term, expansion] of Object.entries(LEGAL_EXPANSIONS)) {
        if (lower.includes(term)) {
            expansions.push(expansion);
        }
    }
    return expansions.length > 0 ? `${query} ${expansions.join(' ')}` : query;
}

/**
 * Decompose a compound query into focused sub-queries so each intent
 * gets its own embedding — prevents one term drowning out another.
 *
 * Example: "What is the definition of Combination Product, and how are Net Sales calculated for it?"
 *   → ["What is the definition of Combination Product",
 *      "how are Net Sales calculated for it"]
 */
function decomposeQuery(query: string): string[] {
    // Split on ", and" or " and " only before question-like clause starters
    const parts = query
        .split(/,?\s+and\s+(?=how|what|when|where|who|why|whether|is|are|does|can)/i)
        .map(p => p.trim())
        .filter(p => p.length > 8);

    if (parts.length >= 2) return parts;
    return [query];
}

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

/**
 * Adaptive confidence filtering.
 * - Drops any result below minScore (default 0.55).
 * - When top result is highly confident (>= 0.85), keeps only results within 20% of top score.
 * - If no results meet minScore, returns [] (never returns irrelevant fallback).
 */
export function filterByConfidence<T extends { relevanceScore: number }>(
    results: T[],
    minScore = 0.55,
    highConfidenceThreshold = 0.85,
    highConfidenceWindow = 0.20
): T[] {
    const filtered = results.filter(r => r.relevanceScore >= minScore);
    // ponytail: never return low-relevance candidates when none meet confidence floor.
    // Returning [] allows frontend to show "No matching legal clauses found".
    if (filtered.length === 0) return [];

    const topScore = filtered[0].relevanceScore;
    if (topScore >= highConfidenceThreshold) {
        return filtered.filter(r => r.relevanceScore >= topScore - highConfidenceWindow);
    }
    return filtered;
}

export async function hybridSearch(
    query: string, 
    tenantId: string, 
    userId: string, 
    limit: number, 
    documentIds?: string[]
): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed || !/[a-zA-Z0-9]/.test(trimmed)) return [];

    // 1. Decompose compound queries so each intent gets its own focused embedding.
    //    e.g. "What is Combination Product AND how are Net Sales calculated?"
    //    becomes two separate retrieval passes that are then merged.
    const subQueries = decomposeQuery(query);

    // 2. For each sub-query: expand legal terms, embed with role='query', fetch candidates
    const allRowsMap = new Map<string, any>(); // chunk_id → row (deduplicated)

    for (const sub of subQueries) {
        const expandedSub = expandLegalQuery(sub);
        const queryVector = await generateEmbedding(expandedSub, 'query');
        const rows = await hybridSearchQuery(queryVector, tenantId, userId, sub, 100, documentIds);
        for (const row of rows) {
            if (!allRowsMap.has(row.chunk_id)) {
                allRowsMap.set(row.chunk_id, row);
            } else {
                // Keep the row with the higher rrf_score across sub-queries
                const existing = allRowsMap.get(row.chunk_id);
                if (Number(row.rrf_score) > Number(existing.rrf_score)) {
                    allRowsMap.set(row.chunk_id, row);
                }
            }
        }
    }

    const allRows = Array.from(allRowsMap.values());
    if (allRows.length === 0) return [];

    // 3. Deduplicate near-identical chunk texts
    const seenTexts = new Set<string>();
    const uniqueRows = allRows.filter(r => {
        const key = (r.chunk_text || '').trim().substring(0, 80);
        if (seenTexts.has(key)) return false;
        seenTexts.add(key);
        return true;
    });

    // 4. Rerank merged candidate pool against the original full query
    const candidates = uniqueRows.map(r => ({
        chunkId: r.chunk_id,
        chunkText: r.chunk_text,
        rrfScore: Number(r.rrf_score) || 0,
        denseSimilarity: Number(r.dense_similarity) || 0,
        isLexicalMatch: Boolean(r.is_lexical_match)
    }));

    const reranked = await rerankCandidates(query, candidates, limit);

    // 5. Generate presigned URLs & map to SearchResult
    const results: SearchResult[] = await Promise.all(
        reranked.map(async (ranked) => {
            const row = allRowsMap.get(ranked.chunkId)!;
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

    // 6. Adaptive confidence filtering
    return filterByConfidence(results);
}
