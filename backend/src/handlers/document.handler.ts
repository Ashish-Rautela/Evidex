import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { extractUserContext } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, wrapHandler } from '../middleware/error.middleware.js';
import { parseBody } from '../middleware/validation.middleware.js';
import { getDocument, listDocuments, deleteDocument } from '../db/queries/documents.queries.js';
import { getClausesByDocument } from '../db/queries/clauses.queries.js';
import { checkAccess, grantAccess } from '../db/queries/acl.queries.js';
import { createDownloadUrl } from '../services/s3.service.js';
import { z } from 'zod';

const AclRequestSchema = z.object({
  userId: z.string(),
  permission: z.enum(['READ', 'ADMIN'])
});

export const handler = wrapHandler(async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { tenantId, userId: requestingUserId } = extractUserContext(event);
  const route = event.routeKey || '';
  const method = event.requestContext?.http?.method || 'GET';
  const documentId = event.pathParameters?.id;

  // List all documents for this tenant
  if (method === 'GET' && !documentId) {
    const page = parseInt(event.queryStringParameters?.page || '1', 10);
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const offset = (page - 1) * limit;
    const docs = await listDocuments(tenantId, limit, offset);
    return successResponse({ documents: docs, page, limit });
  }

  if (!documentId) return errorResponse(400, 'Missing document ID');

  const hasAccess = await checkAccess(documentId, requestingUserId);
  if (!hasAccess) {
    // If it's a DELETE request and the ACL is missing/corrupted, check if they are the uploader
    if (method === 'DELETE') {
      const doc = await getDocument(documentId, tenantId);
      if (!doc || doc.uploadedBy !== requestingUserId) {
        return errorResponse(403, 'Access denied');
      }
    } else {
      return errorResponse(403, 'Access denied');
    }
  }

  if (method === 'GET' && route.includes('clauses')) {
    const clauses = await getClausesByDocument(documentId);
    return successResponse({ clauses });
  }

  if (method === 'GET') {
    const doc = await getDocument(documentId, tenantId);
    if (!doc) return errorResponse(404, 'Document not found');
    const fileUrl = await createDownloadUrl(doc.storageKey);
    return successResponse({ ...doc, fileUrl });
  }

  if (method === 'POST' && route.includes('acl')) {
    const body = parseBody(event.body, AclRequestSchema);
    await grantAccess(documentId, tenantId, body.userId, body.permission);
    return successResponse({ success: true });
  }

  if (method === 'DELETE') {
    await deleteDocument(documentId, tenantId);
    return successResponse({ success: true });
  }

  return errorResponse(404, 'Route not found');
});
