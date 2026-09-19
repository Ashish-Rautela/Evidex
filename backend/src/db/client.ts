import { Pool, QueryResult, QueryResultRow } from 'pg';
import { registerType } from 'pgvector/pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { env } from '../config/env.js';

let dbPassword = env.DB_PASSWORD;
let isPasswordFetched = false;

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

const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  ssl: env.DB_HOST?.includes('localhost') ? false : { rejectUnauthorized: false },
};

const pool = new Pool(poolConfig);

pool.on('connect', async (client) => {
  await registerType(client);
});

// Setup dynamic password fetching for connections
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = new Proxy(pool, {
  get: (target, prop) => {
    if (prop === 'connect') {
      return async () => {
        if (!isPasswordFetched && env.DB_SECRET_ARN) {
          target.options.password = await getDbPassword();
        } else if (!target.options.password) {
          target.options.password = dbPassword;
        }
        return target.connect();
      };
    }
    return target[prop as keyof Pool];
  }
});

// A wrapper to ensure password is fetched before querying if needed
const ensurePassword = async () => {
  if (!isPasswordFetched && env.DB_SECRET_ARN) {
    pool.options.password = await getDbPassword();
  } else if (!pool.options.password) {
    pool.options.password = dbPassword;
  }
};

export const query = async <R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> => {
  await ensurePassword();
  return pool.query<R>(text, params);
};
