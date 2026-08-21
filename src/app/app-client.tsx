"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  formatDate, fmtDateDisp, fmtDateFull, fmtCurrency, fmtDur, fmtTimeVN, fmtElapsed,
  getTimeOfDay, getTimeEmoji, nowHHMM, autoMealType, mealPeriod, parseMoney,
  MEALS, ACTS, EXPS, CAT_ICONS,
} from "@/lib/utils";
import * as S from "@/lib/storage";
import { migrateTimezone } from "@/lib/migrate";
import { migrateImages, resolveImage, saveImage } from "@/lib/imgdb";
import FinanceTools from "./finance-tools";

/* ═══ ICONS ═══ */
function Ic({ d, size = 18, sw = 1.8, cls }: { d: string; size?: number; sw?: number; cls?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d={d} /></svg>;
}
// Category icon — SVG if available, fallback to emoji
function CI({ cat, size = 14 }: { cat: string; size?: number }) {
  const icon = CAT_ICONS[cat];
  if (icon) return <Ic d={icon} size={size} sw={1.6} cls="text-mute shrink-0" />;
  const a = ACTS.find(x => x.value === cat) || EXPS.find(x => x.value === cat);
  return <span className="shrink-0" style={{ fontSize: size * 0.85 }}>{a?.emoji || "•"}</span>;
}
const P = {
  plus: "M12 5v14M5 12h14", x: "M18 6 6 18M6 6l12 12", left: "m15 18-6-6 6-6", right: "m9 18 6-6-6-6", down: "m6 9 6 6 6-6",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  fork: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  clip: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z",
  dl: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  ul: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  receipt: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 7h8M8 11h8M8 15h5",
  stop: "M6 4h4v16H6zM14 4h4v16h-4z", cam: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  play: "m5 3 14 9-14 9z", check: "M20 6 9 17l-5-5", pin: "M12 17v5M9 11V6a3 3 0 0 1 6 0v5M5 11h14v2H5z",
  drop: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z", clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  note: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
};

export default function App() {
  const [ok, setOk] = useState(false);
  const [date, setDate] = useState(formatDate(new Date()));
  const [meals, setMeals] = useState<S.Meal[]>([]);
  const [acts, setActs] = useState<S.Activity[]>([]);
  const [exps, setExps] = useState<S.Expense[]>([]);
  const [status, setStatus] = useState<S.DailyStatus | null>(null);
  const [live, setLive] = useState<S.LiveTrack | null>(null);
  const [liveR, setLiveR] = useState<S.LiveTrack[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [modal, setModal] = useState<string | null>(null);
  const [col, setCol] = useState<Record<string, boolean>>({ me: true, e: true });
  const [img, setImg] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [streakBroken, setStreakBroken] = useState<string | null>(null);
  const [habits, setHabits] = useState<S.Habit[]>([]);
  const [habitChecks, setHabitChecks] = useState<S.HabitCheck[]>([]);
  const [qnotes, setQnotes] = useState<S.QuickNote[]>([]);
  const [pomoSessions, setPomoSessions] = useState<S.PomodoroSession[]>([]);
  const [plans, setPlans] = useState<S.PlanItem[]>([]);
  const [tab, setTab] = useState<"main" | "exp" | "plan">("main");
  const [now, setNow] = useState(Date.now());
  // Timer state lifted to top so it shows in header
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMsLeft, setTimerMsLeft] = useState(0);
  const [timerSetting, setTimerSetting] = useState(false);
  const [timerCustom, setTimerCustom] = useState("25");
  const [timerLabel, setTimerLabel] = useState("");
  const timerTotalMin = useRef(25);
  const timerEnd = useRef(0);
  const timerDone = useRef(false);

  const isToday = date === formatDate(new Date());
  const isPastDay = date < formatDate(new Date());
  const tog = (k: string) => setCol(p => ({ ...p, [k]: !p[k] }));

  const reload = useCallback(() => {
    setMeals(S.getMeals(date)); setActs(S.getActivities(date)); setExps(S.getExpenses(date));
    setStatus(S.getDailyStatus(date));
    const sv2 = S.getStreakV2(); setStreak(sv2.currentStreak); setStreakBroken(sv2.brokenAt);
    const l = S.getLiveTracks();
    setLive(l.active);
    // Only show tracked sessions that belong to the currently viewed date
    setLiveR(l.recent.filter(r => formatDate(new Date(r.startedAt)) === date));
    setHabits(S.getHabitsForDate(date)); setHabitChecks(S.getHabitChecks(date));
    setQnotes(S.getQuickNotes(date)); setPomoSessions(S.getPomoSessions(date));
    setPlans(S.getPlans(date));
  }, [date]);

  // Image cache: resolved IDB refs → base64
  const [imgCache, setImgCache] = useState<Record<string, string>>({});

  useEffect(() => {
    migrateTimezone();
    migrateImages().then(() => {
      setTimeout(() => setOk(true), 2000);
    }).catch(() => setTimeout(() => setOk(true), 2000));
  }, []);
  useEffect(() => { if (ok) reload(); }, [ok, reload]);

  // Resolve IDB image refs whenever meals/exps change
  useEffect(() => {
    const refs: { id: string; ref: string }[] = [];
    meals.forEach(m => { if (m.image && m.image.startsWith("idb:")) refs.push({ id: m.id, ref: m.image }); });
    exps.forEach(e => { if (e.image && e.image.startsWith("idb:")) refs.push({ id: e.id, ref: e.image }); });
    if (refs.length === 0) return;
    let cancelled = false;
    Promise.all(refs.map(async r => {
      const data = await resolveImage(r.ref);
      return { id: r.id, data };
    })).then(results => {
      if (cancelled) return;
      const cache: Record<string, string> = {};
      results.forEach(r => { if (r.data) cache[r.id] = r.data; });
      setImgCache(prev => ({ ...prev, ...cache }));
    });
    return () => { cancelled = true; };
  }, [meals, exps]);
  useEffect(() => {
    if (!live) { setElapsed(0); return; }
    const tick = () => setElapsed(Date.now() - new Date(live.startedAt).getTime());
    tick(); const i = setInterval(tick, 1000);
    // Wake Lock — keep screen on while tracking
    let wl: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen").then(s => { wl = s; }).catch(() => {});
    }
    return () => { clearInterval(i); if (wl) wl.release().catch(() => {}); };
  }, [live]);

  // Global iPhone keyboard fix: any focused input auto-scrolls into visible area
  useEffect(() => {
    const onFocusIn = (ev: FocusEvent) => {
      const t = ev.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;
      const ensureVisible = () => {
        t.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        window.scrollBy({ top: -80, behavior: "smooth" });
      };
      setTimeout(ensureVisible, 120);
      setTimeout(ensureVisible, 320);
      setTimeout(ensureVisible, 520);
    };
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, []);

  // Refs so rAF callback always sees latest values
  const timerLabelRef = useRef(timerLabel);
  timerLabelRef.current = timerLabel;
  const dateRef = useRef(date);
  dateRef.current = date;
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  // Single rAF loop — always runs for clock, also handles timer
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      if (timerEnd.current > 0 && !timerDone.current) {
        const rem = timerEnd.current - Date.now();
        if (rem <= 0) {
          timerDone.current = true;
          setTimerMsLeft(0);
          setTimerRunning(false);
          timerEnd.current = 0;
          playAlarm();
          const mins = timerTotalMin.current;
          const lbl = timerLabelRef.current || "Focus";
          S.addPomoSession(dateRef.current, lbl, mins);
          S.addActivity({ date: dateRef.current, category: "work", title: `⏰ ${lbl} (${mins}p)`, description: null, durationMinutes: mins, startTime: null, endTime: null });
          reloadRef.current();
        } else {
          setTimerMsLeft(rem);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // empty deps — runs once, uses refs

  const startTimer = (mins: number) => {
    timerTotalMin.current = mins;
    timerDone.current = false;
    const ms = mins * 60 * 1000;
    timerEnd.current = Date.now() + ms;
    setTimerMsLeft(ms);
    setTimerRunning(true);
    setTimerSetting(false);
  };
  const stopTimer = () => {
    setTimerRunning(false);
    setTimerMsLeft(0);
    timerEnd.current = 0;
    timerDone.current = true;
  };

  const fmtClock = (ts: number) => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return { h, m, s };
  };

  const fmtCountdown = (ms: number) => {
    const totalS = Math.floor(ms / 1000);
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;
    const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
    const time = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return { time, cs };
  };

  const del = (t: string, id: string) => {
    if (isPastDay) return;
    if (!confirm("Xóa?")) return;
    if (t === "m") {
      // Find matching auto-created expense and delete it too
      const meal = meals.find(m => m.id === id);
      if (meal?.price && meal.price > 0) {
        const matchExp = exps.find(e => e.mealId === meal.id) || exps.find(e => !e.mealId && e.category === "food" && e.description === meal.foodName && e.amount === meal.price);
        if (matchExp) S.deleteExpense(matchExp.id);
      }
      S.deleteMeal(id);
    }
    if (t === "a") S.deleteActivity(id);
    if (t === "e") S.deleteExpense(id);
    reload();
  };
  const totCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totExp = exps.reduce((s, e) => s + e.amount, 0);
  const totAct = acts.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const weekStats = ok ? S.getWeekStats() : [];
  const wMax = Math.max(...weekStats.map(w => w.expense), 1);
  const wTot = weekStats.reduce((s, w) => s + w.expense, 0);
  const allDataDates = ok ? S.getAllDataDates() : [];
  const curIdx = allDataDates.indexOf(date);
  const prevDataDate = curIdx > 0 ? allDataDates[curIdx - 1] : null;
  const nextDataDate = curIdx >= 0 && curIdx < allDataDates.length - 1 ? allDataDates[curIdx + 1] : null;

  const mp: Record<string, S.Meal[]> = {};
  meals.forEach(m => { const p = mealPeriod(m.time); const k = `${p.order}|${p.label}|${p.emoji}`; if (!mp[k]) mp[k] = []; mp[k].push(m); });
  const gc = (v: string) => ACTS.find(x => x.value === v);
  const ge = (v: string) => EXPS.find(x => x.value === v);

  // Get displayable image: from cache (IDB) or inline base64
  const getImg = (id: string, raw: string | null): string | null => {
    if (!raw) return null;
    if (raw.startsWith("idb:")) return imgCache[id] || null;
    return raw; // inline base64
  };

  if (!ok) return (
    <div className="min-h-screen flex items-center justify-center bg-bg overflow-hidden">
      <div className="text-center">
        {/* Main title — cinematic reveal */}
        <div style={{ animation: "splashIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <div className="font-bold text-4xl sm:text-5xl uppercase tracking-[0.3em] text-ink" style={{ letterSpacing: "0.3em" }}>Jay</div>
          <div className="font-bold text-4xl sm:text-5xl uppercase tracking-[0.3em] text-ink" style={{ letterSpacing: "0.3em", marginTop: -4 }}>Tracker</div>
        </div>
        {/* Accent line */}
        <div className="mx-auto mt-3 h-[2px] bg-gradient-to-r from-transparent via-ink/60 to-transparent rounded-full" style={{ animation: "lineExpand 0.6s ease-out 0.4s both" }} />
        {/* Tagline */}
        <div className="text-[11px] text-mute mt-3 uppercase tracking-[0.15em]" style={{ animation: "fadeUp 0.5s ease-out 0.7s both" }}>track everything · every day</div>
        {/* Loading bar */}
        <div className="w-32 h-[2px] bg-line rounded-full mx-auto mt-5 overflow-hidden" style={{ animation: "fadeUp 0.3s ease-out 1s both" }}>
          <div className="h-full bg-ink rounded-full" style={{ animation: "loadBar 1.2s ease-in-out 1s both" }} />
        </div>
      </div>
      {/* Screen fade out */}
      <div className="absolute inset-0 bg-bg pointer-events-none" style={{ animation: "screenFade 0.3s ease-in 1.7s both" }} />
      <style>{`
        @keyframes splashIn { from { opacity:0; transform: scale(0.85) translateY(12px); filter: blur(8px); } to { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes lineExpand { from { width:0; } to { width: 120px; } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        @keyframes loadBar { from { width:0; } to { width:100%; } }
        @keyframes screenFade { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* STICKY HEADER — clock + timer always visible */}
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="max-w-xl mx-auto px-3 pt-2 pb-2">
          {/* Row 1: name + clock + history */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight uppercase">Jay Tracker</h1>
              {streak > 0 && <span className="flex items-center gap-0.5 bg-gold/15 text-gold px-1.5 py-0.5 rounded text-[10px] font-bold tnum"><Ic d={P.flame} size={11} sw={2.5} />{streak}</span>}
              {streakBroken && (() => {
                const hrs = Math.max(0, 48 - Math.round((Date.now() - new Date(streakBroken).getTime()) / 3600000));
                return <button onClick={() => { S.recoverStreak(); reload(); }} className="flex items-center gap-1 bg-red/15 text-red border border-red/30 px-1.5 py-0.5 rounded text-[9px] font-bold a-blink active:scale-95">Hồi phục ({hrs}h)</button>;
              })()}
            </div>
            <div className="flex items-center gap-2">
              {/* LIVE CLOCK — always running */}
              {(() => { const c = fmtClock(now); return (
                <div className="flex items-baseline gap-0.5 tnum">
                  <span className="text-lg font-bold tracking-tight text-ink">{c.h}:{c.m}</span>
                  <span className="text-[10px] text-mute font-semibold">:{c.s}</span>
                </div>
              ); })()}
              <button onClick={() => setModal("hist")} className="w-7 h-7 rounded-lg bg-card border border-line hover:border-mute flex items-center justify-center text-mute hover:text-ink transition-colors"><Ic d={P.calendar} size={14} /></button>
            </div>
          </div>

          {/* Row 2: Timer countdown OR timer setup button */}
          {timerRunning ? (() => {
            const cd = fmtCountdown(timerMsLeft);
            const urgent = timerMsLeft < 10000;
            return (
              <div className={`flex items-center gap-2 mt-1.5 rounded-lg px-2.5 py-1.5 ${urgent ? "bg-red/15 border border-red/30" : "bg-card border border-line"}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${urgent ? "bg-red a-blink" : "bg-gold a-blink"}`} />
                <span className="text-[10px] text-mute truncate flex-1">{timerLabel || "Focus"} · {timerTotalMin.current}p</span>
                <span className={`font-bold text-base tnum tracking-tight ${urgent ? "text-red" : "text-ink"}`}>{cd.time}</span>
                <span className="text-[9px] text-mute tnum">.{cd.cs}</span>
                <button onClick={stopTimer} className="text-red text-[10px] font-bold ml-1 active:scale-95">Hủy</button>
              </div>
            );
          })() : timerSetting ? (
            <div className="mt-1.5 bg-card rounded-lg border border-line p-2">
              <input type="text" value={timerLabel} onChange={e => setTimerLabel(e.target.value)} placeholder="Việc gì..." className="w-full px-2 py-1 rounded-md bg-bg2 border border-line text-xs outline-none focus:border-ink mb-1.5" />
              <div className="grid grid-cols-5 gap-1 mb-1.5">
                {[1, 3, 5, 10, 15, 25, 30, 45, 60, 90].map(m => (
                  <button key={m} onClick={() => setTimerCustom(String(m))}
                    className={`py-1.5 rounded-md text-[10px] font-bold transition-all min-h-[36px] ${timerCustom === String(m) ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}>{m}p</button>
                ))}
              </div>
              <div className="flex gap-1.5 items-center">
                <input type="number" value={timerCustom} onChange={e => setTimerCustom(e.target.value)} min="1" className="w-12 px-1.5 py-1 rounded-md bg-bg2 border border-line text-xs text-center outline-none tnum" />
                <span className="text-[10px] text-mute">phút</span>
                <div className="flex-1" />
                <button onClick={() => setTimerSetting(false)} className="px-2 py-1 bg-bg2 text-mute rounded-md text-[10px] font-bold">Hủy</button>
                <button onClick={() => startTimer(parseInt(timerCustom) || 25)} className="px-3 py-1 bg-ink text-bg rounded-md text-[10px] font-bold active:scale-95">Bắt đầu</button>
              </div>
            </div>
          ) : (
            /* Row 2 normal: date + stats + timer button */
            <>
              <div className="flex items-center justify-between mt-1.5 gap-1">
                {/* ← limited: can't go before first tracked date, but can always go back from future */}
                {(() => {
                  const firstDate = allDataDates.length > 0 ? allDataDates[0] : formatDate(new Date());
                  const prevDay = formatDate(new Date(new Date(date + "T00:00:00").getTime() - 86400000));
                  const canGoBack = prevDay >= firstDate;
                  return <button onClick={() => { if (canGoBack) setDate(prevDay); }}
                    disabled={!canGoBack}
                    className={`w-10 h-10 rounded-md bg-card border border-line flex items-center justify-center transition-colors active:scale-95 shrink-0 ${canGoBack ? "text-mute hover:text-ink" : "text-line opacity-30"}`}>
                    <Ic d={P.left} size={15} />
                  </button>;
                })()}
                <div className="flex-1 text-center min-w-0">
                  <div className="font-bold text-xs">{fmtDateDisp(date)}</div>
                  {isToday && <div className="text-mute text-[9px]">{getTimeEmoji()} {getTimeOfDay()}</div>}
                </div>
                <div className="flex gap-1 items-center shrink-0">
                  {!isToday && <button onClick={() => setDate(formatDate(new Date()))} className="px-2 h-10 rounded-md bg-ink/10 text-ink text-[9px] font-bold">Nay</button>}
                  <button onClick={() => setTimerSetting(true)} className="h-10 px-2 bg-card border border-line hover:border-ink rounded-md text-[9px] font-bold text-mute hover:text-ink transition-colors active:scale-95">
                    <Ic d={P.clock} size={12} />
                  </button>
                  {/* Always show → */}
                  <button onClick={() => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 1); setDate(formatDate(d)); }}
                    className="w-10 h-10 rounded-md bg-card border border-line flex items-center justify-center text-mute hover:text-ink transition-colors active:scale-95">
                    <Ic d={P.right} size={15} />
                  </button>
                </div>
              </div>
              {/* Stats */}
              {(totCal > 0 || totExp > 0 || totAct > 0) && (
                <div className="flex gap-1 mt-1 overflow-x-auto">
                  {totCal > 0 && <span className="shrink-0 bg-gold2 text-gold border border-gold/20 px-1.5 py-0.5 rounded text-[10px] font-semibold tnum">🔥{totCal.toLocaleString()}</span>}
                  {totExp > 0 && <span className="shrink-0 bg-red2 text-red border border-red/20 px-1.5 py-0.5 rounded text-[10px] font-semibold tnum">💸{fmtCurrency(totExp)}</span>}
                  {totAct > 0 && <span className="shrink-0 bg-blue2 text-blue border border-blue/20 px-1.5 py-0.5 rounded text-[10px] font-semibold tnum">⏱{fmtDur(totAct)}</span>}
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 pb-20 space-y-1.5 overflow-y-auto">

        {/* TAB SWITCHER for mobile */}
        <div className="flex gap-1 bg-card rounded-lg border border-line p-1 mt-2">
          <button onClick={() => setTab("main")} className={`flex-1 min-h-[44px] py-2 rounded-md text-[11px] font-bold transition-all ${tab === "main" ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>📋 Chung</button>
          <button onClick={() => setTab("exp")} className={`flex-1 min-h-[44px] py-2 rounded-md text-[11px] font-bold transition-all ${tab === "exp" ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>💰 Chi tiêu</button>
          <button onClick={() => setTab("plan")} className={`flex-1 min-h-[44px] py-2 rounded-md text-[11px] font-bold transition-all ${tab === "plan" ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>📅 Kế hoạch</button>
        </div>

        {tab === "main" ? (
          <>
            {/* LIVE */}
            {isToday && (
              <div className="a-rise">
                {live ? (
                  <div className="bg-card rounded-xl border border-green/30 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-lg bg-green/10 flex items-center justify-center text-lg shrink-0">
                        <CI cat={live.category} size={20} /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green border-2 border-card a-blink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] uppercase tracking-widest text-green font-bold">Đang track · {fmtTimeVN(live.startedAt)}</div>
                        <div className="font-bold text-[13px] truncate">{live.title}</div>
                      </div>
                      <div className="font-bold text-lg tnum shrink-0">{fmtElapsed(elapsed)}</div>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => { S.stopLiveTrack(); reload(); }} className="flex items-center gap-1.5 px-4 py-2 bg-red/15 border border-red/25 text-red rounded-md text-[11px] font-bold transition-colors active:scale-95 min-h-[40px]"><Ic d={P.stop} size={12} sw={2.5} /> Dừng</button>
                      <div className="flex-1 grid grid-cols-5 gap-1">{ACTS.filter(c => c.value !== live.category).slice(0, 5).map(c => (<button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }} className="h-9 rounded-md bg-bg2 hover:bg-line flex items-center justify-center transition-colors active:scale-90 border border-line"><CI cat={c.value} size={13} /></button>))}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-2.5 border border-line">
                    <div className="text-[10px] text-mute mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green a-blink" />Chọn để track:</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {ACTS.map(c => (<button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }} className="flex flex-col items-center gap-0.5 bg-bg2 hover:bg-green/10 hover:text-green border border-line py-2 rounded-lg text-[9px] font-medium transition-all active:scale-95 min-h-[48px]"><CI cat={c.value} size={16} />{c.label}</button>))}
                    </div>
                  </div>
                )}
                {liveR.length > 0 && (
                  <div className="bg-card rounded-lg border border-line mt-1.5 overflow-hidden">
                    <div className="px-2.5 py-1 text-[9px] text-mute2 font-bold uppercase tracking-widest border-b border-line">Đã track</div>
                    {liveR.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] group border-b border-line/40 last:border-0">
                        <button onClick={() => { S.startLiveTrack(r.title, r.category); reload(); }} className="text-mute2 hover:text-green"><Ic d={P.play} size={9} sw={2.5} /></button>
                        <span className="text-xs"><CI cat={r.category} /></span><span className="flex-1 truncate text-ink2">{r.title}</span>
                        <span className="text-[9px] text-mute tnum">{fmtTimeVN(r.startedAt)}</span>
                        {r.endedAt && <span className="text-[9px] bg-green2 text-green px-1 py-0.5 rounded font-semibold tnum">{fmtDur(Math.max(1, Math.round((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 60000)))}</span>}
                        <button onClick={() => { S.deleteLiveTrack(r.id); reload(); }} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* HABITS */}
            {habits.length > 0 && (
              <div className="bg-card rounded-lg border border-line p-2.5">
                <div className="text-[9px] text-mute2 font-bold uppercase tracking-widest mb-1.5">Thói quen</div>
                <div className="space-y-1">
                  {habits.map(h => {
                    const ck = habitChecks.some(c => c.habitId === h.id);
                    const hc = S.getHabitCheck(h.id, date);
                    const hs = S.getHabitStreak(h.id);
                    const isLate = isToday && !ck && new Date().getHours() >= 20;
                    const hasTarget = h.target != null && h.target > 0;
                    const progress = hc?.count || 0;
                    const pct = hasTarget ? Math.min(100, Math.round((progress / (h.target || 1)) * 100)) : 0;
                    return (<div key={h.id} className={`py-2 group ${isLate ? "bg-red/5 -mx-2.5 px-2.5 rounded" : ""}`}>
                      <div className="flex items-start gap-2">
                        <button onClick={() => { S.toggleHabitCheck(h.id, date); reload(); }} className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 shrink-0 mt-0.5 ${ck ? "bg-green border-green text-bg" : isLate ? "border-red" : "border-line hover:border-ink"}`}>{ck && <Ic d={P.check} size={13} sw={3} />}</button>
                        <span className="text-sm mt-0.5">{h.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[12px] font-medium ${ck ? "line-through text-mute" : ""}`}>{h.name}</span>
                            {hasTarget && <span className="text-[9px] bg-bg2 border border-line text-mute px-1 py-0.5 rounded tnum">{progress}/{h.target} {h.unit || ""}</span>}
                          </div>
                          {h.description && <div className="text-[10px] text-mute mt-0.5">{h.description}</div>}
                          {hc?.note && <div className="text-[9px] text-blue bg-blue2 border border-blue/20 rounded px-1.5 py-0.5 mt-0.5">{hc.note}</div>}
                          {isLate && <div className="text-[9px] text-red font-bold mt-0.5">⚠ Sắp hết ngày!</div>}
                          {/* Progress bar for target habits */}
                          {hasTarget && <div className="h-1 bg-bg2 rounded-full mt-1 overflow-hidden"><div className="h-full bg-green rounded-full transition-all" style={{ width: `${pct}%` }} /></div>}
                        </div>
                        {hs > 0 && <span className="text-[9px] bg-gold2 text-gold px-1 py-0.5 rounded font-bold tnum shrink-0 mt-0.5">{hs}🔥</span>}
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-1 mt-1 pl-9">
                        {hasTarget && !ck && <button onClick={() => { S.updateHabitCheck(h.id, date, progress + 1, hc?.note || null); if (progress + 1 >= (h.target || 1)) S.toggleHabitCheck(h.id, date); reload(); }}
                          className="px-2 py-1 bg-bg2 border border-line rounded text-[9px] font-bold text-mute hover:text-ink min-h-[28px] active:scale-95">+1 {h.unit || ""}</button>}
                        <button onClick={() => { const n = prompt("Ghi chú:", hc?.note || ""); if (n !== null) { S.updateHabitCheck(h.id, date, hc?.count || null, n); reload(); } }}
                          className="px-2 py-1 bg-bg2 border border-line rounded text-[9px] font-bold text-mute hover:text-ink min-h-[28px] active:scale-95">📝</button>
                        {!ck && <button onClick={() => { if (confirm(`Dời "${h.name}" sang ngày mai?`)) { S.postponeHabit(h.id, date); reload(); } }}
                          className="px-2 py-1 bg-bg2 border border-line rounded text-[9px] font-bold text-mute hover:text-ink min-h-[28px] active:scale-95">→ Mai</button>}
                        <button onClick={() => { if (confirm("Xóa?")) { S.deleteHabit(h.id); reload(); } }}
                          className="px-2 py-1 bg-bg2 border border-line rounded text-[9px] font-bold text-mute hover:text-red min-h-[28px] active:scale-95"><Ic d={P.x} size={10} /></button>
                      </div>
                    </div>);
                  })}
                </div>
              </div>
            )}
            {isToday && <button onClick={() => setModal("addHabit")} className="text-[10px] text-mute bg-card border border-dashed border-line rounded-lg py-1.5 w-full hover:border-ink hover:text-ink transition-colors font-medium">{habits.length === 0 ? "+ Thêm thói quen" : "+ Thêm"}</button>}

            {/* ACTIVITIES */}
            <Sec title="Hoạt động" icon={P.clip} count={acts.length} c={!!col.a} onT={() => tog("a")} onA={() => { if (!isPastDay) setModal("act"); }}>
              {acts.length === 0 ? <Em /> : acts.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1 group">
                  <span className="text-xs w-5 text-center shrink-0"><CI cat={a.category} /></span>
                  <span className="text-[12px] font-medium flex-1 truncate">{a.title}</span>
                  {a.startTime && <span className="text-[10px] text-mute tnum shrink-0">{a.startTime}{a.endTime ? `–${a.endTime}` : ""}</span>}
                  {a.durationMinutes != null && a.durationMinutes > 0 && <span className="text-[10px] bg-blue2 text-blue px-1 py-0.5 rounded font-semibold tnum border border-blue/20 shrink-0">{fmtDur(a.durationMinutes)}</span>}
                  {!isPastDay && <button onClick={() => del("a", a.id)} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>}
                </div>
              ))}
            </Sec>

            {/* QUICK NOTES */}
            {qnotes.length > 0 && (
              <div className="bg-card rounded-lg border border-line overflow-hidden">
                <div className="px-2.5 py-1.5 flex items-center gap-1.5 border-b border-line">
                  <span className="text-mute"><Ic d={P.note} size={12} /></span><span className="font-bold text-xs">Ghi nhanh</span>
                  <span className="text-[9px] text-mute2 tnum">({qnotes.length})</span>
                </div>
                <div className="px-2.5 py-1.5 space-y-0.5 max-h-32 overflow-y-auto">
                  {[...qnotes.filter(n => n.pinned), ...qnotes.filter(n => !n.pinned)].map(n => (
                    <div key={n.id} className="flex items-start gap-1.5 group py-0.5">
                      <span className="text-[9px] text-mute tnum shrink-0 mt-0.5">{n.time}</span>
                      {n.pinned && <span className="text-[9px] shrink-0">📌</span>}
                      <span className={`text-[12px] flex-1 ${n.pinned ? "font-medium" : ""}`}>{n.text}</span>
                      <button onClick={() => { const t = prompt("Sửa ghi chú:", n.text); if (t !== null && t.trim()) { S.editQuickNote(n.id, t.trim()); reload(); } }} className="text-mute2 hover:text-ink opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center" title="Sửa"><Ic d={P.clip} size={10} /></button>
                      <button onClick={() => { S.togglePinNote(n.id); reload(); }} className="text-mute2 hover:text-gold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center" title="Ghim"><Ic d={P.pin} size={10} /></button>
                      <button onClick={() => { if (confirm("Xóa?")) { S.deleteQuickNote(n.id); reload(); } }} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center" title="Xóa"><Ic d={P.x} size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isToday && <button onClick={() => setModal("qn")} className="text-[10px] text-mute bg-card border border-dashed border-line rounded-lg py-1.5 w-full hover:border-ink hover:text-ink transition-colors font-medium">+ Ghi nhanh</button>}

            {/* WEEK CHART — only on desktop or when idle */}
            {wTot > 0 && (
              <div className="bg-card rounded-lg p-2.5 border border-line hidden sm:block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] text-mute2 font-bold uppercase tracking-widest">7 ngày</span>
                  <span className="font-bold text-xs text-red tnum">{fmtCurrency(wTot)}</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {weekStats.map(w => (
                    <div key={w.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full h-7 flex items-end"><div className={`w-full rounded-t a-bar ${w.isToday ? "bg-ink" : w.expense > 0 ? "bg-line2" : "bg-line/50"}`} style={{ height: w.expense > 0 ? `${Math.max(10, (w.expense / wMax) * 100)}%` : "2px" }} /></div>
                      <span className={`text-[8px] font-semibold ${w.isToday ? "text-ink" : "text-mute2"}`}>{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DAILY NOTE inline */}
            <DayNote status={status} date={date} onSave={reload} />
          </>
        ) : tab === "exp" ? (
          <>
            {/* ═══ CHI TIÊU TAB ═══ */}
            <FinanceTools />
            {/* Summary card */}
            {totExp > 0 && (
              <div className="bg-card rounded-xl border border-red/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-mute2 uppercase tracking-widest font-bold">Tổng chi hôm nay</div>
                    <div className="font-bold text-2xl text-red tnum mt-0.5">{fmtCurrency(totExp)}</div>
                  </div>
                  <button onClick={() => setModal("inv")} className="flex items-center gap-1 bg-red2 hover:bg-red/20 border border-red/25 text-red px-3 py-2 rounded-lg text-xs font-bold transition-colors active:scale-95">
                    <Ic d={P.receipt} size={14} /> Hóa đơn
                  </button>
                </div>
              </div>
            )}

            {/* Meals with price */}
            <Sec title="Bữa ăn" icon={P.fork} count={meals.length} c={!!col.me} onT={() => tog("me")} onA={() => { if (!isPastDay) setModal("meal"); }}>
              {meals.length === 0 ? <Em /> : (
                <div className="space-y-2">
                  {Object.entries(mp).sort((a, b) => a[0].localeCompare(b[0])).map(([k, ms]) => {
                    const [, label, emoji] = k.split("|");
                    return (<div key={k}><div className="text-[9px] font-bold text-mute2 mb-0.5 uppercase tracking-wider">{emoji} {label}</div>
                      {ms.map(m => { const mImg = getImg(m.id, m.image); return (<div key={m.id} className="flex items-center gap-2 py-1 group">
                        {mImg ? <button onClick={() => setImg(mImg)} className="w-8 h-8 rounded-md overflow-hidden shrink-0 ring-1 ring-line"><img src={mImg} alt="" className="w-full h-full object-cover" /></button>
                        : <span className="w-8 h-8 rounded-md bg-bg2 border border-line flex items-center justify-center text-xs shrink-0">🍽️</span>}
                        <span className="text-[12px] font-medium flex-1 truncate">{m.foodName}</span>
                        {m.time && <span className="text-[10px] text-mute tnum shrink-0">{m.time}</span>}
                       {m.calories != null && m.calories > 0 && <span className="text-[10px] bg-gold2 text-gold px-1 py-0.5 rounded font-semibold tnum shrink-0">{m.calories}cal</span>}
                       {m.protein != null && m.protein > 0 && <span className="text-[10px] bg-blue2 text-blue px-1 py-0.5 rounded font-semibold tnum shrink-0">P{m.protein}g</span>}
                       {m.fat != null && m.fat > 0 && <span className="text-[10px] bg-card text-mute px-1 py-0.5 rounded font-semibold tnum shrink-0">F{m.fat}g</span>}
                       {m.carbs != null && m.carbs > 0 && <span className="text-[10px] bg-card text-mute px-1 py-0.5 rounded font-semibold tnum shrink-0">C{m.carbs}g</span>}
                       {m.price != null && m.price > 0 && <span className="text-[10px] bg-red2 text-red px-1 py-0.5 rounded font-semibold tnum shrink-0">{fmtCurrency(m.price)}</span>}
                        {!isPastDay && <button onClick={() => del("m", m.id)} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>}
                      </div>); })}
                    </div>);
                  })}
                  {totCal > 0 && <div className="flex justify-between pt-1.5 border-t border-line text-[11px]"><span className="text-mute">Tổng calories</span><span className="font-bold text-gold tnum">{totCal.toLocaleString()} cal</span></div>}
                </div>
              )}
            </Sec>

            {/* Expenses */}
            <Sec title="Chi tiêu" icon={P.wallet} count={exps.length} c={!!col.e} onT={() => tog("e")} onA={() => { if (!isPastDay) setModal("exp"); }}
              extra={totExp > 0 ? <span className="font-bold text-[11px] text-red tnum">{fmtCurrency(totExp)}</span> : undefined}>
              {exps.length === 0 ? <Em /> : (
                <div className="space-y-0.5">
                  {exps.map(e => { const eImg = getImg(e.id, e.image); return (<div key={e.id} className="flex items-start gap-2 py-1 group">
                    {eImg ? <button onClick={() => setImg(eImg)} className="w-8 h-8 rounded-md overflow-hidden shrink-0 ring-1 ring-line"><img src={eImg} alt="" className="w-full h-full object-cover" /></button>
                    : <span className="w-8 h-8 rounded-md bg-bg2 border border-line flex items-center justify-center text-xs shrink-0"><CI cat={e.category} /></span>}
                    <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate">{e.description}</div><div className="text-[10px] text-mute">{fmtTimeVN(e.createdAt)} · {ge(e.category)?.label}</div></div>
                    <span className="font-bold text-[11px] text-red tnum shrink-0">−{fmtCurrency(e.amount)}</span>
                    {!isPastDay && <button onClick={() => del("e", e.id)} className="mt-1 text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>}
                  </div>); })}
                </div>
              )}
            </Sec>

            {/* Week chart in expense tab */}
            {wTot > 0 && (
              <div className="bg-card rounded-lg p-2.5 border border-line">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] text-mute2 font-bold uppercase tracking-widest">Chi 7 ngày</span>
                  <span className="font-bold text-xs text-red tnum">{fmtCurrency(wTot)}</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {weekStats.map(w => (
                    <div key={w.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full h-7 flex items-end"><div className={`w-full rounded-t a-bar ${w.isToday ? "bg-red" : w.expense > 0 ? "bg-line2" : "bg-line/50"}`} style={{ height: w.expense > 0 ? `${Math.max(10, (w.expense / wMax) * 100)}%` : "2px" }} /></div>
                      <span className={`text-[8px] font-semibold ${w.isToday ? "text-ink" : "text-mute2"}`}>{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEBT TRACKING */}
            <DebtSection onChanged={reload} />
          </>
        ) : tab === "plan" ? (
          <>
            {/* ═══ PLANNER TAB ═══ */}
            {/* Schedule templates + copy — only for today or future */}
            {date >= formatDate(new Date()) && (
              <>
                <ScheduleSection date={date} onApply={reload} />
                <CopyPlansSection currentDate={date} onCopy={reload} />
              </>
            )}

            {/* Plan list */}
            <PlanList plans={plans} date={date} onChanged={reload} onAdd={() => setModal("addPlan")} />
          </>
        ) : null}

        {/* RECENT ACTIVITY LOG — shows all days at a glance */}
        <RecentLog currentDate={date} />
      </main>

      {/* BOTTOM NAV — always visible */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg/95 backdrop-blur-md border-t border-line py-2 z-30">
        <div className="flex justify-around max-w-xl mx-auto">
          {[
            { d: P.fork, l: "Ăn", m: "meal" },
            { d: P.clip, l: "Việc", m: "act" },
            { d: P.wallet, l: "Chi", m: "exp" },
            { d: P.clock, l: "Focus", m: "pomo" },
            { d: P.calendar, l: "Sử", m: "hist" },
          ].map(b => (
            <button
              key={b.m}
              onClick={() => {
                if (b.m === "pomo") {
                  setModal(null);
                  if (timerRunning) {
                    // Already running — keep visible at top
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                  setTimerSetting(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setTimerSetting(false);
                  setModal(b.m);
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[52px] min-w-[60px] px-4 py-1.5 rounded-lg active:scale-90 transition-all ${
                (b.m === "pomo" && (timerRunning || timerSetting)) || modal === b.m
                  ? "text-ink"
                  : "text-mute hover:text-ink"
              }`}
            >
              <Ic d={b.d} size={19} /><span className="text-[9px] font-semibold">{b.l}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MODALS */}
      {modal === "meal" && <MealModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "act" && <ActModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "exp" && <ExpModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "inv" && <InvModal date={date} exps={exps} onClose={() => setModal(null)} />}
      {modal === "hist" && <HistModal onClose={() => setModal(null)} onPick={d => { setDate(d); setModal(null); }} onChanged={reload} />}
      {modal === "addHabit" && <AddHabitModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "qn" && <QNModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "addPlan" && <AddPlanModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "addSchedule" && <AddScheduleModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}

      {/* PET ASSISTANT */}
      <PetAssistant />

      {/* IMAGE VIEWER */}
      {img && (
        <div className="fixed inset-0 bg-bg/95 z-50 flex items-center justify-center p-4 a-pop" onClick={() => setImg(null)}>
          <div className="relative max-w-lg w-full"><img src={img} alt="" className="w-full rounded-xl" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={e => { e.stopPropagation(); const l = document.createElement("a"); l.download = `img.jpg`; l.href = img; l.click(); }} className="w-10 h-10 bg-card/80 hover:bg-ink text-ink hover:text-bg rounded-full flex items-center justify-center backdrop-blur transition-colors"><Ic d={P.dl} size={16} /></button>
              <button onClick={() => setImg(null)} className="w-10 h-10 bg-card/80 hover:bg-red text-ink rounded-full flex items-center justify-center backdrop-blur transition-colors"><Ic d={P.x} size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ SMALL ═══ */
function Em() { return <p className="text-[10px] text-mute2 py-1.5 text-center">Nhấn + để thêm</p>; }

function Sec({ title, icon, count, c, onT, onA, extra, children }: { title: string; icon: string; count: number; c: boolean; onT: () => void; onA: () => void; extra?: ReactNode; children: ReactNode; }) {
  return (<section className="bg-card rounded-lg border border-line overflow-hidden a-rise"><div className="flex items-center px-2.5 py-2 gap-1.5">
    <button onClick={onT} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
      <span className="w-6 h-6 rounded-md bg-bg2 border border-line flex items-center justify-center text-mute shrink-0"><Ic d={icon} size={12} /></span>
      <span className="font-bold text-xs">{title}</span>{count > 0 && <span className="bg-bg2 text-mute text-[9px] font-bold px-1 py-0.5 rounded tnum border border-line">{count}</span>}
      {extra && <span className="ml-auto mr-1 shrink-0">{extra}</span>}
      <Ic d={P.down} size={10} cls={`text-mute2 transition-transform shrink-0 ${c ? "" : "rotate-180"}`} />
    </button>
    <button onClick={onA} className="w-6 h-6 rounded-md bg-ink text-bg flex items-center justify-center hover:bg-accent transition-colors active:scale-90 shrink-0"><Ic d={P.plus} size={12} sw={2.5} /></button>
  </div>{!c && <div className="px-2.5 pb-2.5">{children}</div>}</section>);
}

/* ═══ ALARM SOUND — used by timer in header ═══ */
let audioCtx: AudioContext | null = null;
let alarmAudio: HTMLAudioElement | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function buildAlarmDataUrl(): string {
  const sr = 44100;
  const duration = 5.5;
  const samples = Math.floor(sr * duration);
  const data = new Int16Array(samples);
  const pattern = [0, 0.18, 0.36, 0.54, 1.0, 1.18, 1.36, 1.54, 2.0, 2.18, 2.36, 2.54, 3.0, 3.18, 3.36, 3.54, 4.0, 4.18, 4.36, 4.54];
  for (let i = 0; i < samples; i++) {
    const t = i / sr;
    let v = 0;
    for (const start of pattern) {
      if (t >= start && t < start + 0.11) {
        const local = t - start;
        const env = 1 - local / 0.11;
        const f = (Math.floor((start * 10) % 4) >= 2) ? 1320 : 980;
        v += Math.sign(Math.sin(2 * Math.PI * f * t)) * env * 0.75;
      }
    }
    if (t >= 4.9 && t < 5.35) {
      const local = t - 4.9;
      const env = 1 - local / 0.45;
      v += Math.sin(2 * Math.PI * 1200 * t) * env * 0.7;
    }
    data[i] = Math.max(-1, Math.min(1, v)) * 32767;
  }
  const buffer = new ArrayBuffer(44 + data.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  writeStr(0, "RIFF"); view.setUint32(4, 36 + data.length * 2, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, data.length * 2, true);
  let o = 44; data.forEach(v => { view.setInt16(o, v, true); o += 2; });
  const bytes = new Uint8Array(buffer); let binary = ""; bytes.forEach(b => binary += String.fromCharCode(b));
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function ensureAlarmAudio() {
  if (!alarmAudio) {
    alarmAudio = new Audio(buildAlarmDataUrl());
    alarmAudio.preload = "auto";
  }
  return alarmAudio;
}

// Warm up audio on first user interaction (needed for iOS)
if (typeof window !== "undefined") {
  const warmUp = () => {
    try {
      getAudioCtx();
      const a = ensureAlarmAudio();
      a.volume = 0;
      a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => {});
    } catch {}
    window.removeEventListener("touchstart", warmUp);
    window.removeEventListener("click", warmUp);
  };
  window.addEventListener("touchstart", warmUp, { once: true });
  window.addEventListener("click", warmUp, { once: true });
}

function playAlarm() {
  // Primary: HTMLAudio (more reliable on iPhone)
  try {
    const a = ensureAlarmAudio();
    a.currentTime = 0;
    a.volume = 1;
    a.play().catch(() => {});
  } catch {}
  // Fallback / layering: WebAudio tone blast
  try {
    const ac = getAudioCtx();
    const tone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = "square") => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime + start);
      g.gain.setValueAtTime(vol, ac.currentTime + start + dur * 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + start);
      o.stop(ac.currentTime + start + dur);
    };
    for (let r = 0; r < 6; r++) {
      const b = r * 0.9;
      tone(980, b, 0.08, 0.9);
      tone(980, b + 0.12, 0.08, 0.9);
      tone(1100, b + 0.24, 0.08, 1.0);
      tone(1100, b + 0.36, 0.08, 1.0);
      tone(1320, b + 0.5, 0.12, 1.0, "sawtooth");
    }
  } catch {}
}

/* ═══ RECENT LOG — full names, compact 3 days ═══ */
function RecentLog({ currentDate }: { currentDate: string }) {
  const logs = S.getRecentDayLogs(3);
  const allDays = logs.filter(l => l.meals.length > 0 || l.activities.length > 0 || l.expenses.length > 0 || l.liveTracks.length > 0);
  if (allDays.length <= 1) return null;
  const dayNames = ["CN","T2","T3","T4","T5","T6","T7"];
  return <div className="bg-card rounded-lg border border-line overflow-hidden a-rise">
    <div className="px-2.5 py-1.5 border-b border-line flex justify-between"><span className="font-bold text-[11px]">Nhật ký gần đây</span><span className="text-[9px] text-mute">3 ngày gần nhất</span></div>
    {allDays.map(day=>{const dd=new Date(day.date+"T00:00:00"),exp=day.expenses.reduce((s,e)=>s+e.amount,0),cur=day.date===currentDate;const acts=[...day.liveTracks.map(t=>t.title),...day.activities.map(a=>a.title)];const extras=day.expenses.filter(e=>!day.meals.some(m=>m.foodName===e.description&&m.price===e.amount));return <div key={day.date} className={`px-2.5 py-1.5 border-b border-line/30 last:border-0 ${cur?"bg-ink/5":""}`}><div className="flex items-center gap-2 mb-0.5"><span className={`text-[10px] font-bold tnum ${cur?"text-ink":"text-mute"}`}>{dayNames[dd.getDay()]} {dd.getDate()}/{dd.getMonth()+1}</span><span className="flex-1 h-px bg-line"/>{exp>0&&<span className="text-[9px] text-red font-bold tnum">{fmtCurrency(exp)}</span>}</div>{acts.length>0&&<div className="text-[9px] text-ink leading-relaxed"><b>Hoạt động:</b> {acts.join(" · ")}</div>}{day.meals.length>0&&<div className="text-[9px] text-mute leading-relaxed"><b>Ăn:</b> {day.meals.map(m=>m.foodName).join(" · ")}</div>}{extras.length>0&&<div className="text-[9px] text-mute leading-relaxed"><b>Chi:</b> {extras.map(e=>`${e.description} ${fmtCurrency(e.amount)}`).join(" · ")}</div>}</div>})}
  </div>;
}

function DayNote({ status, date, onSave }: { status: S.DailyStatus | null; date: string; onSave: () => void }) {
  const [ed, setEd] = useState(false);
  const [sl, setSl] = useState(""); const [wa, setWa] = useState(""); const [wt, setWt] = useState(""); const [nt, setNt] = useState("");
  useEffect(() => { setSl(status?.sleepHours ? String(status.sleepHours / 60) : ""); setWa(status?.waterCups ? String(status.waterCups) : ""); setWt(status?.weight ? String(status.weight / 1000) : ""); setNt(status?.dailyNote || ""); setEd(false); }, [status, date]);
  const inp = "px-2 py-1.5 rounded-md bg-bg2 border border-line text-xs text-center outline-none focus:border-ink w-full transition-colors";
  if (!ed) {
    const h = status && (status.sleepHours || status.waterCups || status.weight || status.dailyNote);
    return (<div onClick={() => setEd(true)} className="flex items-center gap-1 flex-wrap cursor-pointer group">
      {h ? (<>{status.sleepHours != null && status.sleepHours > 0 && <span className="bg-blue2 text-blue border border-blue/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">💤{(status.sleepHours / 60).toFixed(1)}h</span>}
        {status.waterCups != null && status.waterCups > 0 && <span className="bg-blue2 text-blue border border-blue/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">💧{status.waterCups}</span>}
        {status.weight != null && status.weight > 0 && <span className="bg-green2 text-green border border-green/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">⚖️{(status.weight / 1000).toFixed(1)}kg</span>}
        {status.dailyNote && <span className="bg-card border border-line text-mute px-1.5 py-0.5 rounded text-[10px] truncate max-w-[130px] text-[10px]">"{status.dailyNote}"</span>}</>
      ) : <button className="text-[10px] text-mute bg-card border border-dashed border-line hover:border-ink px-2 py-1 rounded-lg font-medium transition-colors">+ Ghi chú</button>}</div>);
  }
  return (<div className="bg-card rounded-lg p-2.5 border border-line a-pop">
    <div className="grid grid-cols-3 gap-1.5 mb-1.5"><input type="number" step="0.5" value={sl} onChange={e => setSl(e.target.value)} placeholder="💤h" className={inp} /><input type="number" value={wa} onChange={e => setWa(e.target.value)} placeholder="💧" className={inp} /><input type="number" step="0.1" value={wt} onChange={e => setWt(e.target.value)} placeholder="⚖️kg" className={inp} /></div>
    <input type="text" value={nt} onChange={e => setNt(e.target.value)} placeholder="Ghi chú..." className="w-full px-2 py-1.5 rounded-md bg-bg2 border border-line text-xs mb-1.5 outline-none focus:border-ink transition-colors" />
    <div className="flex gap-1.5">
      <button onClick={() => setEd(false)} className="flex-1 py-1 bg-bg2 text-mute rounded-md text-[10px] font-semibold">Hủy</button>
      <button onClick={() => { S.saveDailyStatus({ date, sleepHours: sl ? Math.round(parseFloat(sl) * 60) : null, waterCups: wa ? parseInt(wa) : null, weight: wt ? Math.round(parseFloat(wt) * 1000) : null, dailyNote: nt || null, mood: status?.mood || null }); onSave(); setEd(false); }} className="flex-1 py-1 bg-ink text-bg rounded-md text-[10px] font-semibold">Lưu</button>
    </div>
  </div>);
}

/* ═══ MODALS — iOS keyboard-safe: pin to visual viewport ═══ */
function Wrap({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const overlay = overlayRef.current;
      const box = boxRef.current;
      if (!overlay || !box) return;

      // Pin overlay to the visible viewport (above keyboard)
      const top = vv.offsetTop;
      const height = vv.height;
      overlay.style.top = `${top}px`;
      overlay.style.height = `${height}px`;
      overlay.style.bottom = "auto";

      // Keep modal within visible area with breathing room
      box.style.maxHeight = `${Math.max(220, height - 24)}px`;
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const focusInput = (el: HTMLElement) => {
    // Wait for keyboard animation, then keep input visible without manual swipe
    const run = () => {
      const body = bodyRef.current;
      if (!body) return;
      const bodyRect = body.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const pad = 24;
      if (elRect.bottom > bodyRect.bottom - pad) {
        body.scrollTop += elRect.bottom - bodyRect.bottom + pad + 48;
      } else if (elRect.top < bodyRect.top + pad) {
        body.scrollTop -= bodyRect.top - elRect.top + pad;
      }
      // Also nudge browser scroll into the visual viewport
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    };
    requestAnimationFrame(() => {
      setTimeout(run, 80);
      setTimeout(run, 280);
      setTimeout(run, 480);
    });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-3.5 a-rise border border-line flex flex-col"
        style={{ maxHeight: "85dvh" }}
      >
        <div className="flex items-center justify-between mb-2.5 shrink-0">
          <h2 className="font-bold text-sm">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md bg-bg2 hover:bg-red/15 hover:text-red flex items-center justify-center text-mute transition-colors">
            <Ic d={P.x} size={13} />
          </button>
        </div>
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto overscroll-contain pb-4"
          onFocusCapture={e => {
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
              focusInput(t);
            }
          }}
        >
          {children}
          {/* Extra space so last field/button stays above keyboard */}
          <div className="h-24" aria-hidden />
        </div>
      </div>
    </div>
  );
}
const ic = "w-full px-3 py-2 rounded-md bg-bg2 border border-line outline-none focus:border-ink text-sm transition-colors";

function MoneyIn({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const p = parseMoney(value);
  return (<div><input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={ic} />
    {value.trim() && <p className={`text-[10px] mt-0.5 text-right font-semibold ${p != null ? "text-green" : "text-red"}`}>{p != null ? `= ${fmtCurrency(p)}` : "Lỗi"}</p>}</div>);
}

function PaymentPicker({ method, setMethod, accountId, setAccountId }: { method: "cash" | "account"; setMethod: (m: "cash" | "account") => void; accountId: string; setAccountId: (id: string) => void }) {
  const all = S.getMoneyAccounts();
  const choices = all.filter(a => method === "cash" ? a.type === "cash" : a.type !== "cash");
  const selectMethod = (m: "cash" | "account") => { setMethod(m); const list = all.filter(a => m === "cash" ? a.type === "cash" : a.type !== "cash"); setAccountId(list[0]?.id || ""); };
  return <div className="bg-bg2 border border-line rounded-lg p-2 mb-2">
    <div className="text-[9px] text-mute font-bold mb-1">Thanh toán bằng</div>
    <div className="grid grid-cols-2 gap-1 mb-1.5"><button type="button" onClick={() => selectMethod("cash")} className={`min-h-[38px] rounded-md text-[10px] font-bold ${method === "cash" ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>Tiền mặt</button><button type="button" onClick={() => selectMethod("account")} className={`min-h-[38px] rounded-md text-[10px] font-bold ${method === "account" ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>Tài khoản</button></div>
    {choices.length === 0 ? <div className="text-[9px] text-gold">Chưa có {method === "cash" ? "quỹ tiền mặt" : "tài khoản"}; khoản chi vẫn lưu nhưng chưa trừ số dư.</div> : <div className="grid grid-cols-2 gap-1">{choices.map(a => <button type="button" key={a.id} onClick={() => setAccountId(a.id)} className={`min-h-[36px] px-2 rounded-md text-left ${accountId === a.id ? "bg-green2 border border-green/30 text-green" : "bg-card border border-line text-mute"}`}><div className="text-[9px] font-bold truncate">{a.name}</div><div className="text-[8px] tnum">{fmtCurrency(a.balance)}</div></button>)}</div>}
  </div>;
}

async function compressImage(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = raw;
  });

  const max = 1280;
  let w = img.width;
  let h = img.height;
  if (w > h && w > max) { h = Math.round((h * max) / w); w = max; }
  else if (h > max) { w = Math.round((w * max) / h); h = max; }

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function ImgP({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onChange(await compressImage(f)); }
    catch { alert("Không đọc được ảnh"); }
    finally { setBusy(false); e.currentTarget.value = ""; }
  };

  if (value) return (
    <div className="relative mb-2.5">
      <img src={value} alt="" className="w-full h-28 object-cover rounded-lg border border-line" />
      <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 w-6 h-6 bg-bg/80 hover:bg-red text-ink rounded-full flex items-center justify-center transition-colors"><Ic d={P.x} size={11} /></button>
    </div>
  );

  return (
    <div className="flex gap-1.5 mb-2.5">
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => camRef.current?.click()}
        className="flex-1 py-2.5 border border-dashed border-line rounded-lg text-xs text-mute hover:border-ink hover:text-ink flex items-center justify-center gap-1.5 font-medium transition-colors">
        {busy ? "..." : <><Ic d={P.cam} size={14} /> Chụp ảnh</>}
      </button>
      <button type="button" onClick={() => galRef.current?.click()}
        className="flex-1 py-2.5 border border-dashed border-line rounded-lg text-xs text-mute hover:border-ink hover:text-ink flex items-center justify-center gap-1.5 font-medium transition-colors">
        {busy ? "..." : <><Ic d={P.dl} size={14} /> Chọn ảnh</>}
      </button>
    </div>
  );
}

function MealModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const accounts = S.getMoneyAccounts();
  const initialCash = accounts.find(a => a.type === "cash");
  const initialAccount = accounts.find(a => a.type !== "cash");
  const [step, setStep] = useState(1);
  const [mt, setMt] = useState(autoMealType()); const [fn, setFn] = useState(""); const [cal, setCal] = useState(""); const [tm, setTm] = useState(nowHHMM()); const [price, setPrice] = useState(""); const [im, setIm] = useState<string | null>(null);
  const [pro, setPro] = useState(""); const [fat, setFat] = useState(""); const [carb, setCarb] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "account">(initialCash ? "cash" : "account");
  const [accountId, setAccountId] = useState(initialCash?.id || initialAccount?.id || "");
  const pp = parseMoney(price);

  const doSave = async () => {
    if (!fn.trim()) return;
    try {
      const meal = S.addMeal({ date, mealType: mt, foodName: fn.trim(), calories: cal ? parseInt(cal) : null, protein: pro ? parseInt(pro) : null, fat: fat ? parseInt(fat) : null, carbs: carb ? parseInt(carb) : null, time: tm || nowHHMM(), notes: null, image: im, price: pp });
      if (im) await saveImage(`img_${meal.id}`, im);
      if (pp != null && pp > 0) S.addExpense({ date, category: "food", description: fn.trim(), amount: pp, image: null, paymentMethod, accountId: accountId || null, mealId: meal.id });
      onDone();
    } catch { alert("Lỗi lưu."); }
  };

  return (<Wrap title={step === 1 ? "Thêm bữa ăn" : "Dinh dưỡng & giá"} onClose={onClose}>
    {step === 1 ? (<>
      {/* Saved meals — one tap creates a separate meal */}
      {S.getMealPresets().length > 0 && (
        <div className="mb-2">
          {S.getMealPresets().some(p => (p.price || 0) > 0) && <PaymentPicker method={paymentMethod} setMethod={setPaymentMethod} accountId={accountId} setAccountId={setAccountId} />}
          <div className="text-[9px] text-mute font-bold mb-1">Món đã lưu — bấm để thêm ngay:</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
            {S.getMealPresets().map(p => (
              <div key={p.id} className="relative">
                <button type="button" onClick={() => {
                  const mealType = p.mealType || autoMealType();
                  const meal = S.addMeal({ date, mealType, foodName: p.name, calories: p.calories || null, protein: p.protein || null, fat: p.fat || null, carbs: p.carbs || null, notes: null, time: nowHHMM(), image: null, price: p.price || null });
                  if (p.price && p.price > 0) S.addExpense({ date, category: "food", description: p.name, amount: p.price, image: null, paymentMethod, accountId: accountId || null, mealId: meal.id });
                  onDone();
                }} className="w-full text-left px-2 py-2 bg-bg2 border border-line rounded-lg min-h-[48px] active:scale-95 hover:border-ink">
                  <div className="text-[10px] font-bold pr-4 truncate">{p.name}</div>
                  <div className="text-[8px] text-mute tnum">{p.calories}cal · P{p.protein} · F{p.fat} · C{p.carbs}</div>
                </button>
                <button type="button" onClick={() => { if (confirm("Xóa mẫu món này?")) S.deleteMealPreset(p.id); }} className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-mute hover:text-red"><Ic d={P.x} size={9} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Step 1: Meal type + name + photo + time */}
      <div className="flex gap-1 mb-2">{MEALS.map(m => (<button key={m.value} onClick={() => setMt(m.value)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all min-h-[40px] ${mt === m.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}><div className="text-sm">{m.emoji}</div>{m.label}</button>))}</div>
      <ImgP value={im} onChange={setIm} />
      <input type="text" value={fn} onChange={e => setFn(e.target.value)} placeholder="Tên món" autoFocus className={`${ic} mb-2`} />
      <input type="time" value={tm} onChange={e => setTm(e.target.value)} className={`${ic} mb-2 min-h-[44px]`} />
      <div className="flex gap-2">
        <button onClick={doSave} disabled={!fn.trim()} className="flex-1 py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px]">Thêm nhanh</button>
        <button onClick={() => setStep(2)} disabled={!fn.trim()} className="flex-1 py-2.5 rounded-lg bg-bg2 border border-line text-ink font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px] text-[11px]">Thêm chi tiết →</button>
      </div>
    </>) : (<>
      {/* Step 2: Nutrition + price */}
      <div className="bg-bg2 rounded-lg px-2.5 py-1.5 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium">{fn}</span>
        <span className="text-[10px] text-mute">{tm} · {MEALS.find(m => m.value === mt)?.label}</span>
      </div>

      {/* Saved presets — quick fill */}
      {(() => {
        const presets = S.getMealPresets();
        return presets.length > 0 ? (
          <div className="mb-2">
            <div className="text-[9px] text-mute font-bold mb-1">Chỉ số đã lưu:</div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {presets.map(p => (
                <button key={p.id} type="button" onClick={() => { setCal(String(p.calories)); setPro(String(p.protein)); setFat(String(p.fat)); setCarb(String(p.carbs)); }}
                  className="shrink-0 px-2 py-1.5 bg-bg2 border border-line rounded-lg text-[9px] font-bold min-h-[36px] active:scale-95 hover:border-ink text-left">
                  <div>{p.name}</div>
                  <div className="text-[8px] text-mute font-normal tnum">{p.calories}cal P{p.protein} F{p.fat} C{p.carbs}</div>
                </button>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Gemini — copy prompt + open app */}
      <button type="button" onClick={() => {
        const prompt = `Phân tích ảnh món "${fn}" và ước tính dinh dưỡng cho toàn bộ khẩu phần trong ảnh. CHỈ TRẢ LỜI ĐÚNG MỘT DÒNG, KHÔNG GIẢI THÍCH, KHÔNG THÊM CHỮ KHÁC, theo chính xác format: JAYTRACKER|CAL=0|PRO=0|FAT=0|CARB=0. Thay số 0 bằng số nguyên ước tính: CAL là kcal, PRO/FAT/CARB là gram.`;
        navigator.clipboard?.writeText(prompt).catch(() => {});
        window.open("https://gemini.google.com/app", "_blank");
      }} className="flex items-center justify-center gap-2 w-full py-2.5 mb-1 bg-blue2 border border-blue/20 text-blue rounded-lg text-[11px] font-bold min-h-[44px] active:scale-95">
        <Ic d={P.target} size={14} /> Hỏi Gemini — đã copy nội dung
      </button>
      <div className="text-[9px] text-mute text-center mb-1.5">Bấm → mở Gemini + tự copy câu hỏi. Dán và chụp ảnh.</div>

      {/* Paste from Gemini */}
      <div className="mb-2">
        <textarea placeholder="Dán kết quả từ Gemini vào đây..." rows={2}
          className="w-full px-2 py-1.5 rounded-md bg-bg2 border border-line text-[10px] outline-none focus:border-ink resize-none mb-1"
          onChange={e => {
            const r = parseGeminiText(e.target.value);
            if (r) {
              if (r.cal) setCal(String(r.cal));
              if (r.pro) setPro(String(r.pro));
              if (r.fat) setFat(String(r.fat));
              if (r.carbs) setCarb(String(r.carbs));

            }
          }}
        />
        <div className="text-[8px] text-mute">Copy kết quả Gemini → dán vào ô trên → tự điền số bên dưới</div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <input type="number" value={cal} onChange={e => setCal(e.target.value)} placeholder="Calories" className={ic} />
        <input type="number" value={pro} onChange={e => setPro(e.target.value)} placeholder="Protein (g)" className={ic} />
        <input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="Fat (g)" className={ic} />
        <input type="number" value={carb} onChange={e => setCarb(e.target.value)} placeholder="Carbs (g)" className={ic} />
      </div>
      {/* Save as preset */}
      {(cal || pro || fat || carb) && (
        <button type="button" onClick={() => {
          const name = prompt("Tên preset (VD: 2 trứng 1 chuối):", fn);
          if (name?.trim()) {
            S.addMealPreset({ name: name.trim(), calories: parseInt(cal) || 0, protein: parseInt(pro) || 0, fat: parseInt(fat) || 0, carbs: parseInt(carb) || 0, mealType: mt, price: pp || null });
          }
        }} className="w-full py-1.5 mb-2 bg-green2 border border-green/20 text-green rounded-md text-[9px] font-bold min-h-[36px] active:scale-95">
          Lưu chỉ số này để dùng lại
        </button>
      )}
      <div className="mb-2.5"><MoneyIn value={price} onChange={setPrice} placeholder="Giá tiền" /></div>
      {pp != null && pp > 0 && <PaymentPicker method={paymentMethod} setMethod={setPaymentMethod} accountId={accountId} setAccountId={setAccountId} />}
      {pp != null && pp > 0 && <div className="flex items-center gap-1 bg-gold2 text-gold border border-gold/20 rounded-md px-2 py-1 text-[10px] font-medium mb-2 a-pop"><Ic d={P.wallet} size={11} /> Vào chi tiêu</div>}
      <div className="flex gap-2">
        <button onClick={() => setStep(1)} className="py-2.5 px-4 rounded-lg bg-bg2 border border-line text-mute font-bold active:scale-[0.98] min-h-[48px]">← Quay lại</button>
        <button onClick={doSave} className="flex-1 py-2.5 rounded-lg bg-ink text-bg font-bold active:scale-[0.98] min-h-[48px]">Thêm bữa ăn</button>
      </div>
    </>)}
  </Wrap>);
}

function ActModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [cat, setCat] = useState("work"); const [ti, setTi] = useState(""); const [dur, setDur] = useState(""); const [st, setSt] = useState("");
  return (<Wrap title="Thêm hoạt động" onClose={onClose}>
    <div className="flex flex-wrap gap-1 mb-2.5">{ACTS.map(c => (<button key={c.value} onClick={() => setCat(c.value)} className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${cat === c.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}>{c.emoji} {c.label}</button>))}</div>
    <input type="text" value={ti} onChange={e => setTi(e.target.value)} placeholder="Hoạt động" autoFocus className={`${ic} mb-2`} />
    <div className="flex gap-1.5 mb-2.5"><input type="time" value={st} onChange={e => setSt(e.target.value)} className={`${ic} flex-1`} /><input type="number" value={dur} onChange={e => setDur(e.target.value)} placeholder="Phút" className={`${ic} flex-1`} /></div>
    <button onClick={() => { if (!ti.trim()) return; S.addActivity({ date, category: cat, title: ti.trim(), description: null, durationMinutes: dur ? parseInt(dur) : null, startTime: st || null, endTime: null }); onDone(); }} disabled={!ti.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98]">Thêm</button>
  </Wrap>);
}

function ExpModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const accounts = S.getMoneyAccounts();
  const initialCash = accounts.find(a => a.type === "cash");
  const initialAccount = accounts.find(a => a.type !== "cash");
  const [cat, setCat] = useState("food"); const [ds, setDs] = useState(""); const [am, setAm] = useState(""); const [im, setIm] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "account">(initialCash ? "cash" : "account");
  const [accountId, setAccountId] = useState(initialCash?.id || initialAccount?.id || "");
  const p = parseMoney(am);
  const expPresets = S.getExpensePresets();
  return (<Wrap title="Thêm chi tiêu" onClose={onClose}>
    {expPresets.length > 0 && (
      <div className="mb-2">
        <div className="text-[9px] text-mute font-bold mb-1">Mẫu nhanh:</div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {expPresets.map(p => (
            <button key={p.id} type="button" onClick={() => { setDs(p.description); setAm(String(p.amount)); setCat(p.category); }}
              className="shrink-0 flex flex-col items-start px-2 py-1.5 bg-bg2 border border-line rounded-lg text-[9px] font-bold min-h-[36px] active:scale-95 text-left">
              <span>{EXPS.find(x => x.value === p.category)?.emoji} {p.description}</span>
              <span className="text-mute font-normal tnum">{fmtCurrency(p.amount)}</span>
            </button>
          ))}
        </div>
      </div>
    )}
    <div className="flex flex-wrap gap-1 mb-2.5">{EXPS.map(c => (<button key={c.value} onClick={() => setCat(c.value)} className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${cat === c.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}>{c.emoji} {c.label}</button>))}</div>
    <ImgP value={im} onChange={setIm} />
    <input type="text" value={ds} onChange={e => setDs(e.target.value)} placeholder="Mô tả" autoFocus className={`${ic} mb-2`} />
    <div className="mb-2"><MoneyIn value={am} onChange={setAm} placeholder="Số tiền" /></div>
    {p != null && p > 0 && <PaymentPicker method={paymentMethod} setMethod={setPaymentMethod} accountId={accountId} setAccountId={setAccountId} />}
    {/* Save as preset */}
    {ds.trim() && p != null && p > 0 && (
      <button type="button" onClick={() => { S.addExpensePreset({ description: ds.trim(), amount: p, category: cat }); alert("Đã lưu mẫu!"); }}
        className="w-full py-1.5 mb-2 bg-green2 border border-green/20 text-green rounded-md text-[9px] font-bold min-h-[36px] active:scale-95">
        + Lưu thành mẫu (dùng lại)
      </button>
    )}
    <button onClick={async () => {
      if (!ds.trim() || p == null || p <= 0) return;
      try {
        const exp = S.addExpense({ date, category: cat, description: ds.trim(), amount: p, image: im, paymentMethod, accountId: accountId || null, mealId: null });
        if (im) await saveImage(`img_${exp.id}`, im);
        onDone();
      } catch { alert("Lỗi lưu."); }
    }} disabled={!ds.trim() || p == null || p <= 0} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px]">{p != null && p > 0 ? `Thêm · ${fmtCurrency(p)}` : "Thêm"}</button>
  </Wrap>);
}

/* ═══ DEBT SECTION ═══ */
function DebtSection({ onChanged }: { onChanged: () => void }) {
  const [modal, setModal] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debts = S.getDebts();
  const total = debts.reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);

  const prInfo = [
    { v: 0, l: "Thấp", c: "border-line text-mute" },
    { v: 1, l: "Trung bình", c: "border-blue/40 text-blue" },
    { v: 2, l: "Cao", c: "border-gold/40 text-gold" },
    { v: 3, l: "🔴 Khẩn", c: "border-red/40 text-red" },
  ];

  return (
    <div className="bg-card rounded-lg border border-line overflow-hidden">
      <div className="flex items-center px-2.5 py-2 gap-2 border-b border-line">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left min-h-[36px]">
          <span className="w-6 h-6 rounded-md bg-red2 border border-red/20 flex items-center justify-center text-red shrink-0"><Ic d={P.wallet} size={12} /></span>
          <span className="font-bold text-xs">Quản lý nợ</span>
          {total > 0 && <span className="ml-auto text-[10px] text-red font-bold tnum">{fmtCurrency(total)}</span>}
          <Ic d={P.down} size={10} cls={`text-mute2 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => setModal("add")} className="w-8 h-8 rounded-md bg-ink text-bg flex items-center justify-center active:scale-90 shrink-0"><Ic d={P.plus} size={13} sw={2.5} /></button>
      </div>

      {open && debts.length > 0 && (
        <div className="px-2.5 py-2 bg-red/5 border-b border-line flex items-center justify-between">
          <span className="text-[10px] text-mute font-bold">TỔNG CÒN NỢ</span>
          <span className="font-bold text-base text-red tnum">{fmtCurrency(total)}</span>
        </div>
      )}

      {open && (debts.length === 0 ? (
        <div className="px-3 py-3 text-center text-mute text-[10px]">Chưa có khoản nợ. Thêm để theo dõi.</div>
      ) : debts.map(d => {
        const remaining = Math.max(0, d.totalAmount - d.paidAmount);
        const pct = d.totalAmount > 0 ? Math.round((d.paidAmount / d.totalAmount) * 100) : 0;
        const isOverdue = d.dueDate && d.dueDate < formatDate(new Date()) && remaining > 0;
        const pr = prInfo[d.priority || 0];
        return (
          <div key={d.id} className={`px-2.5 py-2 border-b border-line/30 last:border-0 ${isOverdue ? "bg-red/5" : ""}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold">{d.creditor}</span>
                  <span className={`text-[8px] px-1 py-0.5 rounded font-bold border ${pr.c}`}>{pr.l}</span>
                  {isOverdue && <span className="text-[8px] text-red font-bold a-blink">QUÁ HẠN</span>}
                </div>
                <div className="text-[9px] text-mute">{d.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-red tnum">{fmtCurrency(remaining)}</span>
                  <span className="text-[8px] text-mute tnum">/ {fmtCurrency(d.totalAmount)}</span>
                  {d.dueDate && <span className={`text-[8px] tnum ${isOverdue ? "text-red font-bold" : "text-mute"}`}>Hạn: {fmtDateDisp(d.dueDate)}</span>}
                </div>
                <div className="h-1 bg-bg2 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {remaining > 0 && <button onClick={() => { const v = prompt(`Trả khoản nợ "${d.creditor}" (còn ${fmtCurrency(remaining)}):`, ""); const n = v ? parseMoney(v) : null; if (n != null && n > 0) { S.payDebt(d.id, n); onChanged(); } }} className="px-2 py-1.5 bg-green2 border border-green/20 text-green rounded-md text-[9px] font-bold min-h-[32px] active:scale-95">Trả</button>}
                <button onClick={() => { if (confirm("Xóa khoản nợ?")) { S.deleteDebt(d.id); onChanged(); } }} className="text-mute2 hover:text-red min-w-[32px] min-h-[24px] flex items-center justify-center"><Ic d={P.x} size={10} /></button>
              </div>
            </div>
          </div>
        );
      }))}

      {modal === "add" && <AddDebtModal onDone={() => { onChanged(); setModal(null); }} onClose={() => setModal(null)} />}
    </div>
  );
}

function AddDebtModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [creditor, setCreditor] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(1);
  const [rate, setRate] = useState("");
  const p = parseMoney(amount);
  return (
    <Wrap title="Thêm khoản nợ" onClose={onClose}>
      <input type="text" value={creditor} onChange={e => setCreditor(e.target.value)} placeholder="Ngân hàng / tên người" autoFocus className={`${ic} mb-2`} />
      <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Khoản nợ gì (thẻ tín dụng, vay...)" className={`${ic} mb-2`} />
      <div className="mb-2"><MoneyIn value={amount} onChange={setAmount} placeholder="Tổng số nợ" /></div>
      <label className="block text-[9px] text-mute font-bold mb-1">Hạn cuối thanh toán</label>
      <input type="date" value={dueDate} min={S.getAllDataDates()[0] || formatDate(new Date())} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-3 rounded-lg bg-bg2 border border-line text-base outline-none focus:border-ink min-h-[52px] mb-2" />
      <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="Lãi suất %/năm (tùy chọn)" className={`${ic} mb-2`} />
      <div className="grid grid-cols-4 gap-1 mb-2.5">
        {[{ v: 0, l: "Thấp" }, { v: 1, l: "TB" }, { v: 2, l: "Cao" }, { v: 3, l: "🔴 Khẩn" }].map(p => (
          <button key={p.v} type="button" onClick={() => setPriority(p.v)} className={`py-2 rounded-md text-[10px] font-bold min-h-[40px] border ${priority === p.v ? "bg-ink text-bg border-ink" : "bg-bg2 border-line text-mute"}`}>{p.l}</button>
        ))}
      </div>
      <button type="button" onClick={() => { if (!creditor.trim() || p == null) return; S.addDebt({ creditor: creditor.trim(), description: desc.trim() || "Nợ", totalAmount: p, dueDate: dueDate || null, priority, interestRate: rate ? parseFloat(rate) : null }); onDone(); }} disabled={!creditor.trim() || p == null} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px]">Thêm khoản nợ</button>
    </Wrap>
  );
}

function AddHabitModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [desc, setDesc] = useState("");
  const [targetStr, setTargetStr] = useState("");
  const [unit, setUnit] = useState("");
  const presets = [
    { n: "Uống nước", e: "💧", d: "8 cốc/ngày", t: 8, u: "cốc" },
    { n: "Tập gym", e: "💪", d: "Chest + Shoulder", t: 4, u: "sets" },
    { n: "Đọc sách", e: "📖", d: "30 phút/ngày", t: 30, u: "phút" },
    { n: "Chạy bộ", e: "🏃", d: "5km", t: 5, u: "km" },
    { n: "Uống thuốc", e: "💊", d: "Sau bữa ăn", t: 1, u: "lần" },
    { n: "Thiền", e: "🧘", d: "10 phút sáng", t: 10, u: "phút" },
  ];
  return (<Wrap title="Thêm thói quen" onClose={onClose}>
    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
      {presets.map(p => (
        <button key={p.n} type="button" onClick={() => { S.addHabit(p.n, p.e, p.d, date, p.t, p.u); onDone(); }}
          className="flex flex-col items-center gap-0.5 py-2 bg-bg2 border border-line rounded-lg text-[9px] font-bold min-h-[52px] active:scale-95 hover:border-ink transition-all">
          <span className="text-base">{p.e}</span><span>{p.n}</span><span className="text-[8px] text-mute font-normal">{p.t} {p.u}</span>
        </button>
      ))}
    </div>
    <div className="text-[9px] text-mute2 font-bold uppercase tracking-widest mb-1">Tự tạo:</div>
    <div className="grid grid-cols-5 gap-1 mb-2">{["✅","📖","🏃","💊","🧘","💪","💧","🎯","✍️","🛌","🧹","💤","🍎","🚫","💻"].map(e => (<button key={e} type="button" onClick={() => setEmoji(e)} className={`h-8 rounded-md flex items-center justify-center text-sm transition-all ${emoji === e ? "bg-ink text-bg" : "bg-bg2 border border-line"}`}>{e}</button>))}</div>
    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên thói quen" autoFocus className={`${ic} mb-2`} />
    <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Chi tiết / cách thực hiện" className={`${ic} mb-2`} />
    <div className="flex gap-2 mb-2.5">
      <input type="number" value={targetStr} onChange={e => setTargetStr(e.target.value)} placeholder="Mục tiêu" className={`${ic} flex-1`} />
      <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Đơn vị (lần, phút, km...)" className={`${ic} flex-1`} />
    </div>
    <button type="button" onClick={() => { if (!name.trim()) return; S.addHabit(name.trim(), emoji, desc.trim() || null, date, targetStr ? parseInt(targetStr) : null, unit.trim() || null); onDone(); }} disabled={!name.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px]">Thêm thói quen</button>
  </Wrap>);
}

function QNModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (<Wrap title="Ghi nhanh" onClose={onClose}>
    <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Ghi nhanh..." autoFocus className={`${ic} mb-2.5`} onKeyDown={e => { if (e.key === "Enter" && text.trim()) { S.addQuickNote(date, text.trim()); onDone(); } }} />
    <button onClick={() => { if (!text.trim()) return; S.addQuickNote(date, text.trim()); onDone(); }} disabled={!text.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98]">Ghi</button>
  </Wrap>);
}

function addDaysStr(base: string, days: number): string {
  const d = new Date(base + "T00:00:00"); d.setDate(d.getDate() + days); return formatDate(d);
}

function InvModal({ date, exps: dayExps, onClose }: { date: string; exps: S.Expense[]; onClose: () => void }) {
  const [range, setRange] = useState<"day" | "week" | "month" | "custom">("day");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const dataDates = new Set<string>();
  S.getExpenses().forEach(e => dataDates.add(e.date));
  S.getActivities().forEach(a => dataDates.add(a.date));
  S.getMeals().forEach(m => dataDates.add(m.date));
  const sortedDates = Array.from(dataDates).sort();

  // Determine available date range from actual data
  const dataFirst = sortedDates.length > 0 ? sortedDates[0] : date;
  const dataLast = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : date;

  // Week: 7 days ending at viewed date — only if first data date is at least 7 days before
  const weekFrom = addDaysStr(date, -6);
  const hasWeekData = sortedDates.some(d => d >= weekFrom && d <= date);
  const canWeek = weekFrom >= dataFirst && hasWeekData;

  // Month: viewed date's calendar month
  const monthStart = date.slice(0, 7) + "-01";
  const monthD = new Date(date + "T00:00:00");
  const monthEnd = `${monthD.getFullYear()}-${String(monthD.getMonth() + 1).padStart(2, "0")}-${String(new Date(monthD.getFullYear(), monthD.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const hasMonthData = sortedDates.some(d => d >= monthStart && d <= monthEnd);
  const canMonth = hasMonthData && monthStart >= dataFirst;

  let from = date, to = date, rangeLabel = fmtDateFull(date), blocked = "";

  if (range === "day") { from = date; to = date; rangeLabel = fmtDateFull(date); }
  else if (range === "week") {
    if (!canWeek) blocked = "Tuần này chưa có dữ liệu.";
    else { from = weekFrom; to = date; rangeLabel = `${fmtDateDisp(from)} → ${fmtDateDisp(to)}`; }
  }
  else if (range === "month") {
    if (!canMonth) blocked = "Tháng này chưa có dữ liệu.";
    else { from = monthStart; to = monthEnd; rangeLabel = `Tháng ${monthD.getMonth() + 1}/${monthD.getFullYear()}`; }
  }
  else { if (picked.size === 0) blocked = "Chọn ít nhất 1 ngày."; else { const arr = Array.from(picked).sort(); from = arr[0]; to = arr[arr.length - 1]; rangeLabel = arr.length === 1 ? fmtDateFull(from) : `${arr.length} ngày · ${fmtDateDisp(from)} → ${fmtDateDisp(to)}`; } }

  const allExps = blocked ? [] : range === "custom" ? S.getExpenses().filter(e => picked.has(e.date)) : range === "day" ? dayExps : S.getExpenses().filter(e => e.date >= from && e.date <= to);
  const total = allExps.reduce((s, e) => s + e.amount, 0);
  const count = allExps.length;
  const byDate: Record<string, S.Expense[]> = {};
  allExps.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
  const dateKeys = Object.keys(byDate).sort();
  const isMultiDay = dateKeys.length > 1;

  const toggleDate = (d: string) => { const n = new Set(picked); if (n.has(d)) n.delete(d); else n.add(d); setPicked(n); };

  const downloadInvoice = () => {
    const W = 700, M = 48, LH = 28;
    const cv = document.createElement("canvas"); const cx = cv.getContext("2d")!;
    cv.width = W; cv.height = 8000;
    // Cream background
    cx.fillStyle = "#fdf9f3"; cx.fillRect(0, 0, W, 8000);

    let y = 0;
    // Top gold bar
    cx.fillStyle = "#d4a843"; cx.fillRect(0, 0, W, 6);
    y = 40;

    // Logo area
    cx.textAlign = "center";
    cx.font = "bold 32px sans-serif"; cx.fillStyle = "#1a1a1a";
    cx.fillText("JAY TRACKER", W / 2, y); y += 24;
    cx.font = "14px sans-serif"; cx.fillStyle = "#8a7a5a";
    cx.fillText("━━━ HÓA ĐƠN CHI TIÊU ━━━", W / 2, y); y += 24;
    cx.font = "13px sans-serif"; cx.fillStyle = "#666666";
    cx.fillText(rangeLabel, W / 2, y); y += 12;
    cx.fillText(`${count} khoản chi`, W / 2, y); y += 24;

    // Gold line
    cx.fillStyle = "#d4a843"; cx.fillRect(M, y, W - 2 * M, 2); y += 16;

    // Column headers
    cx.textAlign = "left"; cx.font = "bold 11px sans-serif"; cx.fillStyle = "#8a7a5a";
    cx.fillText("#", M, y); cx.fillText("Mô tả", M + 30, y); cx.fillText("Loại", W - M - 130, y);
    cx.textAlign = "right"; cx.fillText("Số tiền", W - M, y);
    cx.textAlign = "left"; y += 6;
    cx.fillStyle = "#e8dcc8"; cx.fillRect(M, y, W - 2 * M, 1); y += 12;

    let no = 0;
    dateKeys.forEach((dk, di) => {
      const items = byDate[dk]; const dayTotal = items.reduce((s, e) => s + e.amount, 0);
      // Day header
      if (isMultiDay) {
        if (di > 0) y += 6;
        cx.fillStyle = "#f0e8d8"; cx.fillRect(M - 8, y - 4, W - 2 * M + 16, 30);
        // Left: date
        cx.font = "bold 13px sans-serif"; cx.fillStyle = "#4a3f2a";
        cx.fillText("▸ " + fmtDateDisp(dk), M + 4, y + 16);
        // Right: day total
        cx.textAlign = "right"; cx.fillStyle = "#b44"; cx.font = "bold 13px sans-serif";
        cx.fillText(fmtCurrency(dayTotal), W - M - 4, y + 16);
        cx.textAlign = "left"; y += 36;
      }
      // Items
      items.forEach(it => {
        no++;
        const ec = EXPS.find(x => x.value === it.category);
        // Zebra
        if (no % 2 === 0) { cx.fillStyle = "#f8f4ec"; cx.fillRect(M - 4, y - 4, W - 2 * M + 8, LH); }
        // Number
        cx.font = "11px sans-serif"; cx.fillStyle = "#bbb0a0";
        cx.fillText(String(no).padStart(2, "0"), M, y + 16);
        // Description
        cx.font = "14px sans-serif"; cx.fillStyle = "#2a2a2a";
        const desc = it.description;
        cx.fillText(desc.length > 28 ? desc.slice(0, 26) + "…" : desc, M + 30, y + 16);
        // Category
        cx.font = "11px sans-serif"; cx.fillStyle = "#8a7a5a";
        cx.fillText(ec?.label || "", W - M - 130, y + 16);
        // Amount
        cx.textAlign = "right"; cx.font = "bold 13px sans-serif"; cx.fillStyle = "#333333";
        cx.fillText(fmtCurrency(it.amount), W - M, y + 16);
        cx.textAlign = "left";
        y += LH;
      });
      // Day separator
      if (isMultiDay) {
        cx.fillStyle = "#e8dcc8"; cx.fillRect(M, y + 2, W - 2 * M, 1); y += 8;
      }
    });

    // Total section
    y += 12;
    cx.fillStyle = "#d4a843"; cx.fillRect(M, y, W - 2 * M, 2); y += 4;
    cx.fillStyle = "#d4a843"; cx.fillRect(M, y, W - 2 * M, 2); y += 20;

    // Total row
    cx.fillStyle = "#f0e8d8"; cx.fillRect(M - 8, y - 8, W - 2 * M + 16, 44);
    cx.font = "bold 18px sans-serif"; cx.fillStyle = "#1a1a1a";
    cx.fillText("TỔNG CỘNG", M + 4, y + 16);
    cx.textAlign = "right";
    cx.font = "bold 32px sans-serif"; cx.fillStyle = "#b44";
    cx.fillText(fmtCurrency(total), W - M - 4, y + 20);
    cx.textAlign = "left"; y += 52;

    // Footer
    cx.fillStyle = "#e8dcc8"; cx.fillRect(M, y, W - 2 * M, 1); y += 16;
    cx.textAlign = "center"; cx.font = "12px sans-serif"; cx.fillStyle = "#aaa090";
    cx.fillText(rangeLabel, W / 2, y); y += 16;
    cx.font = "bold 12px sans-serif"; cx.fillStyle = "#8a7a5a";
    cx.fillText("Jay Tracker", W / 2, y); y += 24;

    // Bottom gold bar
    cx.fillStyle = "#d4a843"; cx.fillRect(0, y, W, 6); y += 12;

    // Crop & download
    const out = document.createElement("canvas"); out.width = W; out.height = y;
    const ox = out.getContext("2d")!;
    ox.fillStyle = "#fdf9f3"; ox.fillRect(0, 0, W, y);
    ox.drawImage(cv, 0, 0);

    out.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = "hoa-don-" + (from === to ? from : from + "-" + to) + ".png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/png");
  };

  return (<Wrap title="Xuất hóa đơn" onClose={onClose}>
    <div className="flex gap-1 mb-2.5">
      {([["day", "Ngày"], ["week", canWeek ? "Tuần" : "Tuần 🔒"], ["month", canMonth ? "Tháng" : "Tháng 🔒"], ["custom", "Gộp ngày"]] as const).map(([v, l]) => (
        <button key={v} onClick={() => { if (v === "week" && !canWeek) return; if (v === "month" && !canMonth) return; if (v === "custom") setPicked(new Set([date])); setRange(v); }}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${range === v ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"} ${(v === "week" && !canWeek) || (v === "month" && !canMonth) ? "opacity-40" : ""}`}>{l}</button>
      ))}
    </div>

    {range === "custom" && (
      <div className="mb-2.5">
        <div className="text-[10px] text-mute mb-1.5">Chạm chọn / bỏ chọn ngày muốn gộp hóa đơn:</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {sortedDates.map(d => {
            const on = picked.has(d); const dd = new Date(d + "T00:00:00");
            return <button key={d} onClick={() => toggleDate(d)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tnum transition-all active:scale-95 ${on ? "bg-ink text-bg ring-2 ring-ink/40" : "bg-bg2 text-mute border border-line"}`}>
              {dd.getDate()}/{dd.getMonth() + 1}
            </button>;
          })}
        </div>
        {picked.size > 0 && <div className="text-[10px] text-green mt-1.5 font-semibold">Đã chọn {picked.size} ngày</div>}
      </div>
    )}

    {blocked && <div className="mb-2.5 rounded-md border border-gold/30 bg-gold2 px-2.5 py-2 text-[11px] text-gold font-medium">{blocked}</div>}

    {!blocked && <div className="text-center mb-2">
      <div className="text-[10px] text-mute">{rangeLabel}</div>
      <div className="font-bold text-xl text-red tnum mt-0.5">{fmtCurrency(total)}</div>
      <div className="text-[10px] text-mute">{count} khoản</div>
    </div>}

    {!blocked && count === 0 ? <p className="text-center text-mute text-xs py-3">Không có chi tiêu</p> : !blocked && count > 0 ? (<>
      <div className="space-y-2 max-h-[28vh] overflow-y-auto">
        {dateKeys.map(dk => {
          const items = byDate[dk]; const dayTot = items.reduce((s, e) => s + e.amount, 0);
          return (<div key={dk}>
            {isMultiDay && <div className="flex items-center justify-between text-[11px] font-bold mb-0.5 bg-bg2 rounded px-2 py-1"><span>{fmtDateDisp(dk)}</span><span className="text-red tnum">{fmtCurrency(dayTot)}</span></div>}
            {items.map(it => { const ec = EXPS.find(x => x.value === it.category); return <div key={it.id} className="flex items-center justify-between pl-3 py-0.5 text-[11px]"><span className="truncate flex-1">{ec?.emoji} {it.description}</span><span className="text-mute tnum shrink-0 ml-2">{fmtCurrency(it.amount)}</span></div>; })}
          </div>);
        })}
      </div>
      <div className="border-t border-dashed border-line mt-2.5 pt-2 flex items-center justify-between">
        <span className="font-bold text-sm uppercase">Tổng</span>
        <span className="font-bold text-lg text-red tnum">{fmtCurrency(total)}</span>
      </div>
      <button onClick={downloadInvoice} className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 bg-ink hover:bg-accent text-bg rounded-lg text-xs font-bold transition-colors active:scale-[0.98]">
        <Ic d={P.dl} size={14} /> Tải hóa đơn
      </button>
    </>) : null}
  </Wrap>);
}

/* ═══ ADD PLAN MODAL ═══ */
function AddPlanModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [time, setTime] = useState("");
  const [cat, setCat] = useState("work");
  const [priority, setPriority] = useState(0);
  const [budgetStr, setBudgetStr] = useState("");
  const budgetParsed = parseMoney(budgetStr);
  const [remind, setRemind] = useState(false);
  const [remindDate, setRemindDate] = useState(date);
  const [remindColor, setRemindColor] = useState("#ffa502");
  const [remindNote, setRemindNote] = useState("");

  const doSave = () => {
    if (!title.trim()) return;
    const plan = S.addPlan({ date, time: time || null, title: title.trim(), detail: detail.trim() || null, category: cat, priority, budget: budgetParsed });
    if (remind) S.addReminder({ planId: plan.id, planDate: date, planTitle: title.trim(), planTime: time || null, planDetail: detail.trim() || null, remindAt: remindDate, color: remindColor, attachment: remindNote.trim() || null });
    onDone();
  };

  return (<Wrap title={step === 1 ? `Kế hoạch · ${fmtDateDisp(date)}` : "Chi tiết & nhắc nhở"} onClose={onClose}>
    {step === 1 ? (<>
      {/* User-created quick plans */}
      {S.getPlanPresets().length > 0 && <div className="mb-2.5"><div className="text-[9px] text-mute font-bold mb-1">Mẫu kế hoạch của tôi:</div><div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">{S.getPlanPresets().map(p=><div key={p.id} className="relative"><button type="button" onClick={()=>{S.applyPlanPreset(p.id,date);onDone();}} className="w-full min-h-[48px] text-left bg-bg2 border border-line rounded-lg px-2 py-1.5 active:scale-95"><div className="flex items-center gap-1"><CI cat={p.category} size={12}/><span className="text-[10px] font-bold truncate">{p.title}</span></div><div className="text-[8px] text-mute tnum">{p.time||"Không giờ"}{p.detail?` · ${p.detail}`:""}</div></button><button type="button" onClick={()=>{if(confirm("Xóa mẫu?"))S.deletePlanPreset(p.id);}} className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-mute hover:text-red"><Ic d={P.x} size={9}/></button></div>)}</div></div>}
      {/* Step 1: user-defined plan only */}
      <div className="text-[9px] text-mute font-bold mb-1">Chọn loại kế hoạch (tối đa 8 icon):</div>
      <div className="grid grid-cols-4 gap-1.5 mb-2.5">{ACTS.slice(0, 8).map(c => (<button type="button" key={c.value} onClick={() => setCat(c.value)} className={`flex flex-col items-center justify-center py-2 rounded-lg text-[8px] font-bold min-h-[48px] transition-all ${cat === c.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}><CI cat={c.value} size={15} />{c.label}</button>))}</div>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề" autoFocus className={`${ic} mb-2`} />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${ic} mb-2 min-h-[44px]`} />
      <div className="flex gap-2">
        <button type="button" onClick={doSave} disabled={!title.trim()} className="flex-1 py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px]">Thêm nhanh</button>
        <button type="button" onClick={() => setStep(2)} disabled={!title.trim()} className="flex-1 py-2.5 rounded-lg bg-bg2 border border-line text-ink font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px] text-[11px]">Chi tiết →</button>
      </div>
    </>) : (<>
      {/* Step 2: Priority + budget + reminder */}
      <div className="bg-bg2 rounded-lg px-2.5 py-1.5 mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-medium"><CI cat={cat} size={12} /> {title}</span>
        {time && <span className="text-[10px] text-mute tnum">{time}</span>}
      </div>
      <input type="text" value={detail} onChange={e => setDetail(e.target.value)} placeholder="Chi tiết / mục tiêu" className={`${ic} mb-2`} />
      <div className="mb-2"><MoneyIn value={budgetStr} onChange={setBudgetStr} placeholder="Chi phí dự kiến" /></div>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {[{ v: 0, l: "Bình thường" }, { v: 1, l: "⚠️ Quan trọng" }, { v: 2, l: "🔴 Gấp" }].map(p => (
          <button type="button" key={p.v} onClick={() => setPriority(p.v)} className={`py-2 rounded-md text-[10px] font-bold min-h-[40px] transition-all border ${priority === p.v ? "bg-ink text-bg border-ink" : "bg-bg2 border-line text-mute"}`}>{p.l}</button>
        ))}
      </div>
      {/* Reminder */}
      <button type="button" onClick={() => setRemind(!remind)} className={`w-full py-2 rounded-md text-[10px] font-bold min-h-[40px] mb-1.5 transition-all border ${remind ? "bg-gold2 border-gold/30 text-gold" : "bg-bg2 border-line text-mute"}`}>
        🔔 {remind ? "Nhắc nhở: BẬT" : "Thêm nhắc nhở"}
      </button>
      {remind && (() => {
        const today = formatDate(new Date());
        const daysUntilPlan = Math.round((new Date(date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
        const daysUntilRemind = Math.round((new Date(date + "T00:00:00").getTime() - new Date(remindDate + "T00:00:00").getTime()) / 86400000);
        // Generate valid day options: 0 to daysUntilPlan, skip if too close (<0) or too far
        const dayOptions = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30].filter(d => d <= daysUntilPlan && d >= 0);
        return (
          <div className="bg-bg2 rounded-lg p-2 border border-line space-y-1.5 mb-2">
            <div className="text-[9px] text-mute">Plan: <span className="text-ink font-bold">{fmtDateDisp(date)}</span> · {daysUntilPlan > 0 ? `còn ${daysUntilPlan} ngày` : "hôm nay"}</div>
            <div className="text-[9px] text-mute">Nhắc: <span className="text-gold font-bold">{fmtDateDisp(remindDate)}</span>{daysUntilRemind > 0 ? ` (${daysUntilRemind} ngày trước plan)` : " (ngày plan)"}</div>
            <div className="flex flex-wrap gap-1">
              {dayOptions.map(d => {
                const target = addDaysStr(date, -d);
                const label = d === 0 ? "Ngày plan" : `${d} ngày trước`;
                return <button key={d} type="button" onClick={() => setRemindDate(target)}
                  className={`px-2 py-1.5 rounded-md text-[9px] font-bold min-h-[32px] active:scale-95 ${remindDate === target ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{label}</button>;
              })}
            </div>
            <div className="flex gap-1.5">
              <input type="date" value={remindDate} min={S.getAllDataDates()[0] || formatDate(new Date())} onChange={e => setRemindDate(e.target.value)} className="flex-1 px-2 py-1.5 rounded-md bg-card border border-line text-xs outline-none min-h-[40px]" />
              <input type="color" value={remindColor} onChange={e => setRemindColor(e.target.value)} className="w-10 h-10 rounded-md border border-line cursor-pointer" />
            </div>
            <input type="text" value={remindNote} onChange={e => setRemindNote(e.target.value)} placeholder="Ghi chú" className="w-full px-2 py-1.5 rounded-md bg-card border border-line text-xs outline-none" />
          </div>
        );
      })()}
      <button type="button" onClick={()=>{S.addPlanPreset({title:title.trim(),detail:detail.trim()||null,time:time||null,category:cat,priority,budget:budgetParsed});alert("Đã lưu mẫu kế hoạch!");}} className="w-full min-h-[38px] mb-1.5 bg-green2 border border-green/20 text-green rounded-lg text-[9px] font-bold">Lưu làm mẫu thêm nhanh</button>
      <div className="flex gap-2">
        <button type="button" onClick={() => setStep(1)} className="py-2.5 px-4 rounded-lg bg-bg2 border border-line text-mute font-bold active:scale-[0.98] min-h-[48px]">←</button>
        <button type="button" onClick={doSave} className="flex-1 py-2.5 rounded-lg bg-ink text-bg font-bold active:scale-[0.98] min-h-[48px]">Thêm kế hoạch</button>
      </div>
    </>)}
  </Wrap>);
}

/* ═══ ADD SCHEDULE TEMPLATE MODAL ═══ */
function AddScheduleModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<S.ScheduleBlock[]>([
    { time: "06:00", endTime: "07:00", title: "Tập luyện", category: "exercise" },
    { time: "07:00", endTime: "07:30", title: "Ăn sáng", category: "eat" },
    { time: "08:00", endTime: "12:00", title: "Làm việc", category: "work" },
  ]);

  const addBlock = () => {
    const lastTime = blocks.length > 0 ? blocks[blocks.length - 1].endTime || blocks[blocks.length - 1].time : "08:00";
    setBlocks([...blocks, { time: lastTime, endTime: "", title: "", category: "work" }]);
  };
  const removeBlock = (i: number) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const updateBlock = (i: number, field: keyof S.ScheduleBlock, val: string) => {
    const nb = [...blocks]; (nb[i] as unknown as Record<string, string>)[field] = val; setBlocks(nb);
  };

  const allCats = [...ACTS, ...EXPS.filter(e => !ACTS.some(a => a.value === e.value))];
  const canSave = name.trim() && blocks.some(b => b.title.trim());

  return (<Wrap title="Tạo thời khóa biểu" onClose={onClose}>
    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên thời khóa biểu" autoFocus className={`${ic} mb-2.5`} />
    <div className="space-y-2 mb-2.5 max-h-[40vh] overflow-y-auto">
      {blocks.map((b, i) => (
        <div key={i} className="bg-bg2 rounded-lg p-2 border border-line space-y-1.5">
          <div className="flex gap-1.5 items-center">
            <input type="time" value={b.time} onChange={e => updateBlock(i, "time", e.target.value)} className="flex-1 px-2 py-2 rounded-md bg-card border border-line text-xs outline-none min-h-[40px]" />
            <span className="text-mute text-[10px]">→</span>
            <input type="time" value={b.endTime || ""} onChange={e => updateBlock(i, "endTime", e.target.value)} className="flex-1 px-2 py-2 rounded-md bg-card border border-line text-xs outline-none min-h-[40px]" />
            <button type="button" onClick={() => removeBlock(i)} className="text-mute2 hover:text-red min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-card border border-line"><Ic d={P.x} size={14} /></button>
          </div>
          <input type="text" value={b.title} onChange={e => updateBlock(i, "title", e.target.value)} placeholder="Hoạt động" className="w-full px-2 py-2 rounded-md bg-card border border-line text-xs outline-none min-h-[40px]" />
          <div className="grid grid-cols-5 gap-1">
            {allCats.slice(0, 10).map(c => (<button type="button" key={c.value} onClick={() => updateBlock(i, "category", c.value)} className={`flex flex-col items-center py-1.5 rounded-md text-[8px] font-bold min-h-[36px] ${b.category === c.value ? "bg-ink text-bg" : "bg-card text-mute border border-line"}`}><CI cat={c.value} size={12} />{c.label}</button>))}
          </div>
        </div>
      ))}
    </div>
    <button type="button" onClick={addBlock} className="w-full py-2.5 border border-dashed border-line rounded-lg text-[10px] text-mute hover:text-ink hover:border-ink font-bold mb-2.5 min-h-[44px]">+ Thêm khung giờ</button>
    <button type="button" onClick={() => { if (!canSave) return; S.addSchedule(name.trim(), blocks.filter(b => b.time || b.title.trim()), date); onDone(); }} disabled={!canSave} className="w-full py-3 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98] min-h-[48px] text-sm">Lưu thời khóa biểu</button>
  </Wrap>);
}

/* ═══ SCHEDULE SECTION — templates + apply ═══ */
function ScheduleSection({ date, onApply }: { date: string; onApply: () => void }) {
  const [modal, setModal] = useState(false);
  const schedules = S.getSchedulesForDate(date);

  return (
    <div className="bg-card rounded-lg border border-line overflow-hidden">
      <div className="flex items-center px-2.5 py-2 gap-2 border-b border-line">
        <span className="w-6 h-6 rounded-md bg-bg2 border border-line flex items-center justify-center text-mute shrink-0"><Ic d={P.clock} size={12} /></span>
        <span className="font-bold text-xs flex-1">Thời khóa biểu</span>
        <button onClick={() => setModal(true)} className="w-8 h-8 rounded-md bg-ink text-bg flex items-center justify-center active:scale-90"><Ic d={P.plus} size={14} sw={2.5} /></button>
      </div>
      {schedules.length === 0 ? (
        <div className="px-3 py-3 text-center text-mute text-[11px]">Tạo thời khóa biểu mẫu (Gym, Làm việc...) rồi áp dụng nhanh cho bất kỳ ngày nào.</div>
      ) : (
        <div className="divide-y divide-line/40">
          {schedules.map(s => (
            <div key={s.id} className="px-2.5 py-2 flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium">{s.name}</div>
                <div className="text-[10px] text-mute">{s.items.length} khung giờ · {s.items.map(b => b.time).join(", ")}</div>
              </div>
              <button onClick={() => { S.applySchedule(s.id, date); onApply(); }} className="px-4 py-2 bg-green2 border border-green/20 text-green rounded-md text-[10px] font-bold min-h-[40px] transition-colors active:scale-95">Áp dụng</button>
              <button onClick={() => { if (confirm("Xóa?")) { S.deleteSchedule(s.id); onApply(); } }} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"><Ic d={P.x} size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {modal && <AddScheduleModal date={date} onDone={() => { onApply(); setModal(false); }} onClose={() => setModal(false)} />}
    </div>
  );
}

/* ═══ COPY PLANS FROM ANOTHER DAY ═══ */
function CopyPlansSection({ currentDate, onCopy }: { currentDate: string; onCopy: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dates = S.getPlanDates().filter(d => d !== currentDate);
  if (dates.length === 0) return null;
  const previewPlans = preview ? S.getPlans(preview) : [];
  const many = dates.length > 4;

  return (
    <div className="bg-card rounded-lg border border-line p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-mute font-bold">Sao chép kế hoạch</span>
        <span className="text-[9px] text-mute tnum">{dates.length} ngày</span>
      </div>
      <div className={`grid ${many ? "grid-cols-1 divide-y divide-line/30" : "grid-cols-4"} gap-${many ? "0" : "1.5"} ${many && !expanded ? "max-h-[120px] overflow-hidden" : ""}`}>
        {(many && !expanded ? dates.slice(0, 3) : dates.slice(0, 12)).map(d => {
          const plans = S.getPlans(d);
          const isSel = preview === d;
          if (many) {
            return (
              <button key={d} onClick={() => setPreview(isSel ? null : d)}
                className={`flex items-center gap-2 px-2 py-2 text-left min-h-[44px] active:scale-[0.98] transition-all ${isSel ? "bg-ink/10" : "hover:bg-bg2"}`}>
                <span className="text-[11px] font-bold tnum w-12 shrink-0">{fmtDateDisp(d).split(",")[0]?.trim() || ""} {new Date(d + "T00:00:00").getDate()}/{new Date(d + "T00:00:00").getMonth() + 1}</span>
                <span className="flex-1 text-[10px] text-mute truncate">{plans.map(p => p.title).join(", ")}</span>
                <span className="text-[9px] text-mute shrink-0">{plans.length}</span>
              </button>
            );
          }
          return (
            <button key={d} onClick={() => setPreview(isSel ? null : d)}
              className={`py-2 border rounded-lg text-[10px] font-bold tnum min-h-[44px] active:scale-95 transition-all text-center ${isSel ? "bg-ink text-bg border-ink" : "bg-bg2 border-line hover:border-ink"}`}>
              {new Date(d + "T00:00:00").getDate()}/{new Date(d + "T00:00:00").getMonth() + 1}
              <div className={`text-[8px] font-normal ${isSel ? "text-bg/70" : "text-mute"}`}>{plans.length}</div>
            </button>
          );
        })}
      </div>
      {many && dates.length > 3 && !expanded && (
        <button onClick={() => setExpanded(true)} className="w-full py-1.5 text-[9px] text-mute font-bold mt-1 hover:text-ink">Xem thêm {dates.length - 3} ngày</button>
      )}
      {preview && previewPlans.length > 0 && (
        <div className="mt-2 bg-bg2 rounded-lg p-2 border border-line max-h-[200px] overflow-y-auto">
          <div className="text-[9px] text-mute font-bold mb-1">{fmtDateDisp(preview)} · {previewPlans.length} mục:</div>
          {previewPlans.map(p => (
            <div key={p.id} className="text-[10px] text-ink py-1 flex items-center gap-1.5 border-b border-line/20 last:border-0">
              <span className="tnum text-mute w-10 shrink-0 text-[9px]">{p.time || "—"}</span>
              <CI cat={p.category} size={11} />
              <span className="flex-1 font-medium">{p.title}</span>
              {p.detail && <span className="text-mute text-[9px] truncate max-w-[60px]">{p.detail}</span>}
            </div>
          ))}
          <button onClick={() => { S.copyPlans(preview, currentDate); setPreview(null); onCopy(); }}
            className="w-full mt-2 py-2 bg-ink text-bg rounded-md text-[10px] font-bold active:scale-95 min-h-[40px]">Sao chép {previewPlans.length} mục</button>
        </div>
      )}
    </div>
  );
}

/* ═══ PLAN LIST with priority, budget, result ═══ */
function PlanList({ plans, date, onChanged, onAdd }: { plans: S.PlanItem[]; date: string; onChanged: () => void; onAdd: () => void }) {
  const [resultId, setResultId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const totalBudget = plans.reduce((s, p) => s + (p.budget || 0), 0);
  const doneCount = plans.filter(p => p.done).length;
  const pct = plans.length > 0 ? Math.round((doneCount / plans.length) * 100) : 0;
  const isPast = date < formatDate(new Date());

  const priorityBadge = (p: number) => {
    if (p === 2) return <span className="text-[8px] bg-red/15 text-red border border-red/20 px-1 py-0.5 rounded font-bold shrink-0">GẤP</span>;
    if (p === 1) return <span className="text-[8px] bg-gold/15 text-gold border border-gold/20 px-1 py-0.5 rounded font-bold shrink-0">Q.TRỌNG</span>;
    return null;
  };

  // Next upcoming plan (today only)
  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isToday = date === formatDate(now);
  const nextPlan = isToday ? plans.find(p => !p.done && p.time && p.time > nowHM) : null;

  return (
    <div className="bg-card rounded-lg border border-line overflow-hidden">
      <div className="flex items-center px-2.5 py-2 gap-2 border-b border-line">
        <span className="font-bold text-xs flex-1">Kế hoạch ngày</span>
        {isPast && <span className="text-[9px] text-mute">Đã qua</span>}
        <span className="text-[9px] text-mute tnum">{doneCount}/{plans.length}</span>
        {!isPast && <button onClick={onAdd} className="w-8 h-8 rounded-md bg-ink text-bg flex items-center justify-center active:scale-90"><Ic d={P.plus} size={13} sw={2.5} /></button>}
      </div>

      {/* Next upcoming reminder */}
      {nextPlan && (
        <div className="px-2.5 py-1.5 bg-gold2 border-b border-gold/20 flex items-center gap-2">
          <span className="text-gold text-[10px] font-bold">⏰ Sắp tới:</span>
          <span className="text-[10px] text-gold font-bold tnum">{nextPlan.time}</span>
          <span className="text-[10px] text-gold truncate flex-1">{nextPlan.title}</span>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="px-3 py-4 text-center text-mute text-[11px]">Chưa có kế hoạch. Thêm mới hoặc áp dụng thời khóa biểu.</div>
      ) : (
        <div className="divide-y divide-line/40">
          {plans.map(p => (
            <div key={p.id} className="px-2.5 py-2 group">
              <div className="flex items-start gap-2.5">
                <button onClick={() => { if (!isPast) { S.togglePlan(p.id); onChanged(); } }} disabled={isPast} className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 shrink-0 mt-0.5 ${isPast ? "opacity-50" : ""} ${p.done ? "bg-green border-green text-bg" : (p.priority || 0) >= 2 ? "border-red" : (p.priority || 0) >= 1 ? "border-gold" : "border-line hover:border-ink"}`}>
                  {p.done && <Ic d={P.check} size={13} sw={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[12px] font-medium ${p.done ? "line-through text-mute" : ""}`}>{p.title}</span>
                    {priorityBadge(p.priority || 0)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-mute flex-wrap">
                    <CI cat={p.category} size={12} />
                    {p.time && <span className="tnum">{p.time}</span>}
                    {p.detail && <span className="truncate max-w-[150px]">{p.detail}</span>}
                    {p.budget != null && p.budget > 0 && <span className="bg-red2 text-red border border-red/20 px-1 py-0.5 rounded font-semibold tnum">{fmtCurrency(p.budget)}</span>}
                  </div>
                  {/* Result note */}
                  {p.done && p.result && <div className="mt-1 text-[10px] text-green bg-green2 border border-green/20 rounded px-1.5 py-0.5">✅ {p.result}</div>}
                  {p.done && !p.result && resultId !== p.id && (
                    <button onClick={() => { setResultId(p.id); setResultText(""); }} className="mt-1 text-[9px] text-mute hover:text-ink">+ Ghi kết quả</button>
                  )}
                  {resultId === p.id && (
                    <div className="flex gap-1.5 mt-1">
                      <input type="text" value={resultText} onChange={e => setResultText(e.target.value)} placeholder="Kết quả..." autoFocus className="flex-1 px-2 py-1 rounded-md bg-bg2 border border-line text-[10px] outline-none" />
                      <button onClick={() => { S.updatePlanResult(p.id, resultText); setResultId(null); onChanged(); }} className="px-2 py-1 bg-ink text-bg rounded-md text-[9px] font-bold min-h-[28px]">Lưu</button>
                    </div>
                  )}
                  {/* Day note — rep/set/custom note for this day only */}
                  {p.dayNote && <div className="mt-1 text-[10px] text-blue bg-blue2 border border-blue/20 rounded px-1.5 py-0.5">📝 {p.dayNote}</div>}
                  {!p.done && !isPast && (
                    <button onClick={() => { const n = prompt("Ghi chú hôm nay (rep, set, số lượng...):", p.dayNote || ""); if (n !== null) { S.updatePlanDayNote(p.id, n); onChanged(); } }} className="mt-1 text-[9px] text-mute hover:text-ink">+ Ghi chú ngày</button>
                  )}
                </div>
                {!isPast && <button onClick={() => { S.deletePlan(p.id); onChanged(); }} className="text-mute2 hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0 mt-1 min-w-[28px] min-h-[28px] flex items-center justify-center"><Ic d={P.x} size={12} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: progress + budget */}
      {plans.length > 0 && (
        <div className="px-2.5 py-1.5 border-t border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-mute">Tiến độ</span>
            <span className="text-[10px] font-bold text-green tnum">{pct}%</span>
          </div>
          <div className="h-1.5 bg-bg2 rounded-full overflow-hidden">
            <div className="h-full bg-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {totalBudget > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-mute">Chi phí dự kiến</span>
              <span className="text-[10px] font-bold text-red tnum">{fmtCurrency(totalBudget)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ GEMINI PASTE — parse nutrition from text ═══ */
function parseGeminiText(raw: string): { cal: number; pro: number; fat: number; carbs: number } | null {
  if (!raw || raw.trim().length < 5) return null;
  // Exact Jay Tracker format — highest priority, zero ambiguity
  const exact = raw.replace(/```[a-z]*|```/gi, "").match(/JAYTRACKER\s*\|\s*CAL\s*=\s*(\d+(?:[.,]\d+)?)\s*\|\s*PRO\s*=\s*(\d+(?:[.,]\d+)?)\s*\|\s*FAT\s*=\s*(\d+(?:[.,]\d+)?)\s*\|\s*CARB\s*=\s*(\d+(?:[.,]\d+)?)/i);
  if (exact) {
    const n = (v: string) => Math.round(parseFloat(v.replace(",", ".")));
    return { cal: n(exact[1]), pro: n(exact[2]), fat: n(exact[3]), carbs: n(exact[4]) };
  }
  // Fallback for older prose responses: each metric must be on its own keyword line
  const lines = raw.split(/[\n\r]+|•|·|;|(?<=[.!?])\s/);
  let cal = 0, pro = 0, fat = 0, carbs = 0;
  for (const line of lines) {
    const l = line.toLowerCase().trim();
    if (!l || l.length > 120) continue;
    // Extract numbers from line
    const nums = l.match(/(\d+\.?\d*)/g);
    if (!nums) continue;
    const firstNum = Math.round(parseFloat(nums[0]));
    // Match specific keywords on this line only
    if (/cal|calo|kcal|năng lượng/.test(l) && !cal) cal = firstNum;
    else if (/protein|đạm|chất đạm/.test(l) && !pro) pro = firstNum;
    else if (/fat|chất béo|béo/.test(l) && !fat) fat = firstNum;
    else if (/carb|carbohydrate|tinh bột|đường/.test(l) && !carbs) carbs = firstNum;
  }
  if (cal === 0 && pro === 0 && fat === 0 && carbs === 0) return null;
  return { cal, pro, fat, carbs };
}

function GeminiPasteTab({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseGeminiText(text) : null;
  const today = formatDate(new Date());

  return (
    <div className="p-3 space-y-2">
      <div className="text-[10px] font-bold text-mute uppercase tracking-widest">Dán kết quả từ Gemini</div>
      <div className="text-[9px] text-mute">Copy kết quả dinh dưỡng từ Gemini rồi dán vào đây:</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Dán nội dung từ Gemini..." rows={3}
        className="w-full px-2 py-2 rounded-md bg-bg2 border border-line text-[11px] outline-none focus:border-ink resize-none" />
      {parsed && (
        <div className="bg-bg2 rounded-lg p-2 border border-green/30">
          <div className="text-[9px] text-green font-bold mb-1">Đã nhận diện:</div>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div><div className="text-sm font-bold tnum text-gold">{parsed.cal}</div><div className="text-[8px] text-mute">Cal</div></div>
            <div><div className="text-sm font-bold tnum text-blue">{parsed.pro}g</div><div className="text-[8px] text-mute">Pro</div></div>
            <div><div className="text-sm font-bold tnum">{parsed.fat}g</div><div className="text-[8px] text-mute">Fat</div></div>
            <div><div className="text-sm font-bold tnum">{parsed.carbs}g</div><div className="text-[8px] text-mute">Carb</div></div>
          </div>
        </div>
      )}
      {!parsed && text.trim() && <div className="text-[9px] text-red">Không tìm thấy số liệu. Thử dán lại.</div>}
      <div className="text-[9px] text-mute">Nhận dạng: calories, protein, fat, carbs từ text Gemini. Bấm nút bên dưới để lưu.</div>
    </div>
  );
}

/* ═══ PET ASSISTANT ═══ */
const PET_GREETINGS = [
  "Chào bạn! Mình sẵn sàng ghi lại ngày hôm nay cùng bạn.",
  "Hôm nay bắt đầu từ việc nhỏ nhất nhé. Bạn đang làm gì?",
  "Mình ở đây để nhắc và tổng hợp, bạn chỉ cần ghi đúng những gì đã làm.",
  "Chào ngày mới! Khi ăn, làm việc hoặc chi tiền thì nhớ mở Jay Tracker nhé.",
  "Không cần hoàn hảo đâu, cứ ghi lại từng hoạt động thật là được.",
  "Bạn muốn bắt đầu bằng bữa ăn, hoạt động hay kế hoạch hôm nay?",
  "Jay Tracker đã sẵn sàng. Cùng theo dõi ngày hôm nay thật rõ ràng nhé.",
];
const PET_REMIND_INTROS = [
  "Ê ê! Bạn có mấy cái nhắc nhở nè, đừng quên nha!",
  "Yo! Tui phải nhắc bạn mấy việc quan trọng nè!",
  "Bạn ơi! Có plan sắp tới nè, coi qua đi!",
  "Alert! Mấy cái deadline đang tới kìa bạn ơi!",
];
const PET_TALKS = [
  "Bạn đang làm gì? Nếu muốn, hãy bắt đầu một phiên track.",
  "Có khoản chi nào vừa phát sinh cần ghi lại không?",
  "Bạn đã ăn gì? Có thể chụp ảnh và thêm bữa ăn ngay.",
  "Muốn xem lại hôm nay, hãy nhấn giữ mình rồi mở tab Hôm nay.",
  "Nếu ngày mai có việc quan trọng, bạn có thể lên kế hoạch trước.",
  "Một hoạt động nhỏ cũng đáng ghi lại nếu nó quan trọng với bạn.",
  "Nếu đang tập trung, hãy dùng hẹn giờ để tránh quên thời gian.",
  "Bạn có thể lưu món ăn thường dùng để thêm nhanh lần sau.",
  "Nhấn giữ mình để xem nhắc nhở và kế hoạch sắp tới.",
  "Cuối ngày hãy xem Nhật ký để biết mình đã làm những gì.",
  "Nếu chưa có dữ liệu, hãy bắt đầu bằng hoạt động đang diễn ra.",
  "Kế hoạch chỉ hữu ích khi cụ thể: việc gì, lúc nào và kết quả mong muốn.",
];

function PetAssistant() {
  const [bubble, setBubble] = useState<string | null>(null);
  const [board, setBoard] = useState(false);
  const [boardTab, setBoardTab] = useState<"remind" | "stats" | "quick">("remind");
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(0);
  const longRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allRem = S.getReminders().filter(r => !r.seen).sort((a, b) => a.remindAt.localeCompare(b.remindAt));
  const todayRem = S.getActiveReminders();
  const today = formatDate(new Date());
  const todayMeals = S.getMeals(today);
  const todayExps = S.getExpenses(today);
  const todayActs = S.getActivities(today);
  const todayCal = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todaySpent = todayExps.reduce((s, e) => s + e.amount, 0);
  const streak = S.getStreakV2();
  const todayPlans = S.getPlans(today);
  const [urgentAlert, setUrgentAlert] = useState<S.PlanItem | null>(null);
  const [dismissedPlans, setDismissedPlans] = useState<Set<string>>(new Set());

  // Check for upcoming plans every 30s
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const p of todayPlans) {
        if (p.done || !p.time || dismissedPlans.has(p.id)) continue;
        // Calculate minutes until plan
        const [ph, pm] = p.time.split(":").map(Number);
        const planMin = ph * 60 + pm;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const diff = planMin - nowMin;
        // 30 min before → pet reminds
        if (diff > 0 && diff <= 30 && !bubble) {
          setBubble(`⏰ "${p.title}" bắt đầu lúc ${p.time} — còn ${diff} phút!`);
          setTimeout(() => setBubble(null), 8000);
        }
        // 5 min before or past → URGENT fullscreen
        if (diff <= 5 && diff >= -10) {
          setUrgentAlert(p);
        }
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayPlans.length, dismissedPlans.size]);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(true);
      // Priority: plans > reminders > greeting
      const undonePlans = todayPlans.filter(p => !p.done);
      if (undonePlans.length > 0) {
        // Show plans as panel, not bubble — stays until dismissed
        setBoard(true); setBoardTab("remind");
      } else if (todayRem.length > 0) {
        setBoard(true); setBoardTab("remind");
      } else {
        setBubble(PET_GREETINGS[Math.floor(Math.random() * PET_GREETINGS.length)]);
        setTimeout(() => setBubble(null), 6000);
      }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = () => {
    if (longRef.current) { longRef.current = false; return; }
    if (board) { setBoard(false); return; }

    // Smart context-aware messages
    const smart: string[] = [];
    const h = new Date().getHours();
    if (todayMeals.length === 0 && h >= 8) smart.push("Ê chưa ghi bữa ăn nào nè! Track đi bro!");
    if (todayMeals.length === 0 && h >= 12) smart.push("Trưa rồi mà chưa ăn gì? Ghi lại đi!");
    if (todayExps.length === 0 && h >= 15) smart.push("Hôm nay chưa ghi chi tiêu? Check lại nha!");
    if (todayActs.length === 0 && h >= 18) smart.push("Tối rồi mà chưa track hoạt động nào luôn á!");
    if (todayCal > 2000) smart.push(`Hôm nay ăn ${todayCal} cal rồi đó, coi chừng nha!`);
    if (todaySpent > 200000) smart.push(`Đã chi ${fmtCurrency(todaySpent)} hôm nay rồi đó!`);
    if (streak.currentStreak >= 7) smart.push(`${streak.currentStreak} ngày streak! Quá đỉnh bạn ơi! 🔥`);
    if (streak.brokenAt) smart.push("Chuỗi đang gãy kìa! Hồi phục nhanh đi!");
    if (allRem.length > 0) smart.push(`Có ${allRem.length} nhắc nhở đang chờ. Giữ mình để xem!`);

    // Mix smart + random
    const pool = smart.length > 0 && Math.random() < 0.6 ? smart : PET_TALKS;
    let n = Math.floor(Math.random() * pool.length);
    if (pool === PET_TALKS) {
      n = (idx + 1 + Math.floor(Math.random() * 4)) % PET_TALKS.length;
      if (n === idx) n = (n + 1) % PET_TALKS.length;
      setIdx(n);
    }
    setBubble(pool[n]);
    setTimeout(() => setBubble(null), 4500);
  };

  const pressStart = () => {
    longRef.current = false;
    timerRef.current = setTimeout(() => { longRef.current = true; setBoard(true); setBubble(null); }, 400);
  };
  const pressEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const dismiss = (id: string) => { S.markReminderSeen(id); setBoard(false); setTimeout(() => setBoard(true), 50); };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 right-2 z-40 flex flex-col items-end gap-1.5 sm:bottom-8 select-none" style={{ maxWidth: "260px", WebkitUserSelect: "none", touchAction: "none" }}>
      {/* URGENT FULLSCREEN ALERT */}
      {urgentAlert && (
        <div className="fixed inset-0 bg-red/95 z-50 flex flex-col items-center justify-center p-6 a-pop" onClick={() => { setDismissedPlans(p => new Set(p).add(urgentAlert.id)); setUrgentAlert(null); }}>
          <div className="text-6xl mb-4">⏰</div>
          <div className="text-white text-2xl font-bold text-center uppercase tracking-wider mb-2">SẮP TỚI GIỜ!</div>
          <div className="text-white/90 text-lg font-bold text-center mb-1">{urgentAlert.title}</div>
          <div className="text-white/70 text-base tnum mb-1">{urgentAlert.time}</div>
          {urgentAlert.detail && <div className="text-white/60 text-sm text-center mb-4">{urgentAlert.detail}</div>}
          <button onClick={() => { setDismissedPlans(p => new Set(p).add(urgentAlert.id)); setUrgentAlert(null); }}
            className="px-8 py-3 bg-white text-red rounded-xl font-bold text-base active:scale-95 min-h-[52px]">
            Đã biết ✓
          </button>
        </div>
      )}

      {/* Board — long press — multi-tab */}
      {board && (
        <div className="bg-card border border-line rounded-xl shadow-2xl a-pop w-[270px] max-h-[55vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-2 py-1.5 border-b border-line flex items-center gap-1 shrink-0">
            {[
              { k: "remind" as const, l: `Nhắc (${allRem.length})` },
              { k: "stats" as const, l: "Hôm nay" },
              { k: "quick" as const, l: "Dán Gemini" },
            ].map(t => (
              <button key={t.k} onClick={() => setBoardTab(t.k)} className={`flex-1 py-1.5 rounded-md text-[9px] font-bold min-h-[32px] transition-all ${boardTab === t.k ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>{t.l}</button>
            ))}
            <button onClick={() => setBoard(false)} className="min-w-[32px] min-h-[32px] flex items-center justify-center text-mute hover:text-ink shrink-0"><Ic d={P.x} size={13} /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Tab: Nhắc nhở + Kế hoạch hôm nay + Tương lai */}
            {boardTab === "remind" && (() => {
              const undonePlans = todayPlans.filter(p => !p.done);
              // Collect future plans + schedules
              // future plans via getPlanDates
              const futureDates = S.getPlanDates().filter(d => d > today).slice(0, 5);
              const futureSchedules = S.getSchedules().filter(s => s.date && s.date > today).slice(0, 5);
              const days = ["CN","T2","T3","T4","T5","T6","T7"];

              return (
                <div>
                  {/* Today's plans */}
                  {undonePlans.length > 0 && (
                    <div className="px-3 py-2 border-b border-line bg-gold/5">
                      <div className="text-[10px] font-bold text-gold mb-1">📋 Kế hoạch hôm nay ({undonePlans.length})</div>
                      {undonePlans.map(p => (
                        <div key={p.id} className="text-[10px] py-0.5 flex items-center gap-1.5">
                          {p.time && <span className="tnum text-gold font-bold w-10 shrink-0">{p.time}</span>}
                          <span className="flex-1 text-ink">{p.title}</span>
                          {p.detail && <span className="text-mute text-[9px] truncate max-w-[60px]">{p.detail}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom reminders */}
                  {allRem.length > 0 && (
                    <div className="border-b border-line">
                      <div className="px-3 py-1 text-[9px] font-bold text-mute bg-bg2">🔔 Nhắc nhở</div>
                      {allRem.map(r => {
                        const dl = Math.round((new Date(r.planDate + "T00:00:00").getTime() - Date.now()) / 86400000);
                        return (
                          <div key={r.id} className="px-3 py-1.5 border-b border-line/20 last:border-0" style={{ borderLeftWidth: 3, borderLeftColor: r.color || "#ffa502" }}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold">{r.planTitle}</div>
                                <div className="text-[9px] text-mute tnum">{fmtDateDisp(r.planDate)}{r.planTime ? ` · ${r.planTime}` : ""}{dl > 0 ? ` · ${dl} ngày nữa` : " · HÔM NAY"}</div>
                              </div>
                              <button onClick={() => dismiss(r.id)} className="min-w-[28px] min-h-[28px] flex items-center justify-center text-mute hover:text-green rounded-md bg-bg2 border border-line"><Ic d={P.check} size={11} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Future plans */}
                  {futureDates.length > 0 && (
                    <div className="border-b border-line">
                      <div className="px-3 py-1 text-[9px] font-bold text-mute bg-bg2">📅 Kế hoạch sắp tới</div>
                      {futureDates.map(d => {
                        const plans = S.getPlans(d);
                        const dd = new Date(d + "T00:00:00");
                        const dl = Math.round((dd.getTime() - Date.now()) / 86400000);
                        return (
                          <div key={d} className="px-3 py-1.5 border-b border-line/20 last:border-0">
                            <div className="text-[10px] font-bold">{days[dd.getDay()]} {dd.getDate()}/{dd.getMonth()+1}/{dd.getFullYear()} <span className="text-mute font-normal">· {dl} ngày nữa</span></div>
                            {plans.slice(0, 3).map(p => (
                              <div key={p.id} className="text-[9px] text-mute py-0.5 pl-2">{p.time || "—"} {p.title}</div>
                            ))}
                            {plans.length > 3 && <div className="text-[8px] text-mute pl-2">+{plans.length - 3} mục nữa</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Future schedules */}
                  {futureSchedules.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[9px] font-bold text-mute bg-bg2">⏰ TKB sắp tới</div>
                      {futureSchedules.map(s => {
                        const dd = s.date ? new Date(s.date + "T00:00:00") : null;
                        return (
                          <div key={s.id} className="px-3 py-1.5 border-b border-line/20 last:border-0">
                            <div className="text-[10px] font-bold">{s.name} {dd ? `· ${days[dd.getDay()]} ${dd.getDate()}/${dd.getMonth()+1}` : ""}</div>
                            <div className="text-[9px] text-mute">{s.items.map(b => `${b.time} ${b.title}`).join(" · ")}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {undonePlans.length === 0 && allRem.length === 0 && futureDates.length === 0 && futureSchedules.length === 0 && (
                    <div className="px-3 py-6 text-center text-mute text-[10px]">Không có nhắc nhở hay kế hoạch</div>
                  )}
                </div>
              );
            })()}

            {/* Tab: Today Stats — with macros */}
            {boardTab === "stats" && (() => {
              const totPro = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
              const totFat = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
              const totCarb = todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
              return (
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum text-gold">{todayCal || "—"}</div>
                      <div className="text-[8px] text-mute">Cal</div>
                    </div>
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum text-blue">{totPro || "—"}</div>
                      <div className="text-[8px] text-mute">Protein</div>
                    </div>
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum">{totFat || "—"}</div>
                      <div className="text-[8px] text-mute">Fat</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum">{totCarb || "—"}</div>
                      <div className="text-[8px] text-mute">Carbs</div>
                    </div>
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum text-red">{todaySpent > 0 ? fmtCurrency(todaySpent) : "—"}</div>
                      <div className="text-[8px] text-mute">Chi tiêu</div>
                    </div>
                    <div className="bg-bg2 rounded-lg p-2 text-center border border-line">
                      <div className="text-base font-bold tnum">{todayMeals.length}🍽 {todayActs.length}📋</div>
                      <div className="text-[8px] text-mute">Ăn · Việc</div>
                    </div>
                  </div>
                  {todayMeals.length > 0 && (
                    <div className="text-[9px] text-mute">
                      {todayMeals.map(m => m.foodName).join(", ")}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab: Dán Gemini */}
            {boardTab === "quick" && <GeminiPasteTab onDone={() => { setBubble("Đã lưu dinh dưỡng!"); setTimeout(() => setBubble(null), 2000); setBoard(false); }} />}
          </div>
        </div>
      )}

      {/* Bubble */}
      {bubble && !board && (
        <div className="bg-card border border-line rounded-xl px-3 py-2 shadow-lg a-pop max-w-[200px]">
          <div className="text-[11px] text-ink leading-relaxed">{bubble}</div>
          {todayRem.length > 0 && (
            <button onClick={() => { S.markAllRemindersSeen(); setBubble("OK!"); setTimeout(() => setBubble(null), 1500); }}
              className="mt-1 w-full py-1 bg-ink text-bg rounded-md text-[9px] font-bold active:scale-95 min-h-[32px]">Đã xem</button>
          )}
        </div>
      )}

      {/* Pet — Among Us */}
      <div
        onClick={tap}
        onMouseDown={pressStart} onMouseUp={pressEnd} onMouseLeave={pressEnd}
        onTouchStart={pressStart} onTouchEnd={e => { e.preventDefault(); pressEnd(); }}
        onContextMenu={e => e.preventDefault()}
        className="cursor-pointer active:scale-90 transition-transform relative"
        style={{ animation: "petBob 2.5s ease-in-out infinite", width: 50, height: 58, userSelect: "none", WebkitUserSelect: "none", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
      >
        <svg width="50" height="58" viewBox="0 0 50 58" fill="none">
          {/* Backpack */}
          <path d="M4 22C4 18 6 17 8 17H10V37H8C6 37 4 36 4 32Z" fill="#252525"/>
          <path d="M5 24h4v4H5z" rx="1" fill="#363636"/>
          {/* Body */}
          <path d="M13 50V22C13 11 17 4 25 4C33 4 37 11 37 22V50H31V42H19V50Z" fill="#1e1e1e"/>
          {/* Body outline glow */}
          <path d="M13 50V22C13 11 17 4 25 4C33 4 37 11 37 22V50H31V42H19V50Z" fill="none" stroke="#3a3a3a" strokeWidth="1"/>
          {/* Visor bg */}
          <path d="M18 16C18 12 20 10 25 10H33C36 10 38 12 38 16V22C38 26 36 28 33 28H25C20 28 18 26 18 22Z" fill="#1a6fc4"/>
          {/* Visor main */}
          <path d="M19 17C19 13 21 11 25 11H32C35 11 37 13 37 17V21C37 25 35 27 32 27H25C21 27 19 25 19 21Z" fill="#4db8ff"/>
          {/* Visor shine */}
          <ellipse cx="32" cy="16" rx="4" ry="3" fill="#9ddfff" opacity="0.6"/>
          <ellipse cx="29" cy="14" rx="2" ry="1.5" fill="#fff" opacity="0.35"/>
          {/* Leg split */}
          <rect x="23" y="42" width="4" height="8" fill="#0a0a0a"/>
          {/* Left leg */}
          <path d="M13 42h10v6c0 3-2 5-5 5h-2c-2 0-3-2-3-5z" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5"/>
          {/* Right leg */}
          <path d="M27 42h10v6c0 3-1 5-3 5h-2c-3 0-5-2-5-5z" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5"/>
          {/* Shoe soles */}
          <path d="M14 48h8c0 3-1 5-4 5s-4-2-4-5z" fill="#252525"/>
          <path d="M28 48h8c0 3-1 5-4 5s-4-2-4-5z" fill="#252525"/>
        </svg>
        {/* Badge */}
        {todayRem.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red rounded-full flex items-center justify-center text-[8px] text-bg font-bold a-blink border-2 border-bg">{todayRem.length}</span>
        )}
      </div>

      <style>{`
        @keyframes petBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

function HistModal({ onClose, onPick, onChanged }: { onClose: () => void; onPick: (d: string) => void; onChanged: () => void }) {
  const hist = S.getHistory().filter(d => d.date !== formatDate(new Date()));
  const totAll = S.getHistory().reduce((s, d) => s + d.expensesTotal, 0);
  return (<Wrap title="Lịch sử" onClose={onClose}>
    {hist.length === 0 ? <div className="text-center py-6 text-mute"><div className="text-3xl mb-2">📭</div><p className="text-sm">Chưa có ngày nào</p></div> : (
      <div className="max-h-[45vh] overflow-y-auto -mx-3.5 px-3.5 space-y-0.5">{hist.map(d => (
        <button key={d.date} onClick={() => onPick(d.date)} className="w-full flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-bg2 text-left transition-colors group">
          <div className="w-10 h-10 bg-bg2 border border-line rounded-lg flex flex-col items-center justify-center shrink-0 group-hover:border-ink transition-colors"><span className="font-bold text-sm text-ink leading-none">{new Date(d.date + "T00:00:00").getDate()}</span><span className="text-[7px] text-mute font-semibold">{["CN","T2","T3","T4","T5","T6","T7"][new Date(d.date + "T00:00:00").getDay()]}</span></div>
          <div className="flex-1 min-w-0"><div className="text-xs font-semibold">{fmtDateDisp(d.date)}</div><div className="flex gap-1 mt-0.5 flex-wrap">
            {d.mealsCount > 0 && <span className="text-[9px] bg-bg2 border border-line px-1 py-0.5 rounded text-mute">🍽{d.mealsCount}</span>}
            {d.activitiesCount > 0 && <span className="text-[9px] bg-bg2 border border-line px-1 py-0.5 rounded text-mute">📋{d.activitiesCount}</span>}
            {d.totalCalories > 0 && <span className="text-[9px] bg-bg2 border border-line px-1 py-0.5 rounded text-mute">🔥{d.totalCalories}</span>}
          </div></div>
          {d.expensesTotal > 0 && <span className="text-[11px] text-red font-bold tnum shrink-0">{fmtCurrency(d.expensesTotal)}</span>}
          <Ic d={P.right} size={12} cls="text-mute2 group-hover:text-ink transition-colors shrink-0" />
        </button>))}</div>
    )}
    {totAll > 0 && <div className="mt-2.5 bg-red2 border border-red/20 rounded-lg px-2.5 py-1.5 flex items-center justify-between"><span className="text-[11px] font-semibold text-red">Tổng tất cả</span><span className="font-bold text-red tnum">{fmtCurrency(totAll)}</span></div>}
    <div className="mt-2.5 pt-2.5 border-t border-line"><div className="text-[9px] font-bold text-mute2 uppercase tracking-widest mb-1.5">Sao lưu</div>
      <div className="flex gap-1.5">
        <button onClick={() => { const b = new Blob([S.exportAll()], { type: "application/json" }); const a = document.createElement("a"); a.download = `backup.json`; a.href = URL.createObjectURL(b); a.click(); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-bg2 hover:bg-line border border-line text-ink2 rounded-lg text-[11px] font-bold transition-colors"><Ic d={P.dl} size={12} /> Xuất</button>
        <label className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-bg2 hover:bg-line border border-line text-ink2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"><Ic d={P.ul} size={12} /> Nhập<input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { if (S.importAll(String(r.result))) { alert("OK!"); onChanged(); onClose(); } else alert("Lỗi!"); }; r.readAsText(f); }} /></label>
      </div>
    </div>
  </Wrap>);
}
