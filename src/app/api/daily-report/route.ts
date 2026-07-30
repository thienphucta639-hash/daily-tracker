import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, activities, expenses, dailyStatus, liveTracking } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  try {
    const [mealsList, activitiesList, expensesList, status, tracks] = await Promise.all([
      db.select().from(meals).where(eq(meals.date, date)).orderBy(asc(meals.time)),
      db.select().from(activities).where(eq(activities.date, date)).orderBy(asc(activities.startTime)),
      db.select().from(expenses).where(eq(expenses.date, date)).orderBy(asc(expenses.createdAt)),
      db.select().from(dailyStatus).where(eq(dailyStatus.date, date)),
      db.select().from(liveTracking)
        .where(sql`DATE(${liveTracking.startedAt}) = ${date} AND ${liveTracking.isActive} = false`)
        .orderBy(asc(liveTracking.startedAt)),
    ]);

    const totalCalories = mealsList.reduce((s, m) => s + (m.calories || 0), 0);
    const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0);
    const totalActivityMinutes = activitiesList.reduce((s, a) => s + (a.durationMinutes || 0), 0);

    // Calculate total tracking time
    let totalTrackMinutes = 0;
    tracks.forEach(t => {
      if (t.endedAt) {
        totalTrackMinutes += Math.round((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 60000);
      }
    });

    return NextResponse.json({
      date,
      meals: mealsList,
      activities: activitiesList,
      expenses: expensesList,
      dailyStatus: status[0] || null,
      liveTracking: tracks,
      summary: {
        totalCalories,
        totalExpenses,
        totalActivityMinutes,
        totalTrackMinutes,
        mealsCount: mealsList.length,
        activitiesCount: activitiesList.length,
        expensesCount: expensesList.length,
        trackCount: tracks.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
