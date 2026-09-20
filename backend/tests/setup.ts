/**
 * Vitest global setup — sets the minimum required environment variables
 * so that env.ts Zod validation passes in unit tests.
 * Services (Bedrock, S3, DB, SQS) are never called in unit tests,
 * so these values are never actually used — they just satisfy the schema.
 */
process.env.S3_BUCKET         = 'test-bucket';
process.env.SQS_QUEUE_URL     = 'https://sqs.ap-south-1.amazonaws.com/000000000000/test-queue';
process.env.AWS_REGION        = 'ap-south-1';
process.env.DB_HOST           = 'localhost';
process.env.DB_PORT           = '5432';
process.env.DB_NAME           = 'evidex_test';
process.env.DB_USER           = 'postgres';
process.env.DB_PASSWORD       = 'postgres';
