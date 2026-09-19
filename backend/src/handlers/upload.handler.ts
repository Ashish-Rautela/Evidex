import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { extractUserContext } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, wrapHandler } from '../middleware/error.middleware.js';
import { parseBody } from '../middleware/validation.middleware.js';
import { UploadIntentRequestSchema } from '../types/document.types.js';
import { createUploadUrl, headObject } from '../services/s3.service.js';
import { publishIngestionEvent } from '../services/sqs.service.js';
import { insertDocument, updateDocumentStatus, getDocument } from '../db/queries/documents.queries.js';
import { grantAccess } from '../db/queries/acl.queries.js';
import { generateId } from '../utils/id.js';

async function handleUploadIntent(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { tenantId, userId } = extractUserContext(event);
  const body = parseBody(event.body, UploadIntentRequestSchema);
  const documentId = generateId();
  const { uploadUrl, storageKey } = await createUploadUrl(tenantId, documentId, body.fileName);
  await insertDocument({ documentId, tenantId, fileName: body.fileName, storageKey, fileSize: body.fileSize, checksum: body.checksum, uploadedBy: userId });
  await grantAccess(documentId, tenantId, userId, 'ADMIN');
  return successResponse({ documentId, uploadUrl, storageKey }, 201);
}

async function handleUploadConfirm(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { tenantId } = extractUserContext(event);
  const documentId = event.pathParameters?.id;
  if (!documentId) return errorResponse(400, 'Missing document ID');
  const doc = await getDocument(documentId, tenantId);
  if (!doc) return errorResponse(404, 'Document not found');
  const exists = await headObject(doc.storageKey);
  if (!exists) return errorResponse(400, 'Upload not completed');
  await updateDocumentStatus(documentId, 'QUEUED');
  await publishIngestionEvent({ documentId, tenantId, storageKey: doc.storageKey, createdAt: new Date().toISOString() });
  return successResponse({ status: 'QUEUED' });
}

export const handler = wrapHandler(async (event: APIGatewayProxyEventV2) => {
  if (event.routeKey?.includes('confirm')) return handleUploadConfirm(event);
  return handleUploadIntent(event);
});
