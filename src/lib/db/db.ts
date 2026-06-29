import { drizzle } from "drizzle-orm/node-postgres";
import { Client, Pool } from "pg";

import { DATABASE_URL } from "lib/config/env.config";
import * as schema from "lib/db/schema";

import type { Client as PostgresClient, Pool as PostgresPool } from "pg";

/**
 * Postgres database client.
 * @see https://node-postgres.com/apis/client
 */
export const pgClient = new Client({
  connectionString: DATABASE_URL,
});

/**
 * Postgres database pool.
 * @see https://node-postgres.com/apis/pool
 */
export const pgPool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
  // Send TCP keepalive probes so a network blip that silently severs an idle
  // connection is detected by the OS and the dead socket evicted, instead of
  // being handed to the next request and surfacing as "Connection terminated
  // unexpectedly". Without this a brief pod-to-pod blip lingers for minutes as
  // stale connections are reused before they age out
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

// An idle pooled client can still error after checkout (backend restart, network
// partition). node-postgres emits these on the pool itself; with no listener the
// error is thrown and crashes the process. Log and swallow so a transient DB
// connectivity blip degrades gracefully instead of taking the whole API down
pgPool.on("error", (err) => {
  console.warn("pg pool idle client error:", err.message);
});

/**
 * Create a database connection client.
 */
const createDbClient = (client: PostgresClient | PostgresPool) =>
  drizzle({
    client,
    schema,
    // ! NB: must match Drizzle config casing, otherwise database scripts may fail
    casing: "snake_case",
  });

/**
 * Database connection client.
 */
export const dbClient = createDbClient(pgClient);

/**
 * Database connection pool.
 */
export const dbPool = createDbClient(pgPool);
