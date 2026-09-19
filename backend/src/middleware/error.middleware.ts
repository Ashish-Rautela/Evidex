import type { APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { ZodError } from 'zod';

export function errorResponse(statusCode: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message })
  };
}

export function successResponse(data: unknown, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
}

export function wrapHandler(fn: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
      return await fn(event);
    } catch (error: any) {
      console.error('Handler error:', error);
      
      if (error instanceof ZodError) {
        return errorResponse(400, `Validation Error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      const message = error.message || 'Internal Server Error';
      
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        return errorResponse(401, 'Unauthorized');
      }
      
      if (message.includes('Not found')) {
        return errorResponse(404, 'Not found');
      }
      
      return errorResponse(500, 'Internal Server Error');
    }
  };
}
