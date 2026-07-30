import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  try {
    if (date) {
      const result = await db
        .select()
        .from(expenses)
        .where(eq(expenses.date, date))
        .orderBy(expenses.createdAt);
      return NextResponse.json(result);
    }
    const result = await db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(100);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert(expenses).values({
      date: body.date,
      category: body.category,
      description: body.description,
      amount: body.amount,
      currency: body.currency || "VND",
      image: body.image || null,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
