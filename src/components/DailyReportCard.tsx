"use client";

import { useState, useEffect } from "react";
import { DailyReport, ACTIVITY_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";
import { formatDateFull, formatCurrency, formatDuration, getMealPeriod, formatTimeVN, durationBetween } from "@/lib/utils";

interface DailyReportCardProps {
  date: string;
  onClose: () => void;
}

const getCat = (v: string) => ACTIVITY_CATEGORIES.find(c => c.value === v);
const getExpCat = (v: string) => EXPENSE_CATEGORIES.find(c => c.value === v);

export default function DailyReportCard({ date, onClose }: DailyReportCardProps) {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/daily-report?date=${date}`)
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) return null;

  // Group meals by time period
  const mealsByPeriod: Record<string, typeof report.meals> = {};
  report.meals.forEach(m => {
    const period = getMealPeriod(m.time);
    const key = `${period.order}-${period.label}`;
    if (!mealsByPeriod[key]) mealsByPeriod[key] = [];
    mealsByPeriod[key].push(m);
  });
  const sortedMealPeriods = Object.entries(mealsByPeriod).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">📊 Báo cáo ngày</h2>
              <p className="text-white/70 text-sm">{formatDateFull(date)}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">✕</button>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
            {report.summary.totalCalories > 0 && (
              <StatBadge emoji="🔥" value={`${report.summary.totalCalories}`} label="calo" />
            )}
            {report.summary.totalTrackMinutes > 0 && (
              <StatBadge emoji="⏱️" value={formatDuration(report.summary.totalTrackMinutes)} label="track" />
            )}
            {report.summary.totalExpenses > 0 && (
              <StatBadge emoji="💸" value={formatCurrency(report.summary.totalExpenses)} label="" />
            )}
            <StatBadge emoji="🍽️" value={`${report.summary.mealsCount}`} label="bữa" />
            <StatBadge emoji="📋" value={`${report.summary.activitiesCount}`} label="việc" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Daily status */}
          {report.dailyStatus && (
            <div className="bg-indigo-50 rounded-xl p-3">
              <div className="text-xs font-bold text-indigo-600 mb-2">📝 Ghi chú ngày</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {report.dailyStatus.sleepHours && (
                  <span className="bg-white px-2 py-1 rounded-lg">💤 {(report.dailyStatus.sleepHours / 60).toFixed(1)}h ngủ</span>
                )}
                {report.dailyStatus.waterCups && (
                  <span className="bg-white px-2 py-1 rounded-lg">💧 {report.dailyStatus.waterCups} cốc nước</span>
                )}
                {report.dailyStatus.weight && (
                  <span className="bg-white px-2 py-1 rounded-lg">⚖️ {(report.dailyStatus.weight / 1000).toFixed(1)}kg</span>
                )}
              </div>
              {report.dailyStatus.dailyNote && (
                <p className="mt-2 text-sm text-indigo-700 italic">&ldquo;{report.dailyStatus.dailyNote}&rdquo;</p>
              )}
            </div>
          )}

          {/* Live Tracking Timeline */}
          {report.liveTracking.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">⏱️ Timeline hoạt động</div>
              <div className="bg-bg rounded-xl p-3 space-y-2">
                {report.liveTracking.map(track => {
                  const cat = getCat(track.category);
                  const dur = track.endedAt ? durationBetween(track.startedAt, track.endedAt) : 0;
                  return (
                    <div key={track.id} className="flex items-center gap-2">
                      <span className="text-lg">{cat?.emoji || "📋"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{track.title}</div>
                        <div className="text-[10px] text-text-muted">
                          {formatTimeVN(track.startedAt)}
                          {track.endedAt && ` → ${formatTimeVN(track.endedAt)}`}
                          {track.locationName && ` · 📍${track.locationName}`}
                        </div>
                      </div>
                      {dur > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {formatDuration(dur)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meals by Period */}
          {sortedMealPeriods.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">🍽️ Bữa ăn theo buổi</div>
              <div className="space-y-2">
                {sortedMealPeriods.map(([key, meals]) => {
                  const period = getMealPeriod(meals[0]?.time);
                  const periodCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
                  return (
                    <div key={key} className="bg-bg rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{period.emoji} {period.label}</span>
                        {periodCalories > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                            {periodCalories} cal
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {meals.map(meal => (
                          <div key={meal.id} className="flex items-center gap-2">
                            {meal.image ? (
                              <img src={meal.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <span className="w-8 text-center text-sm">🍽️</span>
                            )}
                            <span className="text-sm flex-1 truncate">{meal.foodName}</span>
                            {meal.time && <span className="text-[10px] text-text-muted">{meal.time}</span>}
                            {meal.calories && <span className="text-[10px] text-orange-600">{meal.calories}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activities */}
          {report.activities.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">📋 Hoạt động</div>
              <div className="bg-bg rounded-xl p-3 space-y-1.5">
                {report.activities.map(act => {
                  const cat = getCat(act.category);
                  return (
                    <div key={act.id} className="flex items-center gap-2">
                      <span className="text-sm">{cat?.emoji || "📋"}</span>
                      <span className="text-sm flex-1 truncate">{act.title}</span>
                      {act.startTime && (
                        <span className="text-[10px] text-text-muted">
                          {act.startTime}{act.endTime ? `–${act.endTime}` : ""}
                        </span>
                      )}
                      {act.durationMinutes && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                          {formatDuration(act.durationMinutes)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses */}
          {report.expenses.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">💰 Chi tiêu</div>
              <div className="bg-bg rounded-xl p-3 space-y-1.5">
                {report.expenses.map(exp => {
                  const cat = getExpCat(exp.category);
                  return (
                    <div key={exp.id} className="flex items-center gap-2">
                      {exp.image ? (
                        <img src={exp.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <span className="text-sm w-8 text-center">{cat?.emoji || "📦"}</span>
                      )}
                      <span className="text-sm flex-1 truncate">{exp.description}</span>
                      <span className="text-[10px] text-text-muted">{formatTimeVN(exp.createdAt)}</span>
                      <span className="text-xs font-bold text-danger">-{formatCurrency(exp.amount)}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                  <span className="text-sm font-bold">Tổng chi tiêu</span>
                  <span className="text-base font-black text-danger">{formatCurrency(report.summary.totalExpenses)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {report.meals.length === 0 && report.activities.length === 0 && report.expenses.length === 0 && report.liveTracking.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <span className="text-4xl block mb-2">📭</span>
              <p>Không có dữ liệu cho ngày này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <div className="shrink-0 bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
      <span>{emoji}</span>
      <span className="font-bold text-sm">{value}</span>
      {label && <span className="text-white/70 text-xs">{label}</span>}
    </div>
  );
}
