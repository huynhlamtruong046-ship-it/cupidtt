import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.SQL_DATABASE_URL;
    const host = process.env.SQL_HOST || process.env.PGHOST;
    const user = process.env.SQL_USER || process.env.PGUSER;
    const password = process.env.SQL_PASSWORD || process.env.PGPASSWORD;
    const database = process.env.SQL_DB_NAME || process.env.PGDATABASE;
    const port = Number(process.env.SQL_PORT || process.env.PGPORT || 5432);

    if (!connectionString && (!host || !user || !password || !database)) {
      console.error(
        '[CupidGo DB] PostgreSQL configuration is missing. Set DATABASE_URL or SQL_HOST, SQL_PORT, SQL_USER, SQL_PASSWORD, and SQL_DB_NAME in the runtime environment. Do not place credentials in source code.'
      );
    }

    global._postgresPool = new Pool({
      ...(connectionString
        ? { connectionString }
        : { host: host || '127.0.0.1', port, user, password, database }),
      ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('[CupidGo DB] Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
