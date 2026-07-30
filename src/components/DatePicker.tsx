"use client";

import { formatDateDisplay, formatDate, getTimeOfDay, getTimeOfDayEmoji } from "@/lib/utils";

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const goToPrev = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    onDateChange(formatDate(d));
  };

  const goToNext = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const today = formatDate(new Date());
    const nextDate = formatDate(d);
    if (nextDate <= today) onDateChange(nextDate);
  };

  const isToday = selectedDate === formatDate(new Date());

  return (
    <div className="flex items-center justify-between bg-surface rounded-2xl px-3 py-2 shadow-sm">
      <button
        onClick={goToPrev}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg hover:bg-primary/10 transition-colors"
      >
        ←
      </button>

      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-base font-bold text-text leading-tight">
            {formatDateDisplay(selectedDate)}
          </div>
          {isToday && (
            <div className="text-[11px] text-text-muted">
              {getTimeOfDayEmoji()} {getTimeOfDay()}
            </div>
          )}
        </div>
        <input
          type="date"
          value={selectedDate}
          max={formatDate(new Date())}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="w-6 h-6 opacity-0 absolute"
          style={{ position: "relative" }}
        />
      </div>

      <div className="flex gap-1">
        {!isToday && (
          <button
            onClick={() => onDateChange(formatDate(new Date()))}
            className="px-2.5 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            Nay
          </button>
        )}
        <button
          onClick={goToNext}
          disabled={isToday}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
