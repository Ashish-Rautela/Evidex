import { Pool, QueryResult, QueryResultRow } from 'pg';
import { registerType } from 'pgvector/pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { env } from '../config/env.js';

let dbPassword = env.DB_PASSWORD;
let isPasswordFetched = false;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

import { Resolver } from 'dns/promises';

const getDbPassword = async (): Promise<string> => {
  if (env.DB_SECRET_ARN && !isPasswordFetched) {
    const client = new SecretsManagerClient({ region: env.AWS_REGION });
    const response = await client.send(new GetSecretValueCommand({ SecretId: env.DB_SECRET_ARN }));
    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      dbPassword = secret.password || secret.DB_PASSWORD || dbPassword;
    }
    isPasswordFetched = true;
  }
  return dbPassword;
};

// Workaround for AWS Serverless Free-Tier Architecture:
// AWS internal DNS resolves RDS endpoints to their Private IP if queried from within the same region.
// Since our Lambdas are not in a VPC (to save costs on NAT Gateways), they cannot route to the private IP.
// We force resolution via Google's Public DNS to get the Public IP.
const resolvePublicIp = async (hostname: string): Promise<string> => {
  if (hostname.includes('localhost') || hostname.match(/^[0-9.]+$/)) return hostname;
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const addresses = await resolver.resolve4(hostname);
    return addresses[0] || hostname;
  } catch (err) {
    console.warn('Failed to resolve public IP, falling back to hostname:', err);
    return hostname;
  }
};

let pool: Pool;

const initPool = async () => {
  if (pool) return;
  const hostIp = await resolvePublicIp(env.DB_HOST);
  
  const poolConfig = {
    host: hostIp,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: dbPassword,
    ssl: env.DB_HOST?.includes('localhost') ? false : { rejectUnauthorized: false },
  };

  pool = new Pool(poolConfig);
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
};

const initSchemaSql = `
  CREATE EXTENSION IF NOT EXISTS vector;
  DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('UPLOADED', 'QUEUED', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'READY', 'FAILED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE acl_permission AS ENUM ('READ', 'WRITE', 'ADMIN');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(21) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO tenants (tenant_id, name) VALUES ('default-tenant', 'Default Tenant') ON CONFLICT DO NOTHING;
  CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(21) PRIMARY KEY,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    file_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(1024) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    status document_status NOT NULL DEFAULT 'UPLOADED',
    error_message TEXT,
    textract_job_id VARCHAR(255),
    total_pages INTEGER,
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS document_acl (
    acl_id VARCHAR(21) PRIMARY KEY,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    user_id VARCHAR(255) NOT NULL,
    permission acl_permission NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS parent_clauses (
    clause_id VARCHAR(21) PRIMARY KEY,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    clause_identifier VARCHAR(255),
    title TEXT,
    full_text TEXT NOT NULL,
    hierarchy_path TEXT,
    start_page INTEGER,
    end_page INTEGER,
    token_count INTEGER
  );
  CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id VARCHAR(21) PRIMARY KEY,
    clause_id VARCHAR(21) NOT NULL REFERENCES parent_clauses(clause_id) ON DELETE CASCADE,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER,
    coordinates JSONB NOT NULL,
    embedding vector(1024) NOT NULL,
    embedding_model VARCHAR(255) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS search_log (
    log_id VARCHAR(21) PRIMARY KEY,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    user_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    document_ids VARCHAR(21)[],
    limit_value INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_document_acl_user_id ON document_acl(user_id);
  CREATE INDEX IF NOT EXISTS idx_document_acl_document_id ON document_acl(document_id);
  CREATE INDEX IF NOT EXISTS idx_parent_clauses_document_id ON parent_clauses(document_id);
  CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
  CREATE INDEX IF NOT EXISTS idx_document_chunks_clause_id ON document_chunks(clause_id);
  CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
`;

const initDb = async () => {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let client;
    try {
      client = await pool.connect();
      await client.query(initSchemaSql);
      try {
        await registerType(client);
      } catch (err) {
        console.warn('pgvector registerType warning:', err);
      }
      isInitialized = true;
    } catch (err) {
      console.error('Database schema auto-init error:', err);
      initPromise = null; // allow retry on failure
    } finally {
      if (client) client.release();
    }
  })();

  return initPromise;
};

const ensureReady = async () => {
  if (!isPasswordFetched && env.DB_SECRET_ARN) {
    dbPassword = await getDbPassword();
  }
  await initPool();
  await initDb();
};

export const db = new Proxy({} as Pool, {
  get: (target, prop) => {
    if (prop === 'connect') {
      return async () => {
        await ensureReady();
        return pool.connect();
      };
    }
    // This is a bit tricky with Proxy on an uninitialized object.
    // However, in this application, `query` is mostly used via export const query.
    // For direct access to `db.xxx`, we should ensure it's initialized.
    if (!pool) {
      throw new Error("Database pool is not initialized. Await ensureReady() or use query()");
    }
    return (pool as any)[prop];
  }
});

export const query = async <R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> => {
  await ensureReady();
  return pool.query<R>(text, params);
};
