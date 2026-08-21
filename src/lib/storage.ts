// localStorage storage — all client-side, no DB needed
// ⚠️ NEVER rename existing keys (t_meals, t_acts, t_exps, t_status, t_live)
// Only ADD new keys to preserve user data

import { formatDate } from "./utils";

export interface Meal {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  calories: number | null;
  protein: number | null; // grams
  fat: number | null; // grams
  carbs: number | null; // grams
  notes: string | null;
  time: string | null;
  image: string | null;
  price: number | null;
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
  paymentMethod?: "cash" | "account" | null;
  accountId?: string | null;
  mealId?: string | null;
  createdAt: string;
}

export interface DailyStatus {
  date: string;
  sleepHours: number | null;
  waterCups: number | null;
  weight: number | null;
  dailyNote: string | null;
  mood: number | null;       // 1-5
}

export interface LiveTrack {
  id: string;
  title: string;
  category: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
}

// Habits — each habit belongs to the date it was created
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  date: string | null;
  target: number | null; // target count (e.g. 3 sets, 8 glasses)
  unit: string | null; // "sets", "lần", "phút", "cốc"
  createdAt: string;
}

export interface HabitCheck {
  habitId: string;
  date: string;
  count: number | null; // how many done (null = simple check)
  note: string | null; // progress note
}

// NEW: Quick notes timeline
export interface QuickNote {
  id: string;
  date: string;
  text: string;
  time: string;
  pinned: boolean;
  createdAt: string;
}

