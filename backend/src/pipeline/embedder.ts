import { generateEmbeddingBatch } from '../services/bedrock.service.js';
import { env } from '../config/env.js';
import type { ChildChunk } from '../types/chunk.types.js';


export async function embedChunks(chunks: ChildChunk[]): Promise<ChildChunk[]> {
  const validChunks = chunks.filter(c => c.chunkText && c.chunkText.trim().length > 0);
  if (validChunks.length === 0) return [];

  const chunkTexts = validChunks.map(c => c.chunkText);
  const embeddings = await generateEmbeddingBatch(chunkTexts, 'document');

  for (let i = 0; i < validChunks.length; i++) {
    validChunks[i].embedding = embeddings[i];
    // Stamp the real model ID now that we know it (chunker used a placeholder)
    validChunks[i].embeddingModel = env.BEDROCK_EMBED_MODEL_ID;
  }

  return validChunks;
}
