import { generateEmbeddingBatch } from '../services/bedrock.service.js';
import type { ChildChunk } from '../types/chunk.types.js';

export async function embedChunks(chunks: ChildChunk[]): Promise<ChildChunk[]> {
  const chunkTexts = chunks.map(c => c.chunkText);
  const embeddings = await generateEmbeddingBatch(chunkTexts);
  
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].embedding = embeddings[i];
  }
  
  return chunks;
}
