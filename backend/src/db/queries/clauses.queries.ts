import { db } from '../client.js';
import type { ParentClause } from '../../types/chunk.types.js';

export async function insertClauses(clauses: ParentClause[]): Promise<void> {
  if (clauses.length === 0) return;
  
  const values: any[] = [];
  const placeholders: string[] = [];
  
  let i = 1;
  for (const clause of clauses) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(
      clause.clauseId,
      clause.documentId,
      clause.tenantId,
      clause.clauseIdentifier,
      clause.title,
      clause.fullText,
      clause.hierarchyPath,
      clause.startPage,
      clause.endPage,
      clause.tokenCount
    );
  }
  
  const query = `
    INSERT INTO parent_clauses (clause_id, document_id, tenant_id, clause_identifier, title, full_text, hierarchy_path, start_page, end_page, token_count)
    VALUES ${placeholders.join(', ')}
  `;
  await db.query(query, values);
}

export async function getClausesByDocument(documentId: string): Promise<ParentClause[]> {
  const query = 'SELECT * FROM parent_clauses WHERE document_id = $1 ORDER BY start_page, clause_identifier';
  const result = await db.query(query, [documentId]);
  return result.rows;
}
