import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { extractUserContext } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, wrapHandler } from '../middleware/error.middleware.js';
import { parseBody } from '../middleware/validation.middleware.js';
import { getDocument, listDocuments, deleteDocument } from '../db/queries/documents.queries.js';
import { getClausesByDocument } from '../db/queries/clauses.queries.js';
import { checkAccess, grantAccess } from '../db/queries/acl.queries.js';
import { z } from 'zod';

const AclRequestSchema = z.object({
  userId: z.string(),
  permission: z.enum(['READ', 'ADMIN'])
});

export const handler = wrapHandler(async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { tenantId, userId: requestingUserId } = extractUserContext(event);
  const route = event.routeKey || '';
  const documentId = event.pathParameters?.id;

  if (route.includes('GET /documents') && !documentId) {
    const page = parseInt(event.queryStringParameters?.page || '1', 10);
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const offset = (page - 1) * limit;
    const docs = await listDocuments(tenantId, limit, offset);
    return successResponse({ documents: docs, page, limit });
  }

  if (!documentId) return errorResponse(400, 'Missing document ID');

  const hasAccess = await checkAccess(documentId, requestingUserId);
  if (!hasAccess) return errorResponse(403, 'Access denied');

  if (route.includes('GET /documents/{id}/clauses')) {
    const clauses = await getClausesByDocument(documentId);
    return successResponse({ clauses });
  }

  if (route.includes('GET /documents/{id}')) {
    const doc = await getDocument(documentId, tenantId);
    if (!doc) return errorResponse(404, 'Document not found');
    return successResponse(doc);
  }

  if (route.includes('POST /documents/{id}/acl')) {
    const body = parseBody(event.body, AclRequestSchema);
    await grantAccess(documentId, tenantId, body.userId, body.permission);
    return successResponse({ success: true });
  }

  if (route.includes('DELETE /documents/{id}')) {
    await deleteDocument(documentId, tenantId);
    return successResponse({ success: true });
  }

  return errorResponse(404, 'Route not found');
});
