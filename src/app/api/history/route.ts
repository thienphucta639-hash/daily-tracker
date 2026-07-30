import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await import("@/db");
  const { meals, activities, expenses, liveTracking } = await import("@/db/schema");
  const { sql, eq } = await import("drizzle-orm");

  try {
    // Get all unique dates that have any data
    const [mealDates, activityDates, expenseDates, trackDates] = await Promise.all([
      db.selectDistinct({ date: meals.date }).from(meals),
      db.selectDistinct({ date: activities.date }).from(activities),
      db.selectDistinct({ date: expenses.date }).from(expenses),
      db.select({
        date: sql<string>`DATE(${liveTracking.startedAt})`,
      }).from(liveTracking).where(eq(liveTracking.isActive, false)),
    ]);

    // Combine all dates
    const allDates = new Set<string>();
    mealDates.forEach(d => allDates.add(d.date));
    activityDates.forEach(d => allDates.add(d.date));
    expenseDates.forEach(d => allDates.add(d.date));
    trackDates.forEach(d => d.date && allDates.add(d.date));

    // Get summary for each date
    const summaries = [];
    for (const date of Array.from(allDates).sort().reverse()) {
      const [mealCount, actCount, expData, trackData] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(meals).where(eq(meals.date, date)),
        db.select({ count: sql<number>`count(*)` }).from(activities).where(eq(activities.date, date)),
        db.select({
          count: sql<number>`count(*)`,
          total: sql<number>`COALESCE(sum(${expenses.amount}), 0)`,
        }).from(expenses).where(eq(expenses.date, date)),
        db.select({ count: sql<number>`count(*)` })
          .from(liveTracking)
          .where(sql`DATE(${liveTracking.startedAt}) = ${date} AND ${liveTracking.isActive} = false`),
      ]);

      const totalCalories = await db
        .select({ total: sql<number>`COALESCE(sum(${meals.calories}), 0)` })
        .from(meals)
        .where(eq(meals.date, date));

      summaries.push({
        date,
        mealsCount: Number(mealCount[0]?.count || 0),
        activitiesCount: Number(actCount[0]?.count || 0),
        expensesCount: Number(expData[0]?.count || 0),
        expensesTotal: Number(expData[0]?.total || 0),
        trackCount: Number(trackData[0]?.count || 0),
        totalCalories: Number(totalCalories[0]?.total || 0),
      });
    }

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
