import { db } from '../client.js';
import type { AclPermission } from '../../types/document.types.js';

import { generateId } from '../utils/id.js';

export async function grantAccess(documentId: string, tenantId: string, userId: string, permission: AclPermission): Promise<void> {
  // Check if access already exists
  const checkQuery = 'SELECT acl_id FROM document_acl WHERE document_id = $1 AND user_id = $2';
  const res = await db.query(checkQuery, [documentId, userId]);
  
  if (res.rowCount && res.rowCount > 0) {
    const updateQuery = 'UPDATE document_acl SET permission = $1 WHERE document_id = $2 AND user_id = $3';
    await db.query(updateQuery, [permission, documentId, userId]);
  } else {
    const aclId = generateId();
    const insertQuery = `
      INSERT INTO document_acl (acl_id, document_id, tenant_id, user_id, permission)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(insertQuery, [aclId, documentId, tenantId, userId, permission]);
  }
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
