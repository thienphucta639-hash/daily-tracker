import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Don't throw error during build time
const databaseUrl = process.env.DATABASE_URL || "";

// Create a lazy-loaded pool that only connects when actually used
let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    poolInstance = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

// For backwards compatibility
export const pool = {
  query: (...args: Parameters<Pool["query"]>) => getPool().query(...args),
  connect: () => getPool().connect(),
  end: () => poolInstance?.end(),
};

export const db = drizzle({ client: getPool() });
