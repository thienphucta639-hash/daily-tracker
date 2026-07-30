"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatDate, formatCurrency, formatDuration, getTimeOfDay, getTimeOfDayEmoji,
  formatTimeVN, getMealPeriod, formatDateDisplay, getCurrentTimeHHMM, autoMealType,
  MEAL_TYPES, ACTIVITY_CATEGORIES, EXPENSE_CATEGORIES
} from "@/lib/utils";
import {
  getMeals, addMeal, deleteMeal,
  getActivities, addActivity, deleteActivity,
  getExpenses, addExpense, deleteExpense,
  getDailyStatus, saveDailyStatus,
  getLiveTracks, startLiveTrack, stopLiveTrack, deleteLiveTrack,
  getDaySummary, getHistory,
  Meal, Activity, Expense, DailyStatus, LiveTrack
} from "@/lib/storage";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyStatus, setDailyStatusState] = useState<DailyStatus | null>(null);
  const [liveActive, setLiveActive] = useState<LiveTrack | null>(null);
  const [liveRecent, setLiveRecent] = useState<LiveTrack[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [viewImage, setViewImage] = useState<string | null>(null);

  const isToday = selectedDate === formatDate(new Date());

  const loadData = useCallback(() => {
    const summary = getDaySummary(selectedDate);
    setMeals(summary.meals);
    setActivities(summary.activities);
    setExpenses(summary.expenses);
    setDailyStatusState(summary.dailyStatus);
    const live = getLiveTracks();
    setLiveActive(live.active);
    setLiveRecent(live.recent);
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Timer for live tracking
  useEffect(() => {
    if (liveActive) {
      const tick = () => setElapsed(Date.now() - new Date(liveActive.startedAt).getTime());
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [liveActive]);

  const toggle = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }));

  const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalActivityMinutes = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);

  // Group meals by period
  const mealsByPeriod: Record<string, Meal[]> = {};
  meals.forEach(m => {
    const p = getMealPeriod(m.time);
    const key = `${p.order}-${p.label}`;
    if (!mealsByPeriod[key]) mealsByPeriod[key] = [];
    mealsByPeriod[key].push(m);
  });

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const getCat = (c: string) => ACTIVITY_CATEGORIES.find(x => x.value === c);
  const getExpCat = (c: string) => EXPENSE_CATEGORIES.find(x => x.value === c);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 pt-4 pb-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-black">📅 Daily Tracker</h1>
          <div className="flex items-center gap-2">
            {isToday && <span className="text-white/60 text-xs">{getTimeOfDayEmoji()} {getTimeOfDay()}</span>}
            <button onClick={() => setShowHistory(true)} className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-xs font-medium">
              📊 Lịch sử
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 -mt-2.5 pb-20 space-y-2.5">
        {/* Date picker */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2 shadow-sm">
          <button onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(formatDate(d));
          }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-indigo-100">←</button>
          <div className="text-center">
            <div className="text-base font-bold">{formatDateDisplay(selectedDate)}</div>
            {isToday && <div className="text-[11px] text-slate-500">{getTimeOfDayEmoji()} {getTimeOfDay()}</div>}
          </div>
          <div className="flex gap-1">
            {!isToday && (
              <button onClick={() => setSelectedDate(formatDate(new Date()))} className="px-2.5 h-9 rounded-xl bg-indigo-100 text-indigo-600 text-xs font-medium">Nay</button>
            )}
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              if (d <= new Date()) setSelectedDate(formatDate(d));
            }} disabled={isToday} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-indigo-100 disabled:opacity-30">→</button>
          </div>
        </div>

        {/* Live tracking */}
        {isToday && (
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            {liveActive ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl">{getCat(liveActive.category)?.emoji}</span>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{liveActive.title}</div>
                    <div className="text-white/70 text-xs">từ {formatTimeVN(liveActive.startedAt)}</div>
                  </div>
                  <div className="font-mono font-black text-xl">{formatElapsed(elapsed)}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { stopLiveTrack(); loadData(); }} className="flex-1 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-bold">⏹ Dừng</button>
                </div>
                <div className="flex gap-1.5 mt-2 overflow-x-auto">
                  {ACTIVITY_CATEGORIES.filter(c => c.value !== liveActive.category).slice(0, 6).map(c => (
                    <button key={c.value} onClick={() => { startLiveTrack(c.label, c.value); loadData(); }}
                      className="shrink-0 bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg text-[11px]">{c.emoji}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-500 mb-2">▶ Đang làm gì? Chọn để bắt đầu:</div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => { startLiveTrack(c.label, c.value); loadData(); }}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-green-100 hover:text-green-700 px-2 py-1.5 rounded-lg text-xs">
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {liveRecent.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Đã track</div>
                {liveRecent.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-2 py-1 text-xs text-slate-500 group">
                    <button onClick={() => { startLiveTrack(r.title, r.category); loadData(); }} className="text-slate-400 hover:text-green-500">▶</button>
                    <span>{getCat(r.category)?.emoji}</span>
                    <span className="flex-1 truncate">{r.title}</span>
                    <span className="text-[10px]">{formatTimeVN(r.startedAt)}</span>
                    <button onClick={() => { deleteLiveTrack(r.id); loadData(); }} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {(totalCalories > 0 || totalExpenses > 0 || totalActivityMinutes > 0) && (
          <div className="flex gap-1.5 overflow-x-auto">
            {totalCalories > 0 && <Pill>🔥 {totalCalories} cal</Pill>}
            {totalActivityMinutes > 0 && <Pill>⏱️ {formatDuration(totalActivityMinutes)}</Pill>}
            {totalExpenses > 0 && <Pill>💸 {formatCurrency(totalExpenses)}</Pill>}
            <Pill>🍽️ {meals.length}</Pill>
            <Pill>📋 {activities.length}</Pill>
          </div>
        )}

        {/* Daily status */}
        <DailyStatusSection status={dailyStatus} date={selectedDate} onSave={() => loadData()} />

        {/* Meals */}
        <Section title="Bữa ăn" emoji="🍽️" count={meals.length} collapsed={!!collapsed.meals}
          onToggle={() => toggle("meals")} onAdd={() => setShowAddMeal(true)}>
          {meals.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {Object.entries(mealsByPeriod).sort((a, b) => a[0].localeCompare(b[0])).map(([key, ms]) => {
                const p = getMealPeriod(ms[0]?.time);
                return (
                  <div key={key}>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">{p.emoji} {p.label}</div>
                    {ms.map(meal => (
                      <div key={meal.id} className="flex items-start gap-1.5 py-0.5 group">
                        {meal.image ? (
                          <button onClick={() => setViewImage(meal.image)} className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                            <img src={meal.image} className="w-full h-full object-cover" />
                          </button>
                        ) : <span className="w-9 text-center text-sm">🍽️</span>}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] truncate">{meal.foodName}</div>
                          <div className="flex gap-2 text-[10px] text-slate-400">
                            {meal.time && <span>{meal.time}</span>}
                            {meal.calories && <span className="bg-orange-100 text-orange-600 px-1 rounded-full">{meal.calories}</span>}
                          </div>
                        </div>
                        <button onClick={() => { deleteMeal(meal.id); loadData(); }}
                          className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Activities */}
        <Section title="Hoạt động" emoji="📋" count={activities.length} collapsed={!!collapsed.activities}
          onToggle={() => toggle("activities")} onAdd={() => setShowAddActivity(true)}>
          {activities.length === 0 ? <Empty /> : (
            <div className="space-y-0.5">
              {activities.map(act => (
                <div key={act.id} className="flex items-center gap-1.5 py-1 group">
                  <span className="text-sm">{getCat(act.category)?.emoji || "📋"}</span>
                  <span className="text-[13px] flex-1 truncate">{act.title}</span>
                  {act.startTime && <span className="text-[10px] text-slate-400">{act.startTime}{act.endTime ? `–${act.endTime}` : ""}</span>}
                  {act.durationMinutes && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded-full">{formatDuration(act.durationMinutes)}</span>}
                  <button onClick={() => { deleteActivity(act.id); loadData(); }}
                    className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Expenses */}
        <Section title="Chi tiêu" emoji="💰" count={expenses.length} collapsed={!!collapsed.expenses}
          onToggle={() => toggle("expenses")} onAdd={() => setShowAddExpense(true)}
          extra={totalExpenses > 0 ? <span className="text-xs font-bold text-red-500">{formatCurrency(totalExpenses)}</span> : undefined}>
          {expenses.length === 0 ? <Empty /> : (
            <div className="space-y-1">
              {expenses.map(exp => (
                <div key={exp.id} className="flex items-start gap-1.5 py-0.5 group">
                  {exp.image ? (
                    <button onClick={() => setViewImage(exp.image)} className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                      <img src={exp.image} className="w-full h-full object-cover" />
                    </button>
                  ) : <span className="w-9 text-center text-sm">{getExpCat(exp.category)?.emoji || "📦"}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">{exp.description}</div>
                    <div className="text-[10px] text-slate-400">{formatTimeVN(exp.createdAt)}</div>
                  </div>
                  <span className="text-[11px] font-bold text-red-500">-{formatCurrency(exp.amount)}</span>
                  <button onClick={() => { deleteExpense(exp.id); loadData(); }}
                    className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 mt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Tổng</span>
                <span className="text-sm font-black text-red-500">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t py-1.5 sm:hidden z-30">
        <div className="flex justify-around max-w-xl mx-auto">
          <BtmBtn emoji="🍽️" label="Ăn" onClick={() => setShowAddMeal(true)} />
          <BtmBtn emoji="📋" label="Việc" onClick={() => setShowAddActivity(true)} />
          <BtmBtn emoji="💰" label="Chi" onClick={() => setShowAddExpense(true)} />
          <BtmBtn emoji="📊" label="Lịch sử" onClick={() => setShowHistory(true)} />
        </div>
      </div>

      {/* Modals */}
      {showAddMeal && <AddMealModal date={selectedDate} onSave={loadData} onClose={() => setShowAddMeal(false)} />}
      {showAddActivity && <AddActivityModal date={selectedDate} onSave={loadData} onClose={() => setShowAddActivity(false)} />}
      {showAddExpense && <AddExpenseModal date={selectedDate} onSave={loadData} onClose={() => setShowAddExpense(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onSelect={(d) => { setSelectedDate(d); setShowHistory(false); }} />}

      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="relative max-w-lg w-full">
            <img src={viewImage} className="w-full rounded-lg" />
            <button onClick={() => setViewImage(null)} className="absolute top-2 right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Components =====

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 bg-white shadow-sm px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap">{children}</span>;
}

function Empty() {
  return <p className="text-[11px] text-slate-400 py-1.5 text-center">💡 Chưa có — nhấn + để thêm</p>;
}

function Section({ title, emoji, count, collapsed, onToggle, onAdd, extra, children }: {
  title: string; emoji: string; count: number; collapsed: boolean;
  onToggle: () => void; onAdd: () => void; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center px-3 py-2">
        <button onClick={onToggle} className="flex items-center gap-1.5 flex-1 text-left">
          <span className="text-sm">{emoji}</span>
          <span className="font-bold text-[13px]">{title}</span>
          {count > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
          {extra && <span className="ml-auto mr-1">{extra}</span>}
          <span className={`text-slate-400 text-[10px] transition-transform ${collapsed ? "" : "rotate-180"}`}>▼</span>
        </button>
        <button onClick={onAdd} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center hover:bg-indigo-600">+</button>
      </div>
      {!collapsed && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

function BtmBtn({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 py-0.5 active:scale-95">
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </button>
  );
}

function DailyStatusSection({ status, date, onSave }: { status: DailyStatus | null; date: string; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [sleep, setSleep] = useState(status?.sleepHours ? String(status.sleepHours / 60) : "");
  const [water, setWater] = useState(status?.waterCups ? String(status.waterCups) : "");
  const [weight, setWeight] = useState(status?.weight ? String(status.weight / 1000) : "");
  const [note, setNote] = useState(status?.dailyNote || "");

  useEffect(() => {
    setSleep(status?.sleepHours ? String(status.sleepHours / 60) : "");
    setWater(status?.waterCups ? String(status.waterCups) : "");
    setWeight(status?.weight ? String(status.weight / 1000) : "");
    setNote(status?.dailyNote || "");
    setEditing(false);
  }, [status, date]);

  const save = () => {
    saveDailyStatus({
      date,
      sleepHours: sleep ? Math.round(parseFloat(sleep) * 60) : null,
      waterCups: water ? parseInt(water) : null,
      weight: weight ? Math.round(parseFloat(weight) * 1000) : null,
      dailyNote: note || null,
    });
    onSave();
    setEditing(false);
  };

  if (!editing) {
    const hasData = status && (status.sleepHours || status.waterCups || status.weight || status.dailyNote);
    return (
      <div onClick={() => setEditing(true)} className="flex items-center gap-2 flex-wrap cursor-pointer group">
        {hasData ? (
          <>
            {status.sleepHours && <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs">💤 {(status.sleepHours / 60).toFixed(1)}h</span>}
            {status.waterCups && <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded-lg text-xs">💧 {status.waterCups}</span>}
            {status.weight && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs">⚖️ {(status.weight / 1000).toFixed(1)}kg</span>}
            {status.dailyNote && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs truncate max-w-[150px]">📝 {status.dailyNote}</span>}
            <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100">sửa</span>
          </>
        ) : (
          <button className="text-xs text-slate-400 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 px-3 py-1.5 rounded-lg">+ Ghi chú ngày</button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input type="number" step="0.5" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="💤 Ngủ (h)" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center" />
        <input type="number" value={water} onChange={e => setWater(e.target.value)} placeholder="💧 Nước" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center" />
        <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="⚖️ Cân (kg)" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center" />
      </div>
      <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="📝 Ghi chú..." className="w-full px-2 py-1.5 rounded-lg bg-slate-100 text-sm mb-2" />
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">Hủy</button>
        <button onClick={save} className="flex-1 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium">Lưu</button>
      </div>
    </div>
  );
}

function AddMealModal({ date, onSave, onClose }: { date: string; onSave: () => void; onClose: () => void }) {
  const [mealType, setMealType] = useState(autoMealType());
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [time, setTime] = useState(getCurrentTimeHHMM());
  const [image, setImage] = useState<string | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!foodName.trim()) return;
    addMeal({ date, mealType, foodName: foodName.trim(), calories: calories ? parseInt(calories) : null, time, notes: null, image });
    onSave();
    onClose();
  };

  return (
    <Modal onClose={onClose} title="🍽️ Thêm bữa ăn">
      <div className="flex gap-1.5 mb-3">
        {MEAL_TYPES.map(mt => (
          <button key={mt.value} onClick={() => setMealType(mt.value)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium ${mealType === mt.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            <div className="text-base">{mt.emoji}</div>{mt.label}
          </button>
        ))}
      </div>
      {image ? (
        <div className="relative mb-3">
          <img src={image} className="w-full h-32 object-cover rounded-xl" />
          <button onClick={() => setImage(null)} className="absolute top-1 right-1 w-7 h-7 bg-black/50 text-white rounded-full text-xs">✕</button>
        </div>
      ) : (
        <label className="block mb-3 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-center text-sm text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500">
          📷 Chụp ảnh món ăn
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
        </label>
      )}
      <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)} placeholder="Tên món ăn" autoFocus
        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2" />
      <div className="flex gap-2 mb-3">
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm" />
        <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="🔥 Calo" className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm" />
      </div>
      <button onClick={submit} disabled={!foodName.trim()} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Modal>
  );
}

function AddActivityModal({ date, onSave, onClose }: { date: string; onSave: () => void; onClose: () => void }) {
  const [category, setCategory] = useState("work");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    addActivity({ date, category, title: title.trim(), description: null, durationMinutes: duration ? parseInt(duration) : null, startTime: startTime || null, endTime: null });
    onSave();
    onClose();
  };

  return (
    <Modal onClose={onClose} title="📋 Thêm hoạt động">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ACTIVITY_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-2 py-1.5 rounded-lg text-xs ${category === c.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề hoạt động" autoFocus
        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2" />
      <div className="flex gap-2 mb-3">
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="Bắt đầu" className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm" />
        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="⏱️ Phút" className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm" />
      </div>
      <button onClick={submit} disabled={!title.trim()} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Modal>
  );
}

function AddExpenseModal({ date, onSave, onClose }: { date: string; onSave: () => void; onClose: () => void }) {
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!description.trim() || !amount) return;
    addExpense({ date, category, description: description.trim(), amount: parseInt(amount), image });
    onSave();
    onClose();
  };

  return (
    <Modal onClose={onClose} title="💰 Thêm chi tiêu">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXPENSE_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-2 py-1.5 rounded-lg text-xs ${category === c.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      {image ? (
        <div className="relative mb-3">
          <img src={image} className="w-full h-32 object-cover rounded-xl" />
          <button onClick={() => setImage(null)} className="absolute top-1 right-1 w-7 h-7 bg-black/50 text-white rounded-full text-xs">✕</button>
        </div>
      ) : (
        <label className="block mb-3 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-center text-sm text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500">
          🧾 Chụp hóa đơn
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
        </label>
      )}
      <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả" autoFocus
        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2" />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="💵 Số tiền (VNĐ)"
        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-1 text-lg font-bold" />
      {amount && <p className="text-xs text-slate-400 mb-3 text-right">= {formatCurrency(parseInt(amount) || 0)}</p>}
      <button onClick={submit} disabled={!description.trim() || !amount} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Modal>
  );
}

function HistoryModal({ onClose, onSelect }: { onClose: () => void; onSelect: (date: string) => void }) {
  const history = getHistory().filter(d => d.date !== formatDate(new Date()));

  return (
    <Modal onClose={onClose} title="📊 Lịch sử">
      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <span className="text-4xl block mb-2">📭</span>
          <p>Chưa có dữ liệu</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto -mx-4 px-4">
          {history.map(day => (
            <button key={day.date} onClick={() => onSelect(day.date)}
              className="w-full flex items-center gap-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 text-left">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex flex-col items-center justify-center">
                <span className="text-base font-black text-indigo-600 leading-none">{new Date(day.date).getDate()}</span>
                <span className="text-[8px] text-indigo-400 uppercase">{["CN","T2","T3","T4","T5","T6","T7"][new Date(day.date).getDay()]}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{formatDateDisplay(day.date)}</div>
                <div className="flex gap-1.5 mt-0.5">
                  {day.mealsCount > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🍽️ {day.mealsCount}</span>}
                  {day.activitiesCount > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">📋 {day.activitiesCount}</span>}
                  {day.totalCalories > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🔥 {day.totalCalories}</span>}
                </div>
              </div>
              {day.expensesTotal > 0 && (
                <div className="text-right">
                  <div className="text-xs text-red-500 font-bold">{formatCurrency(day.expensesTotal)}</div>
                </div>
              )}
              <span className="text-slate-300">→</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
