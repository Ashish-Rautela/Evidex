import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface UserContext {
  tenantId: string;
  userId: string;
}

export function extractUserContext(event: APIGatewayProxyEventV2): UserContext {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  if (!claims) {
    throw new Error('Unauthorized');
  }

  const tenantId = claims['custom:tenant_id'] as string;
  const userId = claims['sub'] as string;

  if (!tenantId || !userId) {
    throw new Error('Unauthorized');
  }

  return { tenantId, userId };
}
