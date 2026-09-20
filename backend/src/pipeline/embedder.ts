import { generateEmbeddingBatch } from '../services/bedrock.service.js';
import { env } from '../config/env.js';
import type { ChildChunk } from '../types/chunk.types.js';


export async function embedChunks(chunks: ChildChunk[]): Promise<ChildChunk[]> {
  const chunkTexts = chunks.map(c => c.chunkText);
  const embeddings = await generateEmbeddingBatch(chunkTexts, 'document');

  for (let i = 0; i < chunks.length; i++) {
    chunks[i].embedding = embeddings[i];
    // Stamp the real model ID now that we know it (chunker used a placeholder)
    chunks[i].embeddingModel = env.BEDROCK_EMBED_MODEL_ID;
  }

  return chunks;
}
