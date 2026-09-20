import { generateEmbeddingBatch } from '../services/bedrock.service.js';
import { env } from '../config/env.js';
import type { ChildChunk } from '../types/chunk.types.js';

// Cohere Embed v3: input_type='search_document' handles asymmetric embedding natively.
// Titan Embed v2:  prefix is added inside bedrock.service.ts embedWithTitan().
// Either way, NO manual prefix is needed here — the service layer handles it.
const isCohereModel = () => env.BEDROCK_EMBED_MODEL_ID.startsWith('cohere.embed');

export async function embedChunks(chunks: ChildChunk[]): Promise<ChildChunk[]> {
  const DOCUMENT_PREFIX = 'Represent this legal contract clause for semantic search: ';

  // For Titan, prepend the document prefix so the service receives pre-prefixed text.
  // For Cohere, send raw text — the service sets input_type='search_document' natively.
  const chunkTexts = chunks.map(c =>
    isCohereModel() ? c.chunkText : `${DOCUMENT_PREFIX}${c.chunkText}`
  );

  const embeddings = await generateEmbeddingBatch(chunkTexts, 'document');

  for (let i = 0; i < chunks.length; i++) {
    chunks[i].embedding = embeddings[i];
    // Stamp the real model ID now that we know it (chunker used a placeholder)
    chunks[i].embeddingModel = env.BEDROCK_EMBED_MODEL_ID;
  }

  return chunks;
}
