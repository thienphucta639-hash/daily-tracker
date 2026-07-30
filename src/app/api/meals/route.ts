import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: "Failed to create meal" }, { status: 500 });
  }
}
