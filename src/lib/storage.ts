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
  return n;
}
export async function saveExpenseImage(expId: string, base64: string): Promise<void> {
  const { saveImage } = await import("./imgdb");
  await saveImage(`img_${expId}`, base64);
}
export function deleteExpense(id: string) {
  save("t_exps", load<Expense>("t_exps").filter(e => e.id !== id));
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
    return true;
  } catch { return false; }
}

// ═══ DAILY PLANNER — tasks/plans for a specific date ═══
export interface PlanItem {
  id: string;
  date: string;
  time: string | null;
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
  src.forEach(p => addPlan({ date: toDate, time: p.time, title: p.title, detail: p.detail, category: p.category, priority: p.priority || 0, budget: p.budget, sourceId: p.id }));
}
// Get dates that have plans
export function getPlanDates(): string[] {
  return Array.from(new Set(load<PlanItem>("t_plans").map(p => p.date))).sort().reverse();
}

// ═══ SCHEDULE TEMPLATES — reusable time blocks ═══
export interface Schedule {
  id: string;
  name: string; // e.g. "Gym", "Work day", "Weekend"
  items: ScheduleBlock[];
  createdAt: string;
}
export interface ScheduleBlock {
  time: string; // HH:mm
  endTime: string | null;
  title: string;
  category: string;
}

export function getSchedules(): Schedule[] { return load<Schedule>("t_schedules"); }
export function addSchedule(name: string, items: ScheduleBlock[]): Schedule {
  const all = load<Schedule>("t_schedules");
  const n: Schedule = { id: uid(), name, items, createdAt: new Date().toISOString() };
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
// Apply a schedule template to a date as plan items
export function applySchedule(scheduleId: string, date: string) {
  const s = getSchedules().find(x => x.id === scheduleId);
  if (!s) return;
  s.items.forEach(block => {
    addPlan({ date, time: block.time, title: block.title, detail: block.endTime ? `${block.time}–${block.endTime}` : null, category: block.category, priority: 0, budget: null });
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
