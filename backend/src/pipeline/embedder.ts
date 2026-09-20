import { generateEmbeddingBatch } from '../services/bedrock.service.js';
import type { ChildChunk } from '../types/chunk.types.js';

// Asymmetric document-side prefix improves Titan v2 retrieval accuracy for legal text.
const DOCUMENT_PREFIX = 'Represent this legal contract clause for semantic search: ';

export async function embedChunks(chunks: ChildChunk[]): Promise<ChildChunk[]> {
  const chunkTexts = chunks.map(c => `${DOCUMENT_PREFIX}${c.chunkText}`);
  const embeddings = await generateEmbeddingBatch(chunkTexts, 'document');
  
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].embedding = embeddings[i];
  }
  
  return chunks;
}
