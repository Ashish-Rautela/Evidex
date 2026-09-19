import { db } from '../client.js';
import type { Document, DocumentStatus } from '../../types/document.types.js';

export async function insertDocument(doc: { documentId: string, tenantId: string, fileName: string, storageKey: string, fileSize: number, checksum: string, uploadedBy: string }): Promise<void> {
  const query = `
    INSERT INTO documents (document_id, tenant_id, file_name, storage_key, file_size, checksum, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  const values = [doc.documentId, doc.tenantId, doc.fileName, doc.storageKey, doc.fileSize, doc.checksum, doc.uploadedBy];
  await db.query(query, values);
}

export async function updateDocumentStatus(documentId: string, status: DocumentStatus, extra?: { errorMessage?: string, textractJobId?: string, totalPages?: number }): Promise<void> {
  const updates = ['status = $2', 'updated_at = NOW()'];
  const values: any[] = [documentId, status];
  
  if (extra?.errorMessage !== undefined) {
    values.push(extra.errorMessage);
    updates.push(`error_message = $${values.length}`);
  }
  if (extra?.textractJobId !== undefined) {
    values.push(extra.textractJobId);
    updates.push(`textract_job_id = $${values.length}`);
  }
  if (extra?.totalPages !== undefined) {
    values.push(extra.totalPages);
    updates.push(`total_pages = $${values.length}`);
  }

  const query = `UPDATE documents SET ${updates.join(', ')} WHERE document_id = $1`;
  await db.query(query, values);
}

function mapRowToDocument(row: any): Document {
  return {
    documentId: row.document_id,
    tenantId: row.tenant_id,
    fileName: row.file_name,
    storageKey: row.storage_key,
    fileSize: row.file_size,
    checksum: row.checksum,
    status: row.status,
    errorMessage: row.error_message,
    textractJobId: row.textract_job_id,
    totalPages: row.total_pages,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getDocument(documentId: string, tenantId: string): Promise<Document | null> {
  const query = 'SELECT * FROM documents WHERE document_id = $1 AND tenant_id = $2';
  const result = await db.query(query, [documentId, tenantId]);
  if (!result.rows[0]) return null;
  return mapRowToDocument(result.rows[0]);
}

export async function listDocuments(tenantId: string, limit: number, offset: number): Promise<Document[]> {
  const query = 'SELECT * FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
  const result = await db.query(query, [tenantId, limit, offset]);
  return result.rows.map(mapRowToDocument);
}

export async function getDocumentByTextractJobId(jobId: string): Promise<Document | null> {
  const query = 'SELECT * FROM documents WHERE textract_job_id = $1';
  const result = await db.query(query, [jobId]);
  if (!result.rows[0]) return null;
  return mapRowToDocument(result.rows[0]);
}

export async function deleteDocument(documentId: string, tenantId: string): Promise<void> {
  const query = 'DELETE FROM documents WHERE document_id = $1 AND tenant_id = $2';
  await db.query(query, [documentId, tenantId]);
}
