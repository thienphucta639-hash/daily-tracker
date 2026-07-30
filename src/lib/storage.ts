// localStorage storage — all client-side, no DB needed

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

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// MEALS
export function getMeals(date?: string): Meal[] {
  const all = load<Meal>("t_meals");
  if (!date) return all;
  return all.filter(m => m.date === date).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}
export function addMeal(m: Omit<Meal, "id" | "createdAt">): Meal {
  const all = load<Meal>("t_meals");
  const n: Meal = { ...m, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_meals", all); return n;
}
export function deleteMeal(id: string) {
  save("t_meals", load<Meal>("t_meals").filter(m => m.id !== id));
}

// ACTIVITIES
export function getActivities(date?: string): Activity[] {
  const all = load<Activity>("t_acts");
  if (!date) return all;
  return all.filter(a => a.date === date).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
}
export function addActivity(a: Omit<Activity, "id" | "createdAt">): Activity {
  const all = load<Activity>("t_acts");
  const n: Activity = { ...a, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_acts", all); return n;
}
export function deleteActivity(id: string) {
  save("t_acts", load<Activity>("t_acts").filter(a => a.id !== id));
}

// EXPENSES
export function getExpenses(date?: string): Expense[] {
  const all = load<Expense>("t_exps");
  if (!date) return all;
  return all.filter(e => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function addExpense(e: Omit<Expense, "id" | "createdAt">): Expense {
  const all = load<Expense>("t_exps");
  const n: Expense = { ...e, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_exps", all); return n;
}
export function deleteExpense(id: string) {
  save("t_exps", load<Expense>("t_exps").filter(e => e.id !== id));
}

// DAILY STATUS
export function getDailyStatus(date: string): DailyStatus | null {
  return load<DailyStatus>("t_status").find(s => s.date === date) || null;
}
export function saveDailyStatus(s: DailyStatus) {
  const all = load<DailyStatus>("t_status");
  const i = all.findIndex(x => x.date === s.date);
  if (i >= 0) all[i] = s; else all.push(s);
  save("t_status", all);
}

// LIVE TRACKING
export function getLiveTracks(): { active: LiveTrack | null; recent: LiveTrack[] } {
  const all = load<LiveTrack>("t_live");
  return {
    active: all.find(t => t.isActive) || null,
    recent: all.filter(t => !t.isActive).sort((a, b) => (b.endedAt || "").localeCompare(a.endedAt || "")).slice(0, 20),
  };
}
export function startLiveTrack(title: string, category: string): LiveTrack {
  const all = load<LiveTrack>("t_live");
  all.forEach(t => { if (t.isActive) { t.isActive = false; t.endedAt = new Date().toISOString(); } });
  const n: LiveTrack = { id: uid(), title, category, startedAt: new Date().toISOString(), endedAt: null, isActive: true };
  all.push(n); save("t_live", all); return n;
}
export function stopLiveTrack() {
  const all = load<LiveTrack>("t_live");
  all.forEach(t => { if (t.isActive) { t.isActive = false; t.endedAt = new Date().toISOString(); } });
  save("t_live", all);
}
export function deleteLiveTrack(id: string) {
  save("t_live", load<LiveTrack>("t_live").filter(t => t.id !== id));
}

// HISTORY
export function getHistory() {
  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  return Array.from(dates).sort().reverse().map(date => {
    const meals = getMeals(date);
    const acts = getActivities(date);
    const exps = getExpenses(date);
    return {
      date,
      mealsCount: meals.length,
      activitiesCount: acts.length,
      expensesCount: exps.length,
      expensesTotal: exps.reduce((s, e) => s + e.amount, 0),
      totalCalories: meals.reduce((s, m) => s + (m.calories || 0), 0),
    };
  });
}
