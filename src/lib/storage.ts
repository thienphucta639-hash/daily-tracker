"use client";

// Simple localStorage-based storage - no database needed!

export interface Meal {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  calories: number | null;
  notes: string | null;
  time: string | null;
  image: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  date: string;
  category: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  image: string | null;
  createdAt: string;
}

export interface DailyStatus {
  date: string;
  sleepHours: number | null;
  waterCups: number | null;
  weight: number | null;
  dailyNote: string | null;
}

export interface LiveTrack {
  id: string;
  title: string;
  category: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
}

// Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== MEALS =====
export function getMeals(date?: string): Meal[] {
  const meals = getStorage<Meal>("tracker_meals");
  if (date) return meals.filter(m => m.date === date).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  return meals;
}

export function addMeal(meal: Omit<Meal, "id" | "createdAt">): Meal {
  const meals = getStorage<Meal>("tracker_meals");
  const newMeal: Meal = { ...meal, id: generateId(), createdAt: new Date().toISOString() };
  meals.push(newMeal);
  setStorage("tracker_meals", meals);
  return newMeal;
}

export function deleteMeal(id: string): void {
  const meals = getStorage<Meal>("tracker_meals").filter(m => m.id !== id);
  setStorage("tracker_meals", meals);
}

// ===== ACTIVITIES =====
export function getActivities(date?: string): Activity[] {
  const activities = getStorage<Activity>("tracker_activities");
  if (date) return activities.filter(a => a.date === date).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  return activities;
}

export function addActivity(activity: Omit<Activity, "id" | "createdAt">): Activity {
  const activities = getStorage<Activity>("tracker_activities");
  const newActivity: Activity = { ...activity, id: generateId(), createdAt: new Date().toISOString() };
  activities.push(newActivity);
  setStorage("tracker_activities", activities);
  return newActivity;
}

export function deleteActivity(id: string): void {
  const activities = getStorage<Activity>("tracker_activities").filter(a => a.id !== id);
  setStorage("tracker_activities", activities);
}

// ===== EXPENSES =====
export function getExpenses(date?: string): Expense[] {
  const expenses = getStorage<Expense>("tracker_expenses");
  if (date) return expenses.filter(e => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return expenses;
}

export function addExpense(expense: Omit<Expense, "id" | "createdAt">): Expense {
  const expenses = getStorage<Expense>("tracker_expenses");
  const newExpense: Expense = { ...expense, id: generateId(), createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  setStorage("tracker_expenses", expenses);
  return newExpense;
}

export function deleteExpense(id: string): void {
  const expenses = getStorage<Expense>("tracker_expenses").filter(e => e.id !== id);
  setStorage("tracker_expenses", expenses);
}

// ===== DAILY STATUS =====
export function getDailyStatus(date: string): DailyStatus | null {
  const statuses = getStorage<DailyStatus>("tracker_daily_status");
  return statuses.find(s => s.date === date) || null;
}

export function saveDailyStatus(status: DailyStatus): void {
  const statuses = getStorage<DailyStatus>("tracker_daily_status");
  const index = statuses.findIndex(s => s.date === status.date);
  if (index >= 0) {
    statuses[index] = status;
  } else {
    statuses.push(status);
  }
  setStorage("tracker_daily_status", statuses);
}

// ===== LIVE TRACKING =====
export function getLiveTracks(): { active: LiveTrack | null; recent: LiveTrack[] } {
  const tracks = getStorage<LiveTrack>("tracker_live");
  const active = tracks.find(t => t.isActive) || null;
  const recent = tracks.filter(t => !t.isActive).sort((a, b) => (b.endedAt || "").localeCompare(a.endedAt || "")).slice(0, 20);
  return { active, recent };
}

export function startLiveTrack(title: string, category: string): LiveTrack {
  const tracks = getStorage<LiveTrack>("tracker_live");
  // Stop any active
  tracks.forEach(t => {
    if (t.isActive) {
      t.isActive = false;
      t.endedAt = new Date().toISOString();
    }
  });
  const newTrack: LiveTrack = {
    id: generateId(),
    title,
    category,
    startedAt: new Date().toISOString(),
    endedAt: null,
    isActive: true,
  };
  tracks.push(newTrack);
  setStorage("tracker_live", tracks);
  return newTrack;
}

export function stopLiveTrack(): void {
  const tracks = getStorage<LiveTrack>("tracker_live");
  tracks.forEach(t => {
    if (t.isActive) {
      t.isActive = false;
      t.endedAt = new Date().toISOString();
    }
  });
  setStorage("tracker_live", tracks);
}

export function deleteLiveTrack(id: string): void {
  const tracks = getStorage<LiveTrack>("tracker_live").filter(t => t.id !== id);
  setStorage("tracker_live", tracks);
}

// ===== SUMMARY =====
export function getDaySummary(date: string) {
  const meals = getMeals(date);
  const activities = getActivities(date);
  const expenses = getExpenses(date);
  const dailyStatus = getDailyStatus(date);

  return {
    meals,
    activities,
    expenses,
    dailyStatus,
    summary: {
      totalCalories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      totalActivityMinutes: activities.reduce((s, a) => s + (a.durationMinutes || 0), 0),
      mealsCount: meals.length,
      activitiesCount: activities.length,
      expensesCount: expenses.length,
    },
  };
}

// ===== HISTORY =====
export function getAllDates(): string[] {
  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  return Array.from(dates).sort().reverse();
}

export function getHistory() {
  const dates = getAllDates();
  return dates.map(date => {
    const summary = getDaySummary(date);
    return {
      date,
      mealsCount: summary.summary.mealsCount,
      activitiesCount: summary.summary.activitiesCount,
      expensesCount: summary.summary.expensesCount,
      expensesTotal: summary.summary.totalExpenses,
      totalCalories: summary.summary.totalCalories,
    };
  });
}
