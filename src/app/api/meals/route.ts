import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { db } = await import("@/db");
  const { meals } = await import("@/db/schema");
  const { eq, desc } = await import("drizzle-orm");

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  try {
    if (date) {
      const result = await db
        .select()
        .from(meals)
        .where(eq(meals.date, date))
        .orderBy(meals.time);
      return NextResponse.json(result);
    }
    const result = await db.select().from(meals).orderBy(desc(meals.createdAt)).limit(100);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching meals:", error);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { db } = await import("@/db");
  const { meals } = await import("@/db/schema");

  try {
    const body = await request.json();
    const result = await db.insert(meals).values({
      date: body.date,
      mealType: body.mealType,
      foodName: body.foodName,
      calories: body.calories || null,
      notes: body.notes || null,
      time: body.time || null,
      image: body.image || null,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating meal:", error);
    return NextResponse.json({ error: "Failed to create meal" }, { status: 500 });
  }
}