// NEW: Pomodoro session
export interface PomodoroSession {
  id: string;
  date: string;
  label: string;
  minutes: number;
  completedAt: string;
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

// ═══ MEALS ═══
export function getMeals(date?: string): Meal[] {
  const all = load<Meal>("t_meals");
  if (!date) return all;
  return all.filter(m => m.date === date).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}
export function addMeal(m: Omit<Meal, "id" | "createdAt">): Meal {
  const all = load<Meal>("t_meals");
  const id = uid();
  const n: Meal = { ...m, id, createdAt: new Date().toISOString() };
  // Strip image from localStorage entry — will be saved to IDB separately
  const forStorage = { ...n, image: n.image ? `idb:img_${id}` : null };
  all.push(forStorage);
  save("t_meals", all);
  return n; // return with original image for immediate display
}
export async function saveMealImage(mealId: string, base64: string): Promise<void> {
  const { saveImage } = await import("./imgdb");
  await saveImage(`img_${mealId}`, base64);
}
export function deleteMeal(id: string) {
  save("t_meals", load<Meal>("t_meals").filter(m => m.id !== id));
  import("./imgdb").then(db => db.deleteImage(`img_${id}`)).catch(() => {});
}

// ═══ ACTIVITIES ═══
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
export function deleteActivity(id: string) { save("t_acts", load<Activity>("t_acts").filter(a => a.id !== id)); }

// ═══ EXPENSES ═══
export function getExpenses(date?: string): Expense[] {
  const all = load<Expense>("t_exps");
  if (!date) return all;
  return all.filter(e => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function addExpense(e: Omit<Expense, "id" | "createdAt">): Expense {
  const all = load<Expense>("t_exps");
  const id = uid();
  const n: Expense = { ...e, id, createdAt: new Date().toISOString() };
  const forStorage = { ...n, image: n.image ? `idb:img_${id}` : null };
  all.push(forStorage);
  save("t_exps", all);
  if (n.accountId) adjustMoneyAccount(n.accountId, -n.amount);
  return n;
}
export async function saveExpenseImage(expId: string, base64: string): Promise<void> {
  const { saveImage } = await import("./imgdb");
  await saveImage(`img_${expId}`, base64);
}
export function deleteExpense(id: string) {
  const all = load<Expense>("t_exps");
  const target = all.find(e => e.id === id);
  if (target?.accountId) adjustMoneyAccount(target.accountId, target.amount);
  save("t_exps", all.filter(e => e.id !== id));
  import("./imgdb").then(db => db.deleteImage(`img_${id}`)).catch(() => {});
}

// ═══ DAILY STATUS ═══
export function getDailyStatus(date: string): DailyStatus | null {
  return load<DailyStatus>("t_status").find(s => s.date === date) || null;
}
export function saveDailyStatus(s: DailyStatus) {
  const all = load<DailyStatus>("t_status");
  const i = all.findIndex(x => x.date === s.date);
  if (i >= 0) all[i] = { ...all[i], ...s }; else all.push(s);
  save("t_status", all);
}

// ═══ LIVE TRACKING ═══
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
export function deleteLiveTrack(id: string) { save("t_live", load<LiveTrack>("t_live").filter(t => t.id !== id)); }

// ═══ HABITS — scoped to the date they were added ═══
export function getHabits(date?: string): Habit[] {
  const all = load<Habit>("t_habits");
  if (!date) return all;
  // Show habits that belong to this date, or old habits without date field (backward compat)
  return all.filter(h => h.date === date || h.date === null || h.date === undefined);
}
export function getHabitsForDate(date: string): Habit[] {
  return load<Habit>("t_habits").filter(h => h.date === date);
}
export function addHabit(name: string, emoji: string, description?: string | null, date?: string, target?: number | null, unit?: string | null): Habit {
  const all = load<Habit>("t_habits");
  const n: Habit = { id: uid(), name, emoji, description: description || null, date: date || null, target: target || null, unit: unit || null, createdAt: new Date().toISOString() };
  all.push(n); save("t_habits", all); return n;
}
export function deleteHabit(id: string) {
  save("t_habits", load<Habit>("t_habits").filter(h => h.id !== id));
  save("t_habit_checks", load<HabitCheck>("t_habit_checks").filter(c => c.habitId !== id));
}
export function postponeHabit(id: string, fromDate: string) {
  // Move habit to next day
  const all = load<Habit>("t_habits");
  const h = all.find(x => x.id === id);
  if (!h) return;
  const next = new Date(fromDate + "T00:00:00");
  next.setDate(next.getDate() + 1);
  // Create copy for tomorrow
  const n: Habit = { id: uid(), name: h.name, emoji: h.emoji, description: h.description, date: formatDate(next), target: h.target || null, unit: h.unit || null, createdAt: new Date().toISOString() };
  all.push(n);
  // Remove from today
  const idx = all.indexOf(h);
  if (idx >= 0) all.splice(idx, 1);
  save("t_habits", all);
}
export function getHabitChecks(date: string): HabitCheck[] {
  return load<HabitCheck>("t_habit_checks").filter(c => c.date === date);
}
export function toggleHabitCheck(habitId: string, date: string) {
  const all = load<HabitCheck>("t_habit_checks");
  const i = all.findIndex(c => c.habitId === habitId && c.date === date);
  if (i >= 0) all.splice(i, 1); else all.push({ habitId, date, count: null, note: null });
  save("t_habit_checks", all);
}
export function updateHabitCheck(habitId: string, date: string, count: number | null, note: string | null) {
  const all = load<HabitCheck>("t_habit_checks");
  let c = all.find(x => x.habitId === habitId && x.date === date);
  if (!c) { c = { habitId, date, count: null, note: null }; all.push(c); }
  c.count = count; c.note = note;
  save("t_habit_checks", all);
}
export function getHabitCheck(habitId: string, date: string): HabitCheck | null {
  return load<HabitCheck>("t_habit_checks").find(c => c.habitId === habitId && c.date === date) || null;
}
export function getHabitStreak(habitId: string): number {
  const checks = load<HabitCheck>("t_habit_checks").filter(c => c.habitId === habitId);
  const dates = new Set(checks.map(c => c.date));
  let streak = 0;
  const d = new Date();
  if (!dates.has(formatDate(d))) d.setDate(d.getDate() - 1);
  while (dates.has(formatDate(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// ═══ QUICK NOTES (NEW — key: t_qnotes) ═══
export function getQuickNotes(date: string): QuickNote[] {
  return load<QuickNote>("t_qnotes").filter(n => n.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function addQuickNote(date: string, text: string): QuickNote {
  const all = load<QuickNote>("t_qnotes");
  const now = new Date();
  const n: QuickNote = { id: uid(), date, text, time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, pinned: false, createdAt: now.toISOString() };
  all.push(n); save("t_qnotes", all); return n;
}
export function deleteQuickNote(id: string) { save("t_qnotes", load<QuickNote>("t_qnotes").filter(n => n.id !== id)); }
export function editQuickNote(id: string, newText: string) {
  const all = load<QuickNote>("t_qnotes");
  const n = all.find(x => x.id === id);
  if (n) n.text = newText;
  save("t_qnotes", all);
}
export function togglePinNote(id: string) {
  const all = load<QuickNote>("t_qnotes");
  const n = all.find(x => x.id === id);
  if (n) n.pinned = !n.pinned;
  save("t_qnotes", all);
}

// ═══ POMODORO (NEW — key: t_pomo) ═══
export function getPomoSessions(date: string): PomodoroSession[] {
  return load<PomodoroSession>("t_pomo").filter(p => p.date === date);
}
export function addPomoSession(date: string, label: string, minutes: number): PomodoroSession {
  const all = load<PomodoroSession>("t_pomo");
  const n: PomodoroSession = { id: uid(), date, label, minutes, completedAt: new Date().toISOString() };
  all.push(n); save("t_pomo", all); return n;
}

// ═══ WATER QUICK ADD ═══
export function quickAddWater(date: string) {
  const s = getDailyStatus(date) || { date, sleepHours: null, waterCups: null, weight: null, dailyNote: null, mood: null };
  s.waterCups = (s.waterCups || 0) + 1;
  saveDailyStatus(s);
}

// ═══ MOOD QUICK SET ═══
export function quickSetMood(date: string, mood: number) {
  const s = getDailyStatus(date) || { date, sleepHours: null, waterCups: null, weight: null, dailyNote: null, mood: null };
  s.mood = mood;
  saveDailyStatus(s);
}

// ═══ STREAK ═══
export function getStreak(): number {
  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  let streak = 0;
  const d = new Date();
  if (!dates.has(formatDate(d))) d.setDate(d.getDate() - 1);
  while (dates.has(formatDate(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// ═══ WEEK STATS ═══
export function getWeekStats() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    const meals = getMeals(ds);
    const exps = getExpenses(ds);
    const acts = getActivities(ds);
    days.push({
      date: ds,
      label: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()],
      isToday: i === 0,
      expense: exps.reduce((s, e) => s + e.amount, 0),
      calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      actMinutes: acts.reduce((s, a) => s + (a.durationMinutes || 0), 0),
      mealsCount: meals.length,
    });
  }
  return days;
}

// ═══ RECENT ACTIVITY LOG — all days combined ═══
export interface DayLog {
  date: string;
  meals: Meal[];
  activities: Activity[];
  expenses: Expense[];
  liveTracks: LiveTrack[];
}
export function getLiveTracksForDate(date: string): LiveTrack[] {
  return load<LiveTrack>("t_live")
    .filter(t => !t.isActive && formatDate(new Date(t.startedAt)) === date)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}
export function getAllDataDates(): string[] {
  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  load<LiveTrack>("t_live").forEach(t => { if (!t.isActive) dates.add(formatDate(new Date(t.startedAt))); });
  return Array.from(dates).sort();
}
export function getRecentDayLogs(maxDays: number = 7): DayLog[] {
  return getAllDataDates().reverse().slice(0, maxDays).map(date => ({
    date,
    meals: getMeals(date),
    activities: getActivities(date),
    expenses: getExpenses(date),
    liveTracks: getLiveTracksForDate(date),
  }));
}

// ═══ HISTORY ═══
export function getHistory() {
  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  load<LiveTrack>("t_live").forEach(t => { if (!t.isActive) dates.add(formatDate(new Date(t.startedAt))); });
  return Array.from(dates).sort().reverse().map(date => {
    const meals = getMeals(date);
    const acts = getActivities(date);
    const exps = getExpenses(date);
    return {
      date, mealsCount: meals.length, activitiesCount: acts.length, expensesCount: exps.length,
      expensesTotal: exps.reduce((s, e) => s + e.amount, 0),
      totalCalories: meals.reduce((s, m) => s + (m.calories || 0), 0),
    };
  });
}

// ═══ BACKUP / RESTORE ═══
export function exportAll(): string {
  return JSON.stringify({
    app: "daily-tracker", version: 2, exportedAt: new Date().toISOString(),
    meals: load<Meal>("t_meals"), activities: load<Activity>("t_acts"),
    expenses: load<Expense>("t_exps"), status: load<DailyStatus>("t_status"),
    live: load<LiveTrack>("t_live"), habits: load<Habit>("t_habits"),
    habitChecks: load<HabitCheck>("t_habit_checks"), qnotes: load<QuickNote>("t_qnotes"),
    pomo: load<PomodoroSession>("t_pomo"),
    plans: load<PlanItem>("t_plans"), schedules: load<Schedule>("t_schedules"),
    mealPresets: load<MealPreset>("t_meal_presets"), expPresets: load<ExpensePreset>("t_exp_presets"),
    debts: load<Debt>("t_debts"), streak: localStorage.getItem("t_streak_v3"),
    accounts: load<MoneyAccount>("t_accounts"), dreams: load<DreamItem>("t_dreams"),
    buyDecisions: load<BuyDecision>("t_buy_decisions"), planPresets: load<PlanPreset>("t_plan_presets"),
    expiry: load<ExpiryItem>("t_expiry"), recurring: load<RecurringItem>("t_recurring"),
    places: load<PlaceItem>("t_places"), borrows: load<BorrowItem>("t_borrows"), top3: load<Top3Day>("t_top3"),
    checklists: load<Checklist>("t_checklists"), events: load<CustomEvent>("t_events"),
  }, null, 2);
}

export function importAll(json: string): boolean {
  try {
    const d = JSON.parse(json);
    if (!d.meals && !d.expenses && !d.app) return false;
    if (d.meals) save("t_meals", d.meals);
    if (d.activities) save("t_acts", d.activities);
    if (d.expenses) save("t_exps", d.expenses);
    if (d.status) save("t_status", d.status);
    if (d.live) save("t_live", d.live);
    if (d.habits) save("t_habits", d.habits);
    if (d.habitChecks) save("t_habit_checks", d.habitChecks);
    if (d.qnotes) save("t_qnotes", d.qnotes);
    if (d.pomo) save("t_pomo", d.pomo);
    if (d.plans) save("t_plans", d.plans);
    if (d.schedules) save("t_schedules", d.schedules);
    if (d.mealPresets) save("t_meal_presets", d.mealPresets);
    if (d.expPresets) save("t_exp_presets", d.expPresets);
    if (d.debts) save("t_debts", d.debts);
    if (d.streak) localStorage.setItem("t_streak_v3", d.streak);
    if (d.accounts) save("t_accounts", d.accounts);
    if (d.dreams) save("t_dreams", d.dreams);
    if (d.buyDecisions) save("t_buy_decisions", d.buyDecisions);
    if (d.planPresets) save("t_plan_presets", d.planPresets);
    if (d.expiry) save("t_expiry", d.expiry);
    if (d.recurring) save("t_recurring", d.recurring);
    if (d.places) save("t_places", d.places);
    if (d.borrows) save("t_borrows", d.borrows);
    if (d.top3) save("t_top3", d.top3);
    if (d.checklists) save("t_checklists", d.checklists);
    if (d.events) save("t_events", d.events);
    return true;
  } catch { return false; }
}

// ═══ DAILY PLANNER — tasks/plans for a specific date ═══
export interface PlanItem {
  id: string;
  date: string;
  time: string | null;
  endTime?: string | null;
  title: string;
  detail: string | null;
  done: boolean;
  category: string;
  priority: number;
  budget: number | null;
  result: string | null;
  dayNote: string | null; // daily override note (rep/set/etc) — doesn't change original when copied
  sourceId: string | null; // original plan id if copied
  createdAt: string;
}

export function getPlans(date: string): PlanItem[] {
  return load<PlanItem>("t_plans").filter(p => p.date === date).sort((a, b) => {
    // Sort: urgent first, then by time
    const pa = (a.priority || 0); const pb = (b.priority || 0);
    if (pb !== pa) return pb - pa;
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  });
}
export function addPlan(p: Omit<PlanItem, "id" | "done" | "createdAt" | "result" | "dayNote" | "sourceId"> & { dayNote?: string | null; sourceId?: string | null }): PlanItem {
  const all = load<PlanItem>("t_plans");
  const n: PlanItem = { ...p, id: uid(), done: false, result: null, dayNote: p.dayNote || null, sourceId: p.sourceId || null, priority: p.priority || 0, budget: p.budget || null, createdAt: new Date().toISOString() };
  all.push(n); save("t_plans", all); return n;
}
export function updatePlanDayNote(id: string, dayNote: string) {
  const all = load<PlanItem>("t_plans");
  const p = all.find(x => x.id === id);
  if (p) p.dayNote = dayNote || null;
  save("t_plans", all);
}
export function togglePlan(id: string) {
  const all = load<PlanItem>("t_plans");
  const p = all.find(x => x.id === id);
  if (p) p.done = !p.done;
  save("t_plans", all);
}
export function updatePlanResult(id: string, result: string) {
  const all = load<PlanItem>("t_plans");
  const p = all.find(x => x.id === id);
  if (p) p.result = result || null;
  save("t_plans", all);
}
export function deletePlan(id: string) {
  save("t_plans", load<PlanItem>("t_plans").filter(p => p.id !== id));
}
// Copy plans from one date to another (only to today or future)
export function copyPlans(fromDate: string, toDate: string) {
  const today = formatDate(new Date());
  if (toDate < today) return; // Can't copy to past
  const src = getPlans(fromDate);
  src.forEach(p => addPlan({ date: toDate, time: p.time, endTime: p.endTime || null, title: p.title, detail: p.detail, category: p.category, priority: p.priority || 0, budget: p.budget, sourceId: p.id }));
}
// Get dates that have plans
export function getPlanDates(): string[] {
  return Array.from(new Set(load<PlanItem>("t_plans").map(p => p.date))).sort().reverse();
}

// ═══ USER PLAN PRESETS — quick plans created by user (key: t_plan_presets) ═══
export interface PlanPreset {
  id: string;
  title: string;
  detail: string | null;
  time: string | null;
  endTime?: string | null;
  category: string;
  priority: number;
  budget: number | null;
}
export function getPlanPresets(): PlanPreset[] { return load<PlanPreset>("t_plan_presets"); }
export function addPlanPreset(p: Omit<PlanPreset, "id">): PlanPreset {
  const all = load<PlanPreset>("t_plan_presets");
  const found = all.find(x => x.title.toLowerCase() === p.title.toLowerCase());
  if (found) { Object.assign(found, p); save("t_plan_presets", all); return found; }
  const n: PlanPreset = { ...p, id: uid() };
  all.push(n); save("t_plan_presets", all); return n;
}
export function deletePlanPreset(id: string): void { save("t_plan_presets", load<PlanPreset>("t_plan_presets").filter(p => p.id !== id)); }
export function applyPlanPreset(id: string, date: string): PlanItem | null {
  const p = getPlanPresets().find(x => x.id === id);
  if (!p || date < formatDate(new Date())) return null;
  return addPlan({ date, time: p.time, endTime: p.endTime || null, title: p.title, detail: p.detail, category: p.category, priority: p.priority, budget: p.budget, sourceId: p.id });
}

// ═══ SCHEDULE TEMPLATES — reusable time blocks per day ═══
export interface Schedule {
  id: string;
  name: string;
  date: string | null; // date it belongs to; null for old data
  items: ScheduleBlock[];
  createdAt: string;
}
export interface ScheduleBlock {
  time: string;
  endTime: string | null;
  title: string;
  category: string;
}

export function getSchedules(): Schedule[] { return load<Schedule>("t_schedules"); }
export function getSchedulesForDate(date: string): Schedule[] {
  return load<Schedule>("t_schedules").filter(s => {
    if (s.date) return s.date === date;
    // backward compat: old schedules without date belong to created day
    return formatDate(new Date(s.createdAt)) === date;
  });
}
export function addSchedule(name: string, items: ScheduleBlock[], date?: string): Schedule {
  const all = load<Schedule>("t_schedules");
  const n: Schedule = { id: uid(), name, date: date || null, items, createdAt: new Date().toISOString() };
  all.push(n); save("t_schedules", all); return n;
}
export function updateSchedule(id: string, name: string, items: ScheduleBlock[]) {
  const all = load<Schedule>("t_schedules");
  const s = all.find(x => x.id === id);
  if (s) { s.name = name; s.items = items; }
  save("t_schedules", all);
}
export function deleteSchedule(id: string) {
  save("t_schedules", load<Schedule>("t_schedules").filter(s => s.id !== id));
}
export function applySchedule(scheduleId: string, date: string) {
  const s = getSchedules().find(x => x.id === scheduleId);
  if (!s) return;
  s.items.forEach(block => {
    addPlan({ date, time: block.time, endTime: block.endTime || null, title: block.title, detail: null, category: block.category, priority: 0, budget: null });
  });
}

// ═══ STREAK V3 — 48h recovery window ═══
export interface StreakData {
  currentStreak: number;
  brokenAt: string | null; // ISO timestamp when streak broke
  recoveredDates: string[]; // dates that were recovered
}

export function getStreakV2(): StreakData {
  const raw = localStorage.getItem("t_streak_v3");
  let data: StreakData = raw ? JSON.parse(raw) : { currentStreak: 0, brokenAt: null, recoveredDates: [] };

  const dates = new Set<string>();
  getMeals().forEach(m => dates.add(m.date));
  getActivities().forEach(a => dates.add(a.date));
  getExpenses().forEach(e => dates.add(e.date));
  data.recoveredDates.forEach(d => dates.add(d));

  const now = new Date();
  const today = formatDate(now);
  const yesterday = formatDate(new Date(now.getTime() - 86400000));

  // Check if streak is broken (missed yesterday AND no recovery)
  if (!dates.has(today) && !dates.has(yesterday) && data.currentStreak > 0) {
    // Check if within 48h recovery window
    if (!data.brokenAt) {
      data.brokenAt = new Date().toISOString();
    }
  }

  // If broken and past 48h → reset
  if (data.brokenAt) {
    const hoursElapsed = (Date.now() - new Date(data.brokenAt).getTime()) / 3600000;
    if (hoursElapsed > 48) {
      data.currentStreak = 0;
      data.brokenAt = null;
      data.recoveredDates = [];
      localStorage.setItem("t_streak_v3", JSON.stringify(data));
      return data;
    }
  }

  // Count streak
  let streak = 0;
  const d = new Date();
  if (!dates.has(formatDate(d))) d.setDate(d.getDate() - 1);
  while (dates.has(formatDate(d))) { streak++; d.setDate(d.getDate() - 1); }
  data.currentStreak = streak;

  // If tracked today and was broken → recovered
  if (dates.has(today) && data.brokenAt) {
    data.brokenAt = null;
  }

  localStorage.setItem("t_streak_v3", JSON.stringify(data));
  return data;
}

export function recoverStreak(): boolean {
  const data = getStreakV2();
  if (!data.brokenAt) return false;
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  data.recoveredDates.push(yesterday);
  data.brokenAt = null;
  localStorage.setItem("t_streak_v3", JSON.stringify(data));
  return true;
}

// ═══ PLAN REMINDERS ═══
export interface PlanReminder {
  id: string;
  planId: string;
  planDate: string;
  planTitle: string;
  planTime: string | null;
  planEndTime?: string | null;
  planDetail: string | null;
  remindAt: string; // ISO date string for when to remind
  color: string; // hex color
  attachment: string | null; // file name or note
  seen: boolean;
  createdAt: string;
}

export function getReminders(): PlanReminder[] { return load<PlanReminder>("t_reminders"); }
export function getActiveReminders(): PlanReminder[] {
  const now = formatDate(new Date());
  return load<PlanReminder>("t_reminders").filter(r => !r.seen && r.remindAt <= now);
}
export function addReminder(r: Omit<PlanReminder, "id" | "seen" | "createdAt">): PlanReminder {
  const all = load<PlanReminder>("t_reminders");
  const n: PlanReminder = { ...r, id: uid(), seen: false, createdAt: new Date().toISOString() };
  all.push(n); save("t_reminders", all); return n;
}
export function markReminderSeen(id: string) {
  const all = load<PlanReminder>("t_reminders");
  const r = all.find(x => x.id === id);
  if (r) r.seen = true;
  save("t_reminders", all);
}
export function markAllRemindersSeen() {
  const all = load<PlanReminder>("t_reminders");
  all.forEach(r => r.seen = true);
  save("t_reminders", all);
}
export function deleteReminder(id: string) {
  save("t_reminders", load<PlanReminder>("t_reminders").filter(r => r.id !== id));
}

// ═══ PET GREETING ═══
export function getTodayGreeting(): string {
  const h = new Date().getHours();
  const greetings = h < 12
    ? ["Chào buổi sáng! Hôm nay track gì nào? 💪", "Ngày mới tràn đầy năng lượng! 🔥", "Sáng rồi, lên kế hoạch thôi! ✨"]
    : h < 18
    ? ["Buổi chiều vui vẻ! Đã track gì chưa? 📋", "Cố lên, còn nửa ngày nữa! 💪", "Đừng quên ghi lại bữa trưa nhé! 🍜"]
    : ["Tối rồi, xem lại ngày hôm nay nào! 📊", "Đã hoàn thành hết plan chưa? ✅", "Nghỉ ngơi sớm nha! 🌙"];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// ═══ MEAL PRESETS — saved nutrition templates (key: t_meal_presets) ═══
export interface MealPreset {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType?: string | null;
  price?: number | null;
}

export function getMealPresets(): MealPreset[] { return load<MealPreset>("t_meal_presets"); }
export function addMealPreset(p: Omit<MealPreset, "id">): MealPreset {
  const all = load<MealPreset>("t_meal_presets");
  // Don't duplicate by name
  const exists = all.find(x => x.name.toLowerCase() === p.name.toLowerCase());
  if (exists) { Object.assign(exists, p); save("t_meal_presets", all); return exists; }
  const n: MealPreset = { ...p, id: uid() };
  all.push(n); save("t_meal_presets", all); return n;
}
export function deleteMealPreset(id: string) {
  save("t_meal_presets", load<MealPreset>("t_meal_presets").filter(p => p.id !== id));
}

// ═══ MONEY ACCOUNTS — cash and bank balances (key: t_accounts) ═══
export interface MoneyAccount {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet" | "other";
  balance: number;
  color: string;
  updatedAt: string;
}
export function getMoneyAccounts(): MoneyAccount[] { return load<MoneyAccount>("t_accounts"); }
export function addMoneyAccount(a: Omit<MoneyAccount, "id" | "updatedAt">): MoneyAccount {
  const all = load<MoneyAccount>("t_accounts");
  const n: MoneyAccount = { ...a, id: uid(), updatedAt: new Date().toISOString() };
  all.push(n); save("t_accounts", all); return n;
}
export function adjustMoneyAccount(id: string, delta: number): void {
  const all = load<MoneyAccount>("t_accounts");
  const a = all.find(x => x.id === id);
  if (a) { a.balance += delta; a.updatedAt = new Date().toISOString(); save("t_accounts", all); }
}
export function updateMoneyAccount(id: string, updates: Partial<MoneyAccount>): void {
  const all = load<MoneyAccount>("t_accounts");
  const a = all.find(x => x.id === id);
  if (a) { Object.assign(a, updates, { updatedAt: new Date().toISOString() }); save("t_accounts", all); }
}
export function deleteMoneyAccount(id: string): void { save("t_accounts", load<MoneyAccount>("t_accounts").filter(a => a.id !== id)); }
export function getTotalMoney(): number { return getMoneyAccounts().reduce((s, a) => s + a.balance, 0); }

// ═══ DREAM ITEMS — wishlist and saving goals (key: t_dreams) ═══
export interface DreamItem {
  id: string;
  name: string;
  category: "need" | "want" | "subscription" | "experience" | "other";
  price: number;
  savedAmount: number;
  monthlySaving: number;
  reserveAmount: number;
  priority: number;
  targetDate: string | null;
  reason: string | null;
  status: "saving" | "ready" | "bought" | "paused";
  createdAt: string;
  contributions: { amount: number; date: string }[];
}
export function getDreamItems(): DreamItem[] { return load<DreamItem>("t_dreams").sort((a, b) => b.priority - a.priority); }
export function addDreamItem(d: Omit<DreamItem, "id" | "createdAt" | "contributions">): DreamItem {
  const all = load<DreamItem>("t_dreams");
  const n: DreamItem = { ...d, id: uid(), createdAt: new Date().toISOString(), contributions: [] };
  all.push(n); save("t_dreams", all); return n;
}
export function contributeDream(id: string, amount: number): void {
  const all = load<DreamItem>("t_dreams");
  const d = all.find(x => x.id === id);
  if (d) {
    d.savedAmount = Math.min(d.price, d.savedAmount + amount);
    d.contributions.push({ amount, date: new Date().toISOString() });
    if (d.savedAmount >= d.price) d.status = "ready";
    save("t_dreams", all);
  }
}
export function updateDreamItem(id: string, updates: Partial<DreamItem>): void {
  const all = load<DreamItem>("t_dreams");
  const d = all.find(x => x.id === id);
  if (d) { Object.assign(d, updates); save("t_dreams", all); }
}
export function deleteDreamItem(id: string): void { save("t_dreams", load<DreamItem>("t_dreams").filter(d => d.id !== id)); }

// ═══ PURCHASE DECISIONS — saved buy/wait analyses (key: t_buy_decisions) ═══
export interface BuyDecision {
  id: string;
  name: string;
  type: "item" | "subscription" | "course" | "service" | "other";
  price: number;
  monthlyPrice: number;
  expectedUses: number;
  importance: number;
  urgency: number;
  hasAlternative: boolean;
  notes: string | null;
  result: string;
  score: number;
  createdAt: string;
}
export function getBuyDecisions(): BuyDecision[] { return load<BuyDecision>("t_buy_decisions").sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function addBuyDecision(d: Omit<BuyDecision, "id" | "createdAt">): BuyDecision {
  const all = load<BuyDecision>("t_buy_decisions");
  const n: BuyDecision = { ...d, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_buy_decisions", all); return n;
}
export function deleteBuyDecision(id: string): void { save("t_buy_decisions", load<BuyDecision>("t_buy_decisions").filter(d => d.id !== id)); }

// ═══ EXPENSE PRESETS — recurring cost templates (key: t_exp_presets) ═══
export interface ExpensePreset {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export function getExpensePresets(): ExpensePreset[] { return load<ExpensePreset>("t_exp_presets"); }
export function addExpensePreset(p: Omit<ExpensePreset, "id">): ExpensePreset {
  const all = load<ExpensePreset>("t_exp_presets");
  const n: ExpensePreset = { ...p, id: uid() };
  all.push(n); save("t_exp_presets", all); return n;
}
export function deleteExpensePreset(id: string) {
  save("t_exp_presets", load<ExpensePreset>("t_exp_presets").filter(p => p.id !== id));
}

// ═══ DEBT TRACKING — loans, credit cards, personal debts (key: t_debts) ═══
export interface Debt {
  id: string;
  creditor: string;      // ngân hàng / tên người
  description: string;    // khoản nợ gì
  totalAmount: number;    // tổng nợ ban đầu
  paidAmount: number;     // đã trả
  dueDate: string | null; // hạn cuối YYYY-MM-DD
  priority: number;       // 0=thấp, 1=tb, 2=cao, 3=khẩn cấp
  interestRate: number | null; // lãi suất %/năm
  createdAt: string;
  paidHistory: { amount: number; date: string }[];
}

// ═══ EXPIRY ITEMS — hạn sử dụng đồ ăn/đồ dùng (key: t_expiry) ═══
export interface ExpiryItem {
  id: string; name: string; price: number; link: string | null;
  boughtDate: string; expiryDays: number; createdAt: string;
}
export function getExpiryItems(): ExpiryItem[] { return load<ExpiryItem>("t_expiry"); }
export function addExpiryItem(e: Omit<ExpiryItem, "id" | "createdAt">): ExpiryItem {
  const all = load<ExpiryItem>("t_expiry"); const n = { ...e, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_expiry", all); return n;
}
export function deleteExpiryItem(id: string) { save("t_expiry", load<ExpiryItem>("t_expiry").filter(x => x.id !== id)); }
export interface ExpiringItem extends ExpiryItem { expiryDate: string; daysLeft: number; }
export function getExpiringWithin(days: number): ExpiringItem[] {
  const today = new Date();
  return getExpiryItems().map(x => {
    const d = new Date(x.boughtDate + "T00:00:00"); d.setDate(d.getDate() + x.expiryDays);
    return { ...x, expiryDate: formatDate(d), daysLeft: Math.round((d.getTime() - new Date(formatDate(today) + "T00:00:00").getTime()) / 86400000) };
  }).filter(x => x.daysLeft <= days).sort((a, b) => a.daysLeft - b.daysLeft);
}

// ═══ RECURRING RENEWALS — gia hạn gói/bảo hiểm/xe/hóa đơn/việc định kỳ (key: t_recurring) ═══
export interface RecurringItem {
  id: string; name: string; kind: "subscription" | "insurance" | "vehicle" | "bill" | "chore" | "other";
  amount: number; cycle: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  cycleDays: number | null; // for custom
  nextDate: string; endDate?: string | null; note: string | null; link: string | null; keep?: boolean; createdAt: string;
}
export function getRecurring(): RecurringItem[] { return load<RecurringItem>("t_recurring"); }
export function addRecurring(r: Omit<RecurringItem, "id" | "createdAt">): RecurringItem {
  const all = load<RecurringItem>("t_recurring"); const n = { ...r, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_recurring", all); return n;
}
export function bumpRecurring(id: string) { // đánh dấu đã gia hạn → sang kỳ tiếp
  const all = load<RecurringItem>("t_recurring"); const r = all.find(x => x.id === id);
  if (!r) return;
  const days = r.cycle === "daily" ? 1 : r.cycle === "weekly" ? 7 : r.cycle === "monthly" ? 30 : r.cycle === "quarterly" ? 90 : r.cycle === "yearly" ? 365 : (r.cycleDays || 30);
  const d = new Date(r.nextDate + "T00:00:00"); d.setDate(d.getDate() + days); r.nextDate = formatDate(d);
  save("t_recurring", all);
}
export function deleteRecurring(id: string) { save("t_recurring", load<RecurringItem>("t_recurring").filter(x => x.id !== id)); }
export interface RecurringDue extends RecurringItem { daysLeft: number; }
export function getRecurringDueWithin(days: number): RecurringDue[] {
  const t = new Date(formatDate(new Date()) + "T00:00:00").getTime();
  return getRecurring().map(r => ({ ...r, daysLeft: Math.round((new Date(r.nextDate + "T00:00:00").getTime() - t) / 86400000) }))
    .filter(r => r.daysLeft <= days).sort((a, b) => a.daysLeft - b.daysLeft);
}
export function cycleLabel(r: RecurringItem): string {
  return r.cycle === "daily" ? "hằng ngày" : r.cycle === "weekly" ? "hàng tuần" : r.cycle === "monthly" ? "hàng tháng" : r.cycle === "quarterly" ? "hàng quý" : r.cycle === "yearly" ? "hàng năm" : `${r.cycleDays || 30} ngày/lần`;
}

// ═══ PLACES — chỗ ăn/cafe hay (key: t_places) ═══
export interface PlaceItem {
  id: string; name: string; kind: "food" | "coffee" | "play" | "other";
  note: string | null; link: string | null; address?: string | null;
  bestFor?: string | null; priceRange?: string | null; rating?: number | null;
  createdAt: string;
}
export function getPlaces(): PlaceItem[] { return load<PlaceItem>("t_places"); }
export function addPlace(p: Omit<PlaceItem, "id" | "createdAt">): PlaceItem {
  const all = load<PlaceItem>("t_places"); const n = { ...p, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_places", all); return n;
}
export function deletePlace(id: string) { save("t_places", load<PlaceItem>("t_places").filter(x => x.id !== id)); }
export function suggestPlace(): PlaceItem | null {
  const all = getPlaces(); return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

// ═══ BORROWS — đồ cho mượn (key: t_borrows) ═══
export interface BorrowItem {
  id: string; borrower: string; item: string; lentDate: string;
  expectedReturn: string | null; returned: boolean; priority?: number;
  note?: string | null; createdAt: string;
}
export function getBorrows(): BorrowItem[] { return load<BorrowItem>("t_borrows").filter(b => !b.returned); }
export function addBorrow(b: Omit<BorrowItem, "id" | "createdAt" | "returned">): BorrowItem {
  const all = load<BorrowItem>("t_borrows"); const n = { ...b, id: uid(), returned: false, createdAt: new Date().toISOString() };
  all.push(n); save("t_borrows", all); return n;
}
export function markBorrowReturned(id: string) {
  const all = load<BorrowItem>("t_borrows"); const b = all.find(x => x.id === id);
  if (b) { b.returned = true; save("t_borrows", all); }
}
export function extendBorrow(id: string, newDate: string) {
  const all = load<BorrowItem>("t_borrows"); const b = all.find(x => x.id === id);
  if (b) { b.expectedReturn = newDate; save("t_borrows", all); }
}
export function deleteBorrow(id: string) { save("t_borrows", load<BorrowItem>("t_borrows").filter(x => x.id !== id)); }
export function getOverdueBorrows(warnDays: number): (BorrowItem & { daysLent: number })[] {
  const t = Date.now();
  return getBorrows().map(b => ({ ...b, daysLent: Math.round((t - new Date(b.lentDate + "T00:00:00").getTime()) / 86400000) })).filter(b => b.daysLent >= warnDays);
}

// ═══ TOP 3 DAILY FOCUS (key: t_top3) ═══
export interface Top3Day { date: string; planIds: string[]; createdAt: string; }
export function getTop3(date: string): string[] {
  return load<Top3Day>("t_top3").find(x => x.date === date)?.planIds || [];
}
export function setTop3(date: string, planIds: string[]) {
  const all = load<Top3Day>("t_top3").filter(x => x.date !== date);
  if (planIds.length) all.push({ date, planIds, createdAt: new Date().toISOString() });
  save("t_top3", all);
}

// ═══ CHECKLISTS — mẫu đem đồ đi chơi/du lịch/học (key: t_checklists) ═══
export interface ChecklistItem { id: string; name: string; checked: boolean; }
export interface Checklist { id: string; name: string; icon: string; items: ChecklistItem[]; tripDate?: string | null; remindBefore?: number; createdAt: string; }
export function getChecklists(): Checklist[] { return load<Checklist>("t_checklists"); }
export function addChecklist(c: Omit<Checklist, "id" | "createdAt">): Checklist {
  const all = load<Checklist>("t_checklists"); const n = { ...c, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_checklists", all); return n;
}
export function toggleChecklistItem(clId: string, itemId: string) {
  const all = load<Checklist>("t_checklists");
  const cl = all.find(x => x.id === clId);
  if (cl) { const it = cl.items.find(i => i.id === itemId); if (it) it.checked = !it.checked; }
  save("t_checklists", all);
}
export function addChecklistItem(clId: string, name: string) {
  const all = load<Checklist>("t_checklists");
  const cl = all.find(x => x.id === clId);
  if (cl) cl.items.push({ id: uid(), name, checked: false });
  save("t_checklists", all);
}
export function deleteChecklistItem(clId: string, itemId: string) {
  const all = load<Checklist>("t_checklists");
  const cl = all.find(x => x.id === clId);
  if (cl) cl.items = cl.items.filter(i => i.id !== itemId);
  save("t_checklists", all);
}
export function resetChecklist(clId: string) { // dùng lại lần đi sau
  const all = load<Checklist>("t_checklists");
  const cl = all.find(x => x.id === clId);
  if (cl) cl.items.forEach(i => { i.checked = false; });
  save("t_checklists", all);
}
export function deleteChecklist(clId: string) { save("t_checklists", load<Checklist>("t_checklists").filter(x => x.id !== clId)); }

// ═══ CUSTOM EVENTS — sự kiện cá nhân cần đếm ngược (key: t_events) ═══
export interface CustomEvent { id: string; name: string; date: string; note: string | null; createdAt: string; }
export function getCustomEvents(): CustomEvent[] { return load<CustomEvent>("t_events"); }
export function addCustomEvent(e: Omit<CustomEvent, "id" | "createdAt">): CustomEvent {
  const all = load<CustomEvent>("t_events"); const n = { ...e, id: uid(), createdAt: new Date().toISOString() };
  all.push(n); save("t_events", all); return n;
}
export function deleteCustomEvent(id: string) { save("t_events", load<CustomEvent>("t_events").filter(x => x.id !== id)); }

// ═══ PET ALERT SEEN (key: t_pet_seen) — ghi nhận lần nhắc cuối theo loại/ngày ═══
export function getSeenKey(key: string): boolean { return !!localStorage.getItem(`t_pet_seen_${key}`); }
export function markSeenKey(key: string) { localStorage.setItem(`t_pet_seen_${key}`, new Date().toISOString()); }

// ═══ AB NORMAL SPEND CHECK ═══
export function getSpendAnomaly(): { today: number; avg: number; ratio: number } | null {
  const today = formatDate(new Date());
  const todaySpent = getExpenses(today).reduce((s, e) => s + e.amount, 0);
  if (todaySpent === 0) return null;
  let total = 0, days = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const sum = getExpenses(formatDate(d)).reduce((s, e) => s + e.amount, 0);
    if (sum > 0) { total += sum; days++; }
  }
  if (days === 0) return null;
  const avg = total / days;
  return avg > 0 ? { today: todaySpent, avg, ratio: todaySpent / avg } : null;
}

export function getDebts(): Debt[] {
  return load<Debt>("t_debts").sort((a, b) => {
    // Sort by priority desc, then by due date asc
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
  });
}
export function addDebt(d: Omit<Debt, "id" | "paidAmount" | "createdAt" | "paidHistory">): Debt {
  const all = load<Debt>("t_debts");
  const n: Debt = { ...d, id: uid(), paidAmount: 0, createdAt: new Date().toISOString(), paidHistory: [] };
  all.push(n); save("t_debts", all); return n;
}
export function payDebt(id: string, amount: number): void {
  const all = load<Debt>("t_debts");
  const d = all.find(x => x.id === id);
  if (!d) return;
  d.paidAmount += amount;
  d.paidHistory.push({ amount, date: new Date().toISOString() });
  if (d.paidAmount >= d.totalAmount) {
    save("t_debts", all.filter(x => x.id !== id));
    return;
  }
  save("t_debts", all);
}
export function updateDebt(id: string, updates: Partial<Debt>): void {
  const all = load<Debt>("t_debts");
  const d = all.find(x => x.id === id);
  if (d) { Object.assign(d, updates); save("t_debts", all); }
}
export function deleteDebt(id: string): void {
  save("t_debts", load<Debt>("t_debts").filter(d => d.id !== id));
}
export function getTotalDebt(): number {
  return load<Debt>("t_debts").reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
}
