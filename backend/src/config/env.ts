import { z } from 'zod';

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('evidex'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SECRET_ARN: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string(),
  SQS_QUEUE_URL: z.string(),
  SNS_TEXTRACT_TOPIC_ARN: z.string().optional(),
  TEXTRACT_ROLE_ARN: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  BEDROCK_EMBED_MODEL_ID: z.string().default('amazon.titan-embed-text-v2:0'),
  BEDROCK_RERANK_MODEL_ARN: z.string().optional(),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation error:', error);
  throw error;
}

export const env = parsedEnv;
