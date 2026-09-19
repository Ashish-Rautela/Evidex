import { ZodSchema } from 'zod';

export function parseBody<T>(body: string | undefined, schema: ZodSchema<T>): T {
  if (!body) {
    throw new Error('Request body is missing');
  }
  const parsed = JSON.parse(body);
  return schema.parse(parsed);
}

export function parseQueryParams<T>(params: Record<string, string | undefined> | undefined, schema: ZodSchema<T>): T {
  return schema.parse(params || {});
}
