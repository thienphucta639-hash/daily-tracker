import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { db } = await import("@/db");
  const { liveTracking } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const { id } = await params;
    await db.delete(liveTracking).where(eq(liveTracking.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
