import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  try {
    if (date) {
      const result = await db
        .select()
        .from(activities)
        .where(eq(activities.date, date))
        .orderBy(activities.startTime);
      return NextResponse.json(result);
    }
    const result = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(100);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert(activities).values({
      date: body.date,
      category: body.category,
      title: body.title,
      description: body.description || null,
      durationMinutes: body.durationMinutes || null,
      startTime: body.startTime || null,
      endTime: body.endTime || null,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
