import { db } from '../client.js';
import type { ChildChunk } from '../../types/chunk.types.js';

export async function insertChunks(chunks: ChildChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const values: any[] = [];
    const placeholders: string[] = [];
    
    let paramIdx = 1;
    for (const chunk of batch) {
      placeholders.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}::vector, $${paramIdx++})`);
      values.push(
        chunk.chunkId,
        chunk.clauseId,
        chunk.documentId,
        chunk.tenantId,
        chunk.chunkIndex,
        chunk.pageNumber,
        chunk.chunkText,
        chunk.tokenCount,
        JSON.stringify(chunk.coordinates),
        `[${chunk.embedding.join(',')}]`,
        chunk.embeddingModel
      );
    }

    const query = `
      INSERT INTO document_chunks (chunk_id, clause_id, document_id, tenant_id, chunk_index, page_number, chunk_text, token_count, coordinates, embedding, embedding_model)
      VALUES ${placeholders.join(', ')}
    `;
    await db.query(query, values);
  }
}
