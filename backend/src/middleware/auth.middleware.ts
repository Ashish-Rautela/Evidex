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

  // ponytail: decode JWT claims from Bearer token if API Gateway authorizer context is absent
  const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const parts = authHeader.substring(7).split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const tenantId = (payload['custom:tenant_id'] || payload['tenant_id'] || payload['tenantId'] || event.headers?.['x-tenant-id'] || 'default-tenant') as string;
        const userId = (payload['sub'] || payload['id'] || payload['username'] || event.headers?.['x-user-id'] || 'default-user') as string;
        return { tenantId, userId };
      }
    } catch { /* fallback to header check below */ }
  }

  // Fallback for dev/unauthenticated mode
  const tenantId = event.headers?.['x-tenant-id'] || 'default-tenant';
  const userId = event.headers?.['x-user-id'] || 'default-user';

  return { tenantId, userId };
}
