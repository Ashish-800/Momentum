// lib/db/index.ts
// Drizzle ORM client — supports both Neon serverless and standard postgres

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[Closeloop DB] DATABASE_URL not set — running in DEMO_MODE (in-memory fallback only)"
  );
}

// Singleton pattern to avoid multiple connections in dev/hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __db_client: ReturnType<typeof postgres> | undefined;
}

function getClient() {
  if (!connectionString) return null;
  if (!global.__db_client) {
    global.__db_client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return global.__db_client;
}

const client = getClient();

export const db = client
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

export { schema };
export * from "./schema";

