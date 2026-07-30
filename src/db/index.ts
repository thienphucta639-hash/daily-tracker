import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let poolInstance: Pool | null = null;
let dbInstance: NodePgDatabase | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    poolInstance = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("sslmode=require") || databaseUrl.includes("neon.tech") || databaseUrl.includes("supabase")
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

function getDb(): NodePgDatabase {
  if (!dbInstance) {
    dbInstance = drizzle({ client: getPool() });
  }
  return dbInstance;
}

// Lazy proxy - doesn't connect until actually used at runtime
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop: string | symbol) {
    const instance = getDb();
    const value = instance[prop as keyof NodePgDatabase];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// Export pool for direct queries if needed  
export const pool = {
  query: (...args: Parameters<Pool["query"]>) => getPool().query(...args),
  connect: () => getPool().connect(),
  end: () => poolInstance?.end(),
};
