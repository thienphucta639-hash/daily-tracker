"use client";

import { useState, useEffect } from "react";
import { DailyStatusData } from "@/lib/types";

interface DailyStatusCardProps {
  status: DailyStatusData | null;
  date: string;
  onSave: () => void;
}

export default function DailyStatusCard({ status, date, onSave }: DailyStatusCardProps) {
  const [sleep, setSleep] = useState("");
  const [water, setWater] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSleep(status?.sleepHours ? String(status.sleepHours / 60) : "");
    setWater(status?.waterCups ? String(status.waterCups) : "");
    setWeight(status?.weight ? String(status.weight / 1000) : "");
    setNote(status?.dailyNote ?? "");
    setEditing(false);
  }, [status, date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/daily-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          sleepHours: sleep ? Math.round(parseFloat(sleep) * 60) : null,
          waterCups: water ? parseInt(water) : null,
          weight: weight ? Math.round(parseFloat(weight) * 1000) : null,
          dailyNote: note || null,
        }),
      });
      onSave();
      setEditing(false);
    } catch {
      alert("Lỗi khi lưu!");
    } finally {
      setSaving(false);
    }
  };

  // Inline compact display
  if (!editing) {
    const hasData = status && (status.sleepHours || status.waterCups || status.weight || status.dailyNote);
    return (
      <div
        className="flex items-center gap-2 flex-wrap cursor-pointer group"
        onClick={() => setEditing(true)}
      >
        {hasData ? (
          <>
            {status.sleepHours != null && status.sleepHours > 0 && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                💤 {(status.sleepHours / 60).toFixed(1)}h
              </span>
            )}
            {status.waterCups != null && status.waterCups > 0 && (
              <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                💧 {status.waterCups}
              </span>
            )}
            {status.weight != null && status.weight > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                ⚖️ {(status.weight / 1000).toFixed(1)}kg
              </span>
            )}
            {status.dailyNote && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs max-w-[200px] truncate">
                📝 {status.dailyNote}
              </span>
            )}
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">sửa</span>
          </>
        ) : (
          <button className="text-xs text-text-muted bg-bg hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-lg transition-colors">
            + Ghi chú ngày (ngủ, nước, cân...)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-3 shadow-sm animate-fade-in border border-border">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-text-muted block mb-0.5">💤 Ngủ (h)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="7.5"
            className="w-full px-2 py-1.5 rounded-lg bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-0.5">💧 Nước</label>
          <input
            type="number"
            min="0"
            max="30"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="8"
            className="w-full px-2 py-1.5 rounded-lg bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-0.5">⚖️ Cân (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="65"
            className="w-full px-2 py-1.5 rounded-lg bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-sm"
          />
        </div>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="📝 Ghi chú ngày..."
        className="w-full px-2 py-1.5 rounded-lg bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(false)}
          className="flex-1 py-1.5 rounded-lg bg-bg text-text-muted text-xs font-medium hover:bg-border transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}
