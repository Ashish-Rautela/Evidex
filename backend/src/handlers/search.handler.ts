import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { extractUserContext } from '../middleware/auth.middleware.js';
import { successResponse, wrapHandler } from '../middleware/error.middleware.js';
import { parseBody } from '../middleware/validation.middleware.js';
import { SearchRequestSchema } from '../types/search.types.js';
import { hybridSearch } from '../services/search.service.js';

export const handler = wrapHandler(async (event: APIGatewayProxyEventV2) => {
  const { tenantId, userId } = extractUserContext(event);
  const body = parseBody(event.body, SearchRequestSchema);
  const results = await hybridSearch(body.query, tenantId, userId, body.limit ?? 5, body.documentIds);
  return successResponse({ results });
});
