import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RerankCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { env } from '../config/env.js';

const bedrockRuntimeClient = new BedrockRuntimeClient({ region: env.AWS_REGION });
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: env.AWS_REGION });

export async function generateEmbedding(text: string): Promise<number[]> {
    const command = new InvokeModelCommand({
        modelId: env.BEDROCK_EMBED_MODEL_ID,
        body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
        contentType: 'application/json',
        accept: 'application/json'
    });
    
    const response = await bedrockRuntimeClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.embedding;
}

export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    // ponytail: sequential to stay under Bedrock on-demand TPS limit (~10).
    // Upgrade path: request provisioned throughput, then raise concurrency.
    const embeddings: number[][] = [];
    for (const text of texts) {
        embeddings.push(await generateEmbedding(text));
    }
    return embeddings;
}

export interface RerankCandidate {
    chunkId: string;
    chunkText: string;
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
        // Fallback: If no reranker is configured, just return the top N from the RRF hybrid search
        return candidates.slice(0, topN).map(c => ({
            ...c,
            relevanceScore: 1.0 // Dummy score since we skipped reranking
        }));
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
