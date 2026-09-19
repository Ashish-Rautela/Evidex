import { db } from '../client.js';

export async function hybridSearchQuery(queryVector: number[], tenantId: string, userId: string, queryText: string, limit: number, documentIds?: string[]): Promise<any[]> {
  const vectorStr = `[${queryVector.join(',')}]`;
  const values: any[] = [vectorStr, tenantId, userId, queryText, limit];
  
  let docFilterDense = '';
  let docFilterLexical = '';

  if (documentIds && documentIds.length > 0) {
    values.push(documentIds);
    docFilterDense = `AND document_id = ANY($6)`;
    docFilterLexical = `AND document_id = ANY($6)`;
  }

  const query = `
    WITH dense AS (
      SELECT chunk_id, clause_id, document_id, chunk_text, page_number, coordinates,
        ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) as rank
      FROM document_chunks
      WHERE tenant_id = $2
        AND document_id IN (SELECT document_id FROM document_acl WHERE user_id = $3 AND permission IN ('READ','ADMIN'))
        ${docFilterDense}
      ORDER BY embedding <=> $1::vector
      LIMIT 100
    ),
    lexical AS (
      SELECT chunk_id, clause_id, document_id, chunk_text, page_number, coordinates,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv_content, plainto_tsquery('english', $4)) DESC) as rank
      FROM document_chunks
      WHERE tenant_id = $2
        AND tsv_content @@ plainto_tsquery('english', $4)
        AND document_id IN (SELECT document_id FROM document_acl WHERE user_id = $3 AND permission IN ('READ','ADMIN'))
        ${docFilterLexical}
      LIMIT 100
    ),
    fused AS (
      SELECT COALESCE(d.chunk_id, l.chunk_id) as chunk_id,
        COALESCE(d.clause_id, l.clause_id) as clause_id,
        COALESCE(d.document_id, l.document_id) as document_id,
        COALESCE(d.chunk_text, l.chunk_text) as chunk_text,
        COALESCE(d.page_number, l.page_number) as page_number,
        COALESCE(d.coordinates, l.coordinates) as coordinates,
        (COALESCE(1.0/(60 + d.rank), 0) + COALESCE(1.0/(60 + l.rank), 0)) as rrf_score
      FROM dense d FULL OUTER JOIN lexical l ON d.chunk_id = l.chunk_id
    )
    SELECT f.*, p.clause_identifier, p.title as clause_title, p.full_text as parent_clause_text,
      doc.file_name, doc.storage_key
    FROM fused f
    JOIN parent_clauses p ON f.clause_id = p.clause_id
    JOIN documents doc ON f.document_id = doc.document_id
    ORDER BY f.rrf_score DESC
    LIMIT $5
  `;
  const result = await db.query(query, values);
  return result.rows;
}
