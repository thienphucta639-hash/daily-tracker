"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatCurrency, formatDuration, getTimeOfDay, getTimeOfDayEmoji, formatTimeVN, getMealPeriod } from "@/lib/utils";
import { DayData, ACTIVITY_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";
import DatePicker from "./DatePicker";
import DailyStatusCard from "./DailyStatusCard";
import LiveTracker from "./LiveTracker";
import AddMealForm from "./AddMealForm";
import AddActivityForm from "./AddActivityForm";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseInvoice from "./ExpenseInvoice";
import OfflineIndicator from "./OfflineIndicator";
import HistoryView from "./HistoryView";
import DailyReportCard from "./DailyReportCard";

export default function TrackerApp() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [viewImage, setViewImage] = useState<string | null>(null);

  const isToday = selectedDate === formatDate(new Date());

  const toggle = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?date=${selectedDate}`);
      setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("Xóa?")) return;
    await fetch(`/api/${type}/${id}`, { method: "DELETE" });
    fetchData();
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = base64;
    link.click();
  };

  const getCat = (c: string) => ACTIVITY_CATEGORIES.find(x => x.value === c);
  const getExpCat = (c: string) => EXPENSE_CATEGORIES.find(x => x.value === c);

  // Group meals by time period
  const getMealsByPeriod = () => {
    if (!data) return [];
    const grouped: Record<string, typeof data.meals> = {};
    data.meals.forEach(m => {
      const period = getMealPeriod(m.time);
      const key = `${period.order}-${period.label}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const mealsByPeriod = getMealsByPeriod();

  return (
    <div className="min-h-screen bg-bg">
      <OfflineIndicator onSync={fetchData} />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 pt-4 pb-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">📅 Daily Tracker</h1>
          <div className="flex items-center gap-2">
            {isToday && (
              <span className="text-white/60 text-xs">{getTimeOfDayEmoji()} {getTimeOfDay()}</span>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              📊 Lịch sử
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 -mt-2.5 pb-20 sm:pb-6 space-y-2.5">
        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {isToday && <LiveTracker onUpdate={fetchData} />}

        {/* Show daily report button for past days */}
        {!isToday && data && (data.meals.length > 0 || data.activities.length > 0 || data.expenses.length > 0) && (
          <button
            onClick={() => setShowDailyReport(true)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-shadow"
          >
            📊 Xem báo cáo ngày {selectedDate}
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Stats strip */}
            {(data.summary.totalCalories > 0 || data.summary.totalExpenses > 0 || data.summary.totalActivityMinutes > 0) && (
              <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
                {data.summary.totalCalories > 0 && <Pill>🔥 {data.summary.totalCalories} cal</Pill>}
                {data.summary.totalActivityMinutes > 0 && <Pill>⏱️ {formatDuration(data.summary.totalActivityMinutes)}</Pill>}
                {data.summary.totalExpenses > 0 && <Pill>💸 {formatCurrency(data.summary.totalExpenses)}</Pill>}
                <Pill>🍽️ {data.summary.mealsCount}</Pill>
                <Pill>📋 {data.summary.activitiesCount}</Pill>
              </div>
            )}

            <DailyStatusCard status={data.dailyStatus} date={selectedDate} onSave={fetchData} />

            {/* MEALS - grouped by period */}
            <Section
              title="Bữa ăn" emoji="🍽️" count={data.meals.length}
              collapsed={!!collapsed.meals} onToggle={() => toggle("meals")}
              onAdd={() => setShowAddMeal(true)}
            >
              {data.meals.length === 0 ? (
                <Empty text="Chưa có bữa ăn" />
              ) : (
                <div className="space-y-2">
                  {mealsByPeriod.map(([key, meals]) => {
                    const period = getMealPeriod(meals[0]?.time);
                    return (
                      <div key={key}>
                        <div className="text-[10px] font-bold text-text-muted mb-1">{period.emoji} {period.label}</div>
                        <div className="space-y-1">
                          {meals.map(meal => (
                            <div key={meal.id} className="flex items-start gap-1.5 py-0.5 group">
                              {meal.image ? (
                                <button
                                  onClick={() => setViewImage(meal.image)}
                                  className="w-9 h-9 rounded-lg overflow-hidden shrink-0 hover:ring-2 hover:ring-primary transition-all"
                                >
                                  <img src={meal.image} alt="" className="w-full h-full object-cover" />
                                </button>
                              ) : (
                                <span className="text-sm w-9 text-center">🍽️</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] truncate">{meal.foodName}</div>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                  {meal.time && <span>{meal.time}</span>}
                                  {meal.calories != null && meal.calories > 0 && (
                                    <span className="bg-orange-100 text-orange-600 px-1 rounded-full">{meal.calories}</span>
                                  )}
                                  {meal.image && (
                                    <button
                                      onClick={() => downloadImage(meal.image!, `meal-${meal.id}.jpg`)}
                                      className="text-blue-500 hover:underline"
                                    >📥</button>
                                  )}
                                </div>
                              </div>
                              <DelBtn onClick={() => handleDelete("meals", meal.id)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* ACTIVITIES */}
            <Section
              title="Hoạt động" emoji="📋" count={data.activities.length}
              collapsed={!!collapsed.activities} onToggle={() => toggle("activities")}
              onAdd={() => setShowAddActivity(true)}
            >
              {data.activities.length === 0 ? (
                <Empty text="Chưa có hoạt động" />
              ) : (
                <div className="space-y-0.5">
                  {data.activities.map(act => {
                    const cat = getCat(act.category);
                    return (
                      <div key={act.id} className="flex items-center gap-1.5 py-1 group">
                        <span className="text-sm">{cat?.emoji || "📋"}</span>
                        <span className="text-[13px] flex-1 truncate">{act.title}</span>
                        {act.startTime && (
                          <span className="text-[10px] text-text-muted shrink-0">
                            {act.startTime}{act.endTime ? `–${act.endTime}` : ""}
                          </span>
                        )}
                        {act.durationMinutes != null && act.durationMinutes > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded-full shrink-0">{formatDuration(act.durationMinutes)}</span>
                        )}
                        <DelBtn onClick={() => handleDelete("activities", act.id)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* EXPENSES */}
            <Section
              title="Chi tiêu" emoji="💰" count={data.expenses.length}
              collapsed={!!collapsed.expenses} onToggle={() => toggle("expenses")}
              onAdd={() => setShowAddExpense(true)}
              extra={
                data.summary.totalExpenses > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-danger">{formatCurrency(data.summary.totalExpenses)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowInvoice(true); }}
                      className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium hover:bg-primary/20"
                    >🧾</button>
                  </div>
                ) : undefined
              }
            >
              {data.expenses.length === 0 ? (
                <Empty text="Chưa có chi tiêu" />
              ) : (
                <div className="space-y-1">
                  {data.expenses.map(exp => {
                    const cat = getExpCat(exp.category);
                    return (
                      <div key={exp.id} className="flex items-start gap-1.5 py-0.5 group">
                        {exp.image ? (
                          <button
                            onClick={() => setViewImage(exp.image)}
                            className="w-9 h-9 rounded-lg overflow-hidden shrink-0 hover:ring-2 hover:ring-primary transition-all"
                          >
                            <img src={exp.image} alt="" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-sm w-9 text-center">{cat?.emoji || "📦"}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] truncate">{exp.description}</div>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted">
                            <span>{formatTimeVN(exp.createdAt)}</span>
                            {exp.image && (
                              <button
                                onClick={() => downloadImage(exp.image!, `receipt-${exp.id}.jpg`)}
                                className="text-blue-500 hover:underline"
                              >📥</button>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-danger whitespace-nowrap shrink-0">-{formatCurrency(exp.amount)}</span>
                        <DelBtn onClick={() => handleDelete("expenses", exp.id)} />
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/50">
                    <span className="text-[11px] text-text-muted font-medium">Tổng</span>
                    <span className="text-sm font-black text-danger">{formatCurrency(data.summary.totalExpenses)}</span>
                  </div>
                </div>
              )}
            </Section>
          </>
        ) : null}
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border py-1.5 sm:hidden z-30">
        <div className="flex justify-around max-w-xl mx-auto">
          <BtmBtn emoji="🍽️" label="Ăn" onClick={() => setShowAddMeal(true)} />
          <BtmBtn emoji="📋" label="Việc" onClick={() => setShowAddActivity(true)} />
          <BtmBtn emoji="💰" label="Chi" onClick={() => setShowAddExpense(true)} />
          <BtmBtn emoji="📊" label="Lịch sử" onClick={() => setShowHistory(true)} />
        </div>
      </div>

      {/* Modals */}
      {showAddMeal && <AddMealForm date={selectedDate} onSave={fetchData} onClose={() => setShowAddMeal(false)} />}
      {showAddActivity && <AddActivityForm date={selectedDate} onSave={fetchData} onClose={() => setShowAddActivity(false)} />}
      {showAddExpense && <AddExpenseForm date={selectedDate} onSave={fetchData} onClose={() => setShowAddExpense(false)} />}
      {showInvoice && data && <ExpenseInvoice expenses={data.expenses} date={selectedDate} onClose={() => setShowInvoice(false)} />}
      {showHistory && <HistoryView onClose={() => setShowHistory(false)} />}
      {showDailyReport && <DailyReportCard date={selectedDate} onClose={() => setShowDailyReport(false)} />}

      {/* Image viewer */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-lg w-full">
            <img src={viewImage} alt="" className="w-full rounded-lg" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(viewImage, `image-${Date.now()}.jpg`);
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
              >📥</button>
              <button
                onClick={() => setViewImage(null)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
              >✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 bg-surface shadow-sm px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap">
      {children}
    </span>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full text-[10px] text-text-muted hover:bg-danger/10 hover:text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
    >✕</button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-[11px] text-text-muted py-1.5 text-center">💡 {text} — nhấn + để thêm</p>;
}

function Section({
  title, emoji, count, collapsed, onToggle, onAdd, extra, children,
}: {
  title: string; emoji: string; count: number; collapsed: boolean;
  onToggle: () => void; onAdd: () => void; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center px-3 py-2">
        <button onClick={onToggle} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          <span className="text-sm">{emoji}</span>
          <span className="font-bold text-[13px]">{title}</span>
          {count > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
          {extra && <span className="ml-auto mr-1">{extra}</span>}
          <span className={`text-text-muted text-[10px] transition-transform ${collapsed ? "" : "rotate-180"}`}>▼</span>
        </button>
        <button
          onClick={onAdd}
          className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center hover:bg-primary-dark transition-colors shrink-0"
        >+</button>
      </div>
      {!collapsed && <div className="px-3 pb-2 animate-fade-in">{children}</div>}
    </div>
  );
}

function BtmBtn({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 py-0.5 rounded-lg active:scale-95 transition-transform">
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-medium text-text-muted">{label}</span>
    </button>
  );
}
