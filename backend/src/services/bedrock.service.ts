import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RerankCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { env } from '../config/env.js';

const bedrockRuntimeClient = new BedrockRuntimeClient({ region: env.AWS_REGION });
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: env.AWS_REGION });

export type EmbedRole = 'query' | 'document';

// ── Model detection ────────────────────────────────────────────────────────────
// Cohere Embed v3: uses native `input_type` (no text prefix needed), supports
//   batching up to 96 texts per call → faster ingestion, better accuracy.
// Titan Embed v2:  no native input_type → use text prefix fallback.
const isCohereModel = () => env.BEDROCK_EMBED_MODEL_ID.startsWith('cohere.embed');

// Titan-only fallback prefix (ignored when using Cohere)
const TITAN_QUERY_PREFIX = 'Represent this legal search query to find relevant contract clauses: ';

// ── Cohere Embed v3 ────────────────────────────────────────────────────────────
async function embedWithCohere(texts: string[], role: EmbedRole): Promise<number[][]> {
    // Cohere supports batches of up to 96; chunk to stay safe
    const BATCH_SIZE = 48;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const command = new InvokeModelCommand({
            modelId: env.BEDROCK_EMBED_MODEL_ID,
            body: JSON.stringify({
                texts: batch,
                input_type: role === 'query' ? 'search_query' : 'search_document',
                truncate: 'END',
                embedding_types: ['float'],
            }),
            contentType: 'application/json',
            accept: 'application/json',
        });
        const response = await bedrockRuntimeClient.send(command);
        const body = JSON.parse(new TextDecoder().decode(response.body));
        // Bedrock returns { embeddings: { float: [[...], ...] } }
        const floats: number[][] = body.embeddings?.float ?? body.embeddings;
        allEmbeddings.push(...floats);
    }
    return allEmbeddings;
}

// ── Titan Embed v2 ─────────────────────────────────────────────────────────────
async function embedWithTitan(text: string, role: EmbedRole): Promise<number[]> {
    const inputText = role === 'query' ? `${TITAN_QUERY_PREFIX}${text}` : text;
    const command = new InvokeModelCommand({
        modelId: env.BEDROCK_EMBED_MODEL_ID,
        body: JSON.stringify({ inputText, dimensions: 1024, normalize: true }),
        contentType: 'application/json',
        accept: 'application/json',
    });
    const response = await bedrockRuntimeClient.send(command);
    const body = JSON.parse(new TextDecoder().decode(response.body));
    return body.embedding;
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
    // Titan: sequential to stay under Bedrock on-demand TPS limit (~10)
    // Upgrade path: request provisioned throughput, then raise concurrency.
    const embeddings: number[][] = [];
    for (const text of texts) {
        embeddings.push(await embedWithTitan(text, role));
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

export async function rerankCandidates(
    query: string, 
    candidates: RerankCandidate[], 
    topN: number
): Promise<RerankedCandidate[]> {
    if (candidates.length === 0) return [];

    if (!env.BEDROCK_RERANK_MODEL_ARN) {
        // Fallback: If no reranker is configured, score based on actual similarity and lexical match quality
        return candidates.slice(0, topN).map((c) => {
            let score = 0.50;
            if (c.isLexicalMatch && c.denseSimilarity && c.denseSimilarity > 0) {
                // High confidence: both keyword match and semantic similarity
                score = Math.min(0.98, Math.max(0.68, c.denseSimilarity * 1.25));
            } else if (c.denseSimilarity && c.denseSimilarity > 0) {
                // Semantic match
                score = Math.min(0.92, Math.max(0.42, c.denseSimilarity));
            } else if (c.isLexicalMatch) {
                // Keyword match only
                score = 0.72;
            } else if (c.rrfScore) {
                score = Math.min(0.85, Math.max(0.40, (c.rrfScore / 0.0328) * 0.85));
            }
            return {
                ...c,
                relevanceScore: Math.round(score * 100) / 100
            };
        });
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
