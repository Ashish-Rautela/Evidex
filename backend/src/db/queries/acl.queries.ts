import { db } from '../client.js';
import type { AclPermission } from '../../types/document.types.js';

export async function grantAccess(documentId: string, tenantId: string, userId: string, permission: AclPermission): Promise<void> {
  const query = `
    INSERT INTO document_acl (document_id, tenant_id, user_id, permission)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (document_id, user_id) DO UPDATE SET permission = $4
  `;
  await db.query(query, [documentId, tenantId, userId, permission]);
}

export async function checkAccess(documentId: string, userId: string): Promise<boolean> {
  const query = 'SELECT 1 FROM document_acl WHERE document_id = $1 AND user_id = $2 LIMIT 1';
  const result = await db.query(query, [documentId, userId]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function revokeAccess(documentId: string, userId: string): Promise<void> {
  const query = 'DELETE FROM document_acl WHERE document_id = $1 AND user_id = $2';
  await db.query(query, [documentId, userId]);
}
