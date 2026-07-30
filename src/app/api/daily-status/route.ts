import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStatus } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  try {
    if (date) {
      const result = await db
        .select()
        .from(dailyStatus)
        .where(eq(dailyStatus.date, date));
      return NextResponse.json(result[0] || null);
    }
    const result = await db.select().from(dailyStatus).orderBy(dailyStatus.date);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch daily status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const existing = await db
      .select()
      .from(dailyStatus)
      .where(eq(dailyStatus.date, body.date));

    if (existing.length > 0) {
      const result = await db
        .update(dailyStatus)
        .set({
          sleepHours: body.sleepHours ?? existing[0].sleepHours,
          waterCups: body.waterCups ?? existing[0].waterCups,
          weight: body.weight ?? existing[0].weight,
          dailyNote: body.dailyNote ?? existing[0].dailyNote,
          updatedAt: new Date(),
        })
        .where(eq(dailyStatus.date, body.date))
        .returning();
      return NextResponse.json(result[0]);
    }

    const result = await db.insert(dailyStatus).values({
      date: body.date,
      sleepHours: body.sleepHours || null,
      waterCups: body.waterCups || null,
      weight: body.weight || null,
      dailyNote: body.dailyNote || null,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save daily status" }, { status: 500 });
  }
}
