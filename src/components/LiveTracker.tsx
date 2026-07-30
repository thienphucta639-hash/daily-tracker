"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LiveTrack, ACTIVITY_CATEGORIES } from "@/lib/types";
import { formatTimeVN } from "@/lib/utils";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function durationBetween(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "<1p";
  if (mins < 60) return `${mins}p`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}p` : `${h}h`;
}

function getLocation(): Promise<{ lat: string; lng: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}

const getCat = (v: string) => ACTIVITY_CATEGORIES.find((c) => c.value === v);

export default function LiveTracker({ onUpdate }: { onUpdate?: () => void }) {
  const [active, setActive] = useState<LiveTrack | null>(null);
  const [recent, setRecent] = useState<LiveTrack[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/live-track");
      const json = await res.json();
      setActive(json.active);
      setRecent(json.recent);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  useEffect(() => {
    if (active) {
      const startMs = new Date(active.startedAt).getTime();
      const tick = () => setElapsed(Date.now() - startMs);
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setElapsed(0);
    }
  }, [active]);

  const startTracking = async (title: string, category: string) => {
    setStarting(true);
    try {
      const loc = await getLocation();
      await fetch("/api/live-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          latitude: loc?.lat || null,
          longitude: loc?.lng || null,
        }),
      });
      fetchLive();
      onUpdate?.();
    } catch { alert("Lỗi!"); }
    finally { setStarting(false); }
  };

  const stopTracking = async () => {
    await fetch("/api/live-track", { method: "PUT" });
    fetchLive();
    onUpdate?.();
  };

  const deleteTrack = async (id: number) => {
    await fetch(`/api/live-track/${id}`, { method: "DELETE" });
    fetchLive();
  };

  // === ACTIVE ===
  if (active) {
    const cat = getCat(active.category);
    return (
      <div className="space-y-2">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-3 text-white shadow-lg shadow-green-500/25">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-3xl">{cat?.emoji}</span>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{active.title}</div>
              <div className="text-white/70 text-xs flex items-center gap-1.5">
                <span>từ {formatTimeVN(active.startedAt)}</span>
                {active.locationName && <span>· 📍{active.locationName}</span>}
              </div>
            </div>
            <div className="font-mono font-black text-2xl tabular-nums tracking-tight">{formatElapsed(elapsed)}</div>
          </div>
          <div className="flex gap-2 mt-2.5">
            <button onClick={stopTracking} className="flex-1 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl text-xs font-bold transition-colors">
              ⏹ Dừng lại
            </button>
          </div>
          {/* Quick switch */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
            {ACTIVITY_CATEGORIES.filter(c => c.value !== active.category).slice(0, 7).map(c => (
              <button
                key={c.value}
                onClick={() => startTracking(c.label, c.value)}
                disabled={starting}
                className="shrink-0 bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg text-[11px] transition-colors disabled:opacity-50"
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Recent */}
        <RecentList recent={recent} onDelete={deleteTrack} onRestart={startTracking} starting={starting} />
      </div>
    );
  }

  // === IDLE ===
  return (
    <div className="space-y-2">
      <div className="bg-surface rounded-2xl p-3 shadow-sm border border-border">
        <div className="text-xs text-text-muted mb-2 font-medium">▶ Đang làm gì? Chọn để bắt đầu tracking:</div>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => startTracking(c.label, c.value)}
              disabled={starting}
              className="flex items-center gap-1 bg-bg hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-300 px-2.5 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50 active:scale-95"
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <RecentList recent={recent} onDelete={deleteTrack} onRestart={startTracking} starting={starting} />
    </div>
  );
}

function RecentList({ recent, onDelete, onRestart, starting }: {
  recent: LiveTrack[];
  onDelete: (id: number) => void;
  onRestart: (title: string, cat: string) => void;
  starting: boolean;
}) {
  if (recent.length === 0) return null;
  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Đã track</span>
      </div>
      <div className="divide-y divide-border/50">
        {recent.slice(0, 8).map(r => {
          const rc = getCat(r.category);
          return (
            <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 group">
              <button
                onClick={() => onRestart(r.title, r.category)}
                disabled={starting}
                className="text-text-muted hover:text-green-600 transition-colors text-xs disabled:opacity-50"
                title="Track lại"
              >▶</button>
              <span className="text-sm">{rc?.emoji}</span>
              <span className="text-xs flex-1 truncate">{r.title}</span>
              {r.locationName && (
                <span className="text-[10px] text-text-muted truncate max-w-[60px]">📍{r.locationName}</span>
              )}
              <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                {formatTimeVN(r.startedAt)}
              </span>
              {r.endedAt && (
                <span className="text-[10px] bg-bg text-text-muted px-1.5 py-0.5 rounded font-medium shrink-0">
                  {durationBetween(r.startedAt, r.endedAt)}
                </span>
              )}
              <button
                onClick={() => onDelete(r.id)}
                className="text-[10px] text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
