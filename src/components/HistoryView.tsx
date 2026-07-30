"use client";

import { useState, useEffect } from "react";
import { DaySummary } from "@/lib/types";
import { formatDateDisplay, formatCurrency, formatDate } from "@/lib/utils";
import DailyReportCard from "./DailyReportCard";

interface HistoryViewProps {
  onClose: () => void;
}

export default function HistoryView({ onClose }: HistoryViewProps) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(data => {
        // Filter out today (only show completed days)
        const today = formatDate(new Date());
        setDays(data.filter((d: DaySummary) => d.date !== today));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by month
  const groupedByMonth: Record<string, DaySummary[]> = {};
  days.forEach(d => {
    const [year, month] = d.date.split("-");
    const key = `${year}-${month}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(d);
  });

  const months = Object.keys(groupedByMonth).sort().reverse();

  const getMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          className="bg-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">📅 Lịch sử Daily Tracker</h2>
                <p className="text-white/70 text-sm">{days.length} ngày đã hoàn tất</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">✕</button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : days.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <span className="text-5xl block mb-3">📭</span>
                <p className="font-medium">Chưa có ngày nào hoàn tất</p>
                <p className="text-sm mt-1">Dữ liệu sẽ hiện ở đây khi kết thúc 1 ngày</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {months.map(monthKey => (
                  <div key={monthKey}>
                    <div className="sticky top-0 bg-bg px-4 py-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                      {getMonthLabel(monthKey)}
                    </div>
                    <div className="divide-y divide-border/50">
                      {groupedByMonth[monthKey].map(day => (
                        <button
                          key={day.date}
                          onClick={() => setViewDate(day.date)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg transition-colors text-left"
                        >
                          {/* Date */}
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-lg font-black text-primary leading-none">
                              {new Date(day.date + "T00:00:00").getDate()}
                            </span>
                            <span className="text-[9px] text-primary/70 uppercase">
                              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][new Date(day.date + "T00:00:00").getDay()]}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{formatDateDisplay(day.date)}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {day.mealsCount > 0 && (
                                <MiniTag emoji="🍽️" text={`${day.mealsCount}`} />
                              )}
                              {day.activitiesCount > 0 && (
                                <MiniTag emoji="📋" text={`${day.activitiesCount}`} />
                              )}
                              {day.trackCount > 0 && (
                                <MiniTag emoji="⏱️" text={`${day.trackCount}`} />
                              )}
                              {day.totalCalories > 0 && (
                                <MiniTag emoji="🔥" text={`${day.totalCalories}`} />
                              )}
                            </div>
                          </div>

                          {/* Expense */}
                          {day.expensesTotal > 0 && (
                            <div className="text-right shrink-0">
                              <div className="text-xs text-danger font-bold">{formatCurrency(day.expensesTotal)}</div>
                              <div className="text-[10px] text-text-muted">{day.expensesCount} khoản</div>
                            </div>
                          )}

                          <span className="text-text-muted">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily report modal */}
      {viewDate && (
        <DailyReportCard date={viewDate} onClose={() => setViewDate(null)} />
      )}
    </>
  );
}

function MiniTag({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 bg-bg px-1.5 py-0.5 rounded text-[10px] text-text-muted">
      <span>{emoji}</span>
      <span>{text}</span>
    </span>
  );
}
