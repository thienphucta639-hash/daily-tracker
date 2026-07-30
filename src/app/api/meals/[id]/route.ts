import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(meals).where(eq(meals.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
