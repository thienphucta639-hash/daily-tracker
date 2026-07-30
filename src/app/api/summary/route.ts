import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { db } = await import("@/db");
  const { meals, activities, expenses, dailyStatus } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  try {
    const [mealsList, activitiesList, expensesList, status] = await Promise.all([
      db.select().from(meals).where(eq(meals.date, date)).orderBy(meals.time),
      db.select().from(activities).where(eq(activities.date, date)).orderBy(activities.startTime),
      db.select().from(expenses).where(eq(expenses.date, date)).orderBy(expenses.createdAt),
      db.select().from(dailyStatus).where(eq(dailyStatus.date, date)),
    ]);

    const totalCalories = mealsList.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);
    const totalActivityMinutes = activitiesList.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

    return NextResponse.json({
      meals: mealsList,
      activities: activitiesList,
      expenses: expensesList,
      dailyStatus: status[0] || null,
      summary: {
        totalCalories,
        totalExpenses,
        totalActivityMinutes,
        mealsCount: mealsList.length,
        activitiesCount: activitiesList.length,
        expensesCount: expensesList.length,
      },
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
