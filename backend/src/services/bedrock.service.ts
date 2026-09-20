import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RerankCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { env } from '../config/env.js';

const bedrockRuntimeClient = new BedrockRuntimeClient({
    region: env.AWS_REGION,
    maxAttempts: 8,
});
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: env.AWS_REGION });

export type EmbedRole = 'query' | 'document';

// ── Model detection ────────────────────────────────────────────────────────────
// Cohere Embed v3: uses native `input_type`, supports batching up to 96 texts per call.
// Titan Embed v2:  processes raw text directly via `inputText` without instruction prefix.
const isCohereModel = () => env.BEDROCK_EMBED_MODEL_ID.startsWith('cohere.embed');

// ── Retry helper ───────────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5, label = ''): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isThrottle = err?.name === 'ThrottlingException' || err?.name === 'TooManyRequestsException' || err?.$metadata?.httpStatusCode === 429;
            if (isThrottle && attempt < maxAttempts) {
                const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
                console.warn(`[Bedrock] Throttled ${label}. Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error(`[Bedrock] Failed ${label} after ${attempt} attempt(s):`, err?.message ?? err);
                throw err;
            }
        }
    }
    throw new Error(`[Bedrock] Exhausted retries for ${label}`);
}

// ── Cohere Embed v3 ────────────────────────────────────────────────────────────
async function embedWithCohere(texts: string[], role: EmbedRole): Promise<number[][]> {
    const BATCH_SIZE = 48;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const result = await withRetry(async () => {
            const command = new InvokeModelCommand({
                modelId: env.BEDROCK_EMBED_MODEL_ID,
                body: JSON.stringify({
                    texts: batch,
                    input_type: role === 'query' ? 'search_query' : 'search_document',
                    truncate: 'END',
                    // Do NOT send embedding_types — some Bedrock regions return
                    // { embeddings: [[...]] } (flat), not { embeddings: { float: [[...]] } }
                }),
                contentType: 'application/json',
                accept: 'application/json',
            });
            const response = await bedrockRuntimeClient.send(command);
            const body = JSON.parse(new TextDecoder().decode(response.body));

            // Cohere Bedrock returns one of these two shapes:
            //   Shape A (no embedding_types): { embeddings: [[...], ...] }
            //   Shape B (with embedding_types): { embeddings: { float: [[...], ...] } }
            const raw = body.embeddings;
            if (!raw) throw new Error(`[Cohere] No embeddings in response: ${JSON.stringify(body)}`);
            const floats: number[][] = Array.isArray(raw) ? raw : (raw.float ?? raw.int8 ?? Object.values(raw)[0]);
            if (!Array.isArray(floats) || floats.length !== batch.length) {
                throw new Error(`[Cohere] Unexpected embeddings shape. Got: ${JSON.stringify(body).slice(0, 200)}`);
            }
            return floats;
        }, 5, `Cohere embed batch ${i / BATCH_SIZE + 1}`);

        allEmbeddings.push(...result);
    }
    return allEmbeddings;
}

// ── Titan Embed v2 ─────────────────────────────────────────────────────────────
async function embedWithTitan(text: string, _role: EmbedRole): Promise<number[]> {
    const cleaned = text.trim();
    if (!cleaned) {
        return new Array(1024).fill(0);
    }
    return withRetry(async () => {
        const command = new InvokeModelCommand({
            modelId: env.BEDROCK_EMBED_MODEL_ID,
            body: JSON.stringify({ inputText: cleaned, dimensions: 1024, normalize: true }),
            contentType: 'application/json',
            accept: 'application/json',
        });
        const response = await bedrockRuntimeClient.send(command);
        const body = JSON.parse(new TextDecoder().decode(response.body));
        return body.embedding;
    }, 5, 'Titan embed');
}

// ── Public API ─────────────────────────────────────────────────────────────────
export async function generateEmbedding(text: string, role: EmbedRole = 'document'): Promise<number[]> {
    if (isCohereModel()) {
        const results = await embedWithCohere([text], role);
        return results[0];
    }
    return embedWithTitan(text, role);
}

export async function generateEmbeddingBatch(texts: string[], role: EmbedRole = 'document'): Promise<number[][]> {
    if (isCohereModel()) {
        // Cohere supports true batching → much faster than sequential calls
        return embedWithCohere(texts, role);
    }
    // Titan: sequential with pacing delay to stay under Bedrock on-demand TPS limit (~10)
    // Upgrade path: request provisioned throughput, then raise concurrency.
    const embeddings: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i]?.trim();
        if (!text) {
            embeddings.push(new Array(1024).fill(0));
            continue;
        }
        embeddings.push(await embedWithTitan(text, role));
        if (i < texts.length - 1) {
            // Pacing delay (100ms) to ensure <= 8-9 TPS
            await new Promise(res => setTimeout(res, 100));
        }
    }
    return embeddings;
}

export interface RerankCandidate {
    chunkId: string;
    chunkText: string;
    rrfScore?: number;
    denseSimilarity?: number;
    isLexicalMatch?: boolean;
}

export interface RerankedCandidate extends RerankCandidate {
    relevanceScore: number;
}

/**
 * Calibrated relevance scoring when Bedrock Cross-Encoder reranker ARN is not set.
 * Maps lexical presence and dense similarity to a realistic [0, 1] relevance score.
 * - Both lexical & dense match: high confidence (0.70 – 0.98).
 * - Lexical match only: 0.70.
 * - Dense only >= 0.65: genuine semantic paraphrase (0.65 – 0.92).
 * - Dense only 0.58–0.65: moderate similarity (0.52 – 0.58).
 * - Dense only < 0.58: background noise / random projection; dropped (< 0.20).
 */
export function computeFallbackScore(c: {
    isLexicalMatch?: boolean;
    denseSimilarity?: number;
}): number {
    const dense = c.denseSimilarity ?? 0;
    const isLexical = Boolean(c.isLexicalMatch);

    let score = 0;
    if (isLexical && dense >= 0.50) {
        score = Math.min(0.98, Math.max(0.70, dense * 1.25));
    } else if (isLexical) {
        score = 0.70;
    } else if (dense >= 0.65) {
        score = Math.min(0.92, dense);
    } else if (dense >= 0.58) {
        score = dense * 0.9;
    } else if (dense > 0.40) {
        score = (dense - 0.40) * 1.0;
    } else {
        score = 0;
    }

    return Math.round(score * 100) / 100;
}

export async function rerankCandidates(
    query: string, 
    candidates: RerankCandidate[], 
    topN: number
): Promise<RerankedCandidate[]> {
    if (candidates.length === 0) return [];

    if (!env.BEDROCK_RERANK_MODEL_ARN) {
        // Fallback: If no reranker is configured, score based on actual similarity and lexical match quality
        return candidates.slice(0, topN).map((c) => ({
            ...c,
            relevanceScore: computeFallbackScore(c)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    const command = new RerankCommand({
        queries: [{ textQuery: { text: query }, type: 'TEXT' }],
        rerankingConfiguration: { 
            type: 'BEDROCK_RERANKING_MODEL', 
            bedrockRerankingConfiguration: { 
                numberOfResults: topN, 
                modelConfiguration: { modelArn: env.BEDROCK_RERANK_MODEL_ARN } 
            } 
        },
        sources: candidates.map(c => ({ 
            type: 'INLINE', 
            inlineDocumentSource: { type: 'TEXT', textDocument: { text: c.chunkText } } 
        }))
    });
    
    const response = await bedrockAgentRuntimeClient.send(command);
    const results = response.results || [];
    
    return results.map(result => {
        const index = result.index ?? 0;
        return {
            ...candidates[index],
            relevanceScore: result.relevanceScore ?? 0
        };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}
