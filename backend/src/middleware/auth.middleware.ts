import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface UserContext {
  tenantId: string;
  userId: string;
}

export function extractUserContext(event: APIGatewayProxyEventV2): UserContext {
  const claims = (event.requestContext as any).authorizer?.jwt?.claims;
  if (claims) {
    const tenantId = (claims['custom:tenant_id'] || claims['tenant_id'] || 'default-tenant') as string;
    const userId = (claims['sub'] || claims['username'] || 'default-user') as string;
    return { tenantId, userId };
  }

  // Fallback for dev/unauthenticated mode
  const tenantId = event.headers?.['x-tenant-id'] || 'default-tenant';
  const userId = event.headers?.['x-user-id'] || 'default-user';

  return { tenantId, userId };
}
