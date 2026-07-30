import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    ok: true,
    time: new Date().toISOString(),
    hasDbUrl: !!process.env.DATABASE_URL,
  };

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      result.database = "connected";
    } catch (error) {
      result.ok = false;
      result.database = "error";
      result.dbError = error instanceof Error ? error.message : "Unknown error";
    }
  } else {
    result.database = "no DATABASE_URL";
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
