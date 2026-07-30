import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { db } = await import("@/db");
  const { expenses } = await import("@/db/schema");
  const { eq, desc } = await import("drizzle-orm");

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
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { db } = await import("@/db");
  const { expenses } = await import("@/db/schema");

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
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
