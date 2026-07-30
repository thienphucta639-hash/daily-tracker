import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Only test DB if DATABASE_URL exists
    if (process.env.DATABASE_URL) {
      const { db } = await import("@/db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`select 1`);
    }
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
