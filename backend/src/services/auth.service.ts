import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export function extractUserContext(event: APIGatewayProxyEventV2WithJWTAuthorizer): { tenantId: string; userId: string } {
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    throw new Error('Unauthorized: Missing JWT claims');
  }

  const tenantId = claims['custom:tenant_id'] as string;
  const userId = claims['sub'] as string;

  if (!tenantId || !userId) {
    throw new Error('Unauthorized: Missing tenant_id or sub in JWT');
  }

  return { tenantId, userId };
}
