import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await import("@/db");
  const { liveTracking } = await import("@/db/schema");
  const { eq, desc } = await import("drizzle-orm");

  try {
    const active = await db
      .select()
      .from(liveTracking)
      .where(eq(liveTracking.isActive, true))
      .orderBy(desc(liveTracking.startedAt))
      .limit(1);

    const recent = await db
      .select()
      .from(liveTracking)
      .where(eq(liveTracking.isActive, false))
      .orderBy(desc(liveTracking.endedAt))
      .limit(20);

    return NextResponse.json({
      active: active[0] || null,
      recent,
    });
  } catch (error) {
    console.error("Error fetching live track:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { db } = await import("@/db");
  const { liveTracking } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const body = await request.json();

    // Stop any currently active
    await db
      .update(liveTracking)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(liveTracking.isActive, true));

    const result = await db.insert(liveTracking).values({
      title: body.title,
      category: body.category,
      notes: body.notes || null,
      startedAt: new Date(),
      isActive: true,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      locationName: body.locationName || null,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error starting track:", error);
    return NextResponse.json({ error: "Failed to start tracking" }, { status: 500 });
  }
}

export async function PUT() {
  const { db } = await import("@/db");
  const { liveTracking } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const result = await db
      .update(liveTracking)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(liveTracking.isActive, true))
      .returning();
    return NextResponse.json(result[0] || null);
  } catch (error) {
    console.error("Error stopping track:", error);
    return NextResponse.json({ error: "Failed to stop tracking" }, { status: 500 });
  }
}
