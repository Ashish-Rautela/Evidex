import { z } from 'zod';

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('evidex'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SECRET_ARN: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string(),
  SQS_QUEUE_URL: z.string(),
  SNS_TEXTRACT_TOPIC_ARN: z.string().optional(),
  TEXTRACT_ROLE_ARN: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  BEDROCK_EMBED_MODEL_ID: z.string().default('cohere.embed-english-v3'),
  BEDROCK_RERANK_MODEL_ARN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Lazy initialization: env is validated only when a property is first accessed,
// NOT at import time. This means importing env.ts in unit tests never triggers
// Zod validation unless the test actually reads an env property.
let _cache: Env | undefined;

const getEnv = (): Env => {
  if (!_cache) {
    try {
      _cache = envSchema.parse(process.env);
    } catch (error) {
      console.error('Environment validation error:', error);
      throw error;
    }
  }
  return _cache;
};

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
