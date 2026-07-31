"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  formatDate, fmtDateDisp, fmtDateFull, fmtCurrency, fmtDur, fmtTimeVN, fmtElapsed,
  getTimeOfDay, getTimeEmoji, nowHHMM, autoMealType, mealPeriod, parseMoney,
  MEALS, ACTS, EXPS,
} from "@/lib/utils";
import * as S from "@/lib/storage";

/* ═══ ICONS ═══ */
function Ic({ d, size = 18, sw = 1.8, cls }: { d: string; size?: number; sw?: number; cls?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d={d} /></svg>;
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
  const [col, setCol] = useState<Record<string, boolean>>({});
  const [img, setImg] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<S.Habit[]>([]);
  const [habitChecks, setHabitChecks] = useState<S.HabitCheck[]>([]);
  const [qnotes, setQnotes] = useState<S.QuickNote[]>([]);
  const [pomoSessions, setPomoSessions] = useState<S.PomodoroSession[]>([]);
  const [tab, setTab] = useState<"main" | "exp">("main");
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
  const tog = (k: string) => setCol(p => ({ ...p, [k]: !p[k] }));

  const reload = useCallback(() => {
    setMeals(S.getMeals(date)); setActs(S.getActivities(date)); setExps(S.getExpenses(date));
    setStatus(S.getDailyStatus(date)); setStreak(S.getStreak());
    const l = S.getLiveTracks(); setLive(l.active); setLiveR(l.recent);
    setHabits(S.getHabits()); setHabitChecks(S.getHabitChecks(date));
    setQnotes(S.getQuickNotes(date)); setPomoSessions(S.getPomoSessions(date));
  }, [date]);

  useEffect(() => { setOk(true); }, []);
  useEffect(() => { if (ok) reload(); }, [ok, reload]);
  useEffect(() => {
    if (!live) { setElapsed(0); return; }
    const tick = () => setElapsed(Date.now() - new Date(live.startedAt).getTime());
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, [live]);

  // Realtime clock + timer tick — single rAF loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      if (timerRunning) {
        const rem = timerEnd.current - Date.now();
        if (rem <= 0 && !timerDone.current) {
          timerDone.current = true;
          setTimerMsLeft(0);
          setTimerRunning(false);
          playAlarm();
          const mins = timerTotalMin.current;
          const lbl = timerLabel || "Focus";
          S.addPomoSession(date, lbl, mins);
          S.addActivity({ date, category: "work", title: `⏰ ${lbl} (${mins}p)`, description: null, durationMinutes: mins, startTime: null, endTime: null });
          reload();
        } else {
          setTimerMsLeft(Math.max(0, rem));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timerRunning, date, timerLabel, reload]);

  const startTimer = (mins: number) => {
    timerTotalMin.current = mins;
    timerEnd.current = Date.now() + mins * 60 * 1000;
    timerDone.current = false;
    setTimerMsLeft(mins * 60 * 1000);
    setTimerRunning(true);
    setTimerSetting(false);
  };
  const stopTimer = () => { setTimerRunning(false); setTimerMsLeft(0); };

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

  const del = (t: string, id: string) => { if (!confirm("Xóa?")) return; if (t === "m") S.deleteMeal(id); if (t === "a") S.deleteActivity(id); if (t === "e") S.deleteExpense(id); reload(); };
  const totCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totExp = exps.reduce((s, e) => s + e.amount, 0);
  const totAct = acts.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const weekStats = ok ? S.getWeekStats() : [];
  const wMax = Math.max(...weekStats.map(w => w.expense), 1);
  const wTot = weekStats.reduce((s, w) => s + w.expense, 0);

  const mp: Record<string, S.Meal[]> = {};
  meals.forEach(m => { const p = mealPeriod(m.time); const k = `${p.order}|${p.label}|${p.emoji}`; if (!mp[k]) mp[k] = []; mp[k].push(m); });
  const gc = (v: string) => ACTS.find(x => x.value === v);
  const ge = (v: string) => EXPS.find(x => x.value === v);

  if (!ok) return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin" /></div>;

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
              <div className="flex gap-1 mb-1.5 overflow-x-auto">
                {[1, 3, 5, 10, 15, 25, 30, 45, 60, 90].map(m => (
                  <button key={m} onClick={() => setTimerCustom(String(m))}
                    className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${timerCustom === String(m) ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}>{m}p</button>
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
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-bold text-xs">{fmtDateDisp(date)}</span>
                  {isToday && <span className="text-mute text-[9px]">{getTimeEmoji()} {getTimeOfDay()}</span>}
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={() => setTimerSetting(true)} className="flex items-center gap-1 bg-card border border-line hover:border-ink px-2 py-1 rounded-md text-[10px] font-bold text-mute hover:text-ink transition-colors active:scale-95">
                    <Ic d={P.clock} size={12} /> Hẹn giờ
                  </button>
                  {!isToday && <button onClick={() => setDate(formatDate(new Date()))} className="px-2 h-7 rounded-md bg-ink/10 text-ink text-[10px] font-bold">Nay</button>}
                  <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(formatDate(d)); }} className="w-7 h-7 rounded-md bg-card border border-line flex items-center justify-center text-mute hover:text-ink transition-colors"><Ic d={P.right} size={13} /></button>
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
          <button onClick={() => setTab("main")} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${tab === "main" ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>📋 Chung</button>
          <button onClick={() => setTab("exp")} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${tab === "exp" ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}>💰 Chi tiêu</button>
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
                        {gc(live.category)?.emoji}<span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green border-2 border-card a-blink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] uppercase tracking-widest text-green font-bold">Đang track · {fmtTimeVN(live.startedAt)}</div>
                        <div className="font-bold text-[13px] truncate">{live.title}</div>
                      </div>
                      <div className="font-bold text-lg tnum shrink-0">{fmtElapsed(elapsed)}</div>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => { S.stopLiveTrack(); reload(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red/15 border border-red/25 text-red rounded-md text-[11px] font-bold transition-colors active:scale-95"><Ic d={P.stop} size={11} sw={2.5} /> Dừng</button>
                      <div className="flex-1 flex gap-1 overflow-x-auto">{ACTS.filter(c => c.value !== live.category).slice(0, 5).map(c => (<button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }} className="shrink-0 w-7 h-7 rounded-md bg-bg2 hover:bg-line flex items-center justify-center text-xs transition-colors active:scale-90 border border-line">{c.emoji}</button>))}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-2.5 border border-line">
                    <div className="text-[10px] text-mute mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green a-blink" />Chọn để track:</div>
                    <div className="flex gap-1 overflow-x-auto pb-0.5">
                      {ACTS.map(c => (<button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }} className="shrink-0 flex items-center gap-1 bg-bg2 hover:bg-green/10 hover:text-green border border-line px-2 py-1 rounded-md text-[11px] transition-all active:scale-95">{c.emoji} {c.label}</button>))}
                    </div>
                  </div>
                )}
                {liveR.length > 0 && (
                  <div className="bg-card rounded-lg border border-line mt-1.5 overflow-hidden">
                    <div className="px-2.5 py-1 text-[9px] text-mute2 font-bold uppercase tracking-widest border-b border-line">Đã track</div>
                    {liveR.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] group border-b border-line/40 last:border-0">
                        <button onClick={() => { S.startLiveTrack(r.title, r.category); reload(); }} className="text-mute2 hover:text-green"><Ic d={P.play} size={9} sw={2.5} /></button>
                        <span className="text-xs">{gc(r.category)?.emoji}</span><span className="flex-1 truncate text-ink2">{r.title}</span>
                        <span className="text-[9px] text-mute tnum">{fmtTimeVN(r.startedAt)}</span>
                        {r.endedAt && <span className="text-[9px] bg-green2 text-green px-1 py-0.5 rounded font-semibold tnum">{fmtDur(Math.max(1, Math.round((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 60000)))}</span>}
                        <button onClick={() => { S.deleteLiveTrack(r.id); reload(); }} className="text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={10} /></button>
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
                    const hs = S.getHabitStreak(h.id);
                    return (<div key={h.id} className="flex items-center gap-2 py-0.5 group">
                      <button onClick={() => { S.toggleHabitCheck(h.id, date); reload(); }} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 ${ck ? "bg-green border-green text-bg" : "border-line hover:border-ink"}`}>{ck && <Ic d={P.check} size={12} sw={3} />}</button>
                      <span className="text-xs">{h.emoji}</span><span className={`text-[12px] font-medium flex-1 ${ck ? "line-through text-mute" : ""}`}>{h.name}</span>
                      {hs > 0 && <span className="text-[9px] bg-gold2 text-gold px-1 py-0.5 rounded font-bold tnum">{hs}🔥</span>}
                      <button onClick={() => { if (confirm("Xóa?")) { S.deleteHabit(h.id); reload(); } }} className="text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={11} /></button>
                    </div>);
                  })}
                </div>
              </div>
            )}
            {isToday && <button onClick={() => setModal("addHabit")} className="text-[10px] text-mute bg-card border border-dashed border-line rounded-lg py-1.5 w-full hover:border-ink hover:text-ink transition-colors font-medium">{habits.length === 0 ? "+ Thêm thói quen" : "+ Thêm"}</button>}

            {/* ACTIVITIES */}
            <Sec title="Hoạt động" icon={P.clip} count={acts.length} c={!!col.a} onT={() => tog("a")} onA={() => setModal("act")}>
              {acts.length === 0 ? <Em /> : acts.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1 group">
                  <span className="text-xs w-5 text-center shrink-0">{gc(a.category)?.emoji || "📋"}</span>
                  <span className="text-[12px] font-medium flex-1 truncate">{a.title}</span>
                  {a.startTime && <span className="text-[10px] text-mute tnum shrink-0">{a.startTime}{a.endTime ? `–${a.endTime}` : ""}</span>}
                  {a.durationMinutes != null && a.durationMinutes > 0 && <span className="text-[10px] bg-blue2 text-blue px-1 py-0.5 rounded font-semibold tnum border border-blue/20 shrink-0">{fmtDur(a.durationMinutes)}</span>}
                  <button onClick={() => del("a", a.id)} className="text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>
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
                      <button onClick={() => { S.togglePinNote(n.id); reload(); }} className="text-mute2 hover:text-gold opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.pin} size={10} /></button>
                      <button onClick={() => { S.deleteQuickNote(n.id); reload(); }} className="text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={10} /></button>
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
        ) : (
          <>
            {/* ═══ CHI TIÊU TAB ═══ */}
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
            <Sec title="Bữa ăn" icon={P.fork} count={meals.length} c={!!col.me} onT={() => tog("me")} onA={() => setModal("meal")}>
              {meals.length === 0 ? <Em /> : (
                <div className="space-y-2">
                  {Object.entries(mp).sort((a, b) => a[0].localeCompare(b[0])).map(([k, ms]) => {
                    const [, label, emoji] = k.split("|");
                    return (<div key={k}><div className="text-[9px] font-bold text-mute2 mb-0.5 uppercase tracking-wider">{emoji} {label}</div>
                      {ms.map(m => (<div key={m.id} className="flex items-center gap-2 py-1 group">
                        {m.image ? <button onClick={() => setImg(m.image)} className="w-8 h-8 rounded-md overflow-hidden shrink-0 ring-1 ring-line"><img src={m.image} alt="" className="w-full h-full object-cover" /></button>
                        : <span className="w-8 h-8 rounded-md bg-bg2 border border-line flex items-center justify-center text-xs shrink-0">🍽️</span>}
                        <span className="text-[12px] font-medium flex-1 truncate">{m.foodName}</span>
                        {m.time && <span className="text-[10px] text-mute tnum shrink-0">{m.time}</span>}
                        {m.calories != null && m.calories > 0 && <span className="text-[10px] bg-gold2 text-gold px-1 py-0.5 rounded font-semibold tnum shrink-0">{m.calories}</span>}
                        {m.price != null && m.price > 0 && <span className="text-[10px] bg-red2 text-red px-1 py-0.5 rounded font-semibold tnum shrink-0">{fmtCurrency(m.price)}</span>}
                        <button onClick={() => del("m", m.id)} className="text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>
                      </div>))}
                    </div>);
                  })}
                  {totCal > 0 && <div className="flex justify-between pt-1.5 border-t border-line text-[11px]"><span className="text-mute">Tổng calories</span><span className="font-bold text-gold tnum">{totCal.toLocaleString()} cal</span></div>}
                </div>
              )}
            </Sec>

            {/* Expenses */}
            <Sec title="Chi tiêu" icon={P.wallet} count={exps.length} c={!!col.e} onT={() => tog("e")} onA={() => setModal("exp")}
              extra={totExp > 0 ? <span className="font-bold text-[11px] text-red tnum">{fmtCurrency(totExp)}</span> : undefined}>
              {exps.length === 0 ? <Em /> : (
                <div className="space-y-0.5">
                  {exps.map(e => (<div key={e.id} className="flex items-start gap-2 py-1 group">
                    {e.image ? <button onClick={() => setImg(e.image)} className="w-8 h-8 rounded-md overflow-hidden shrink-0 ring-1 ring-line"><img src={e.image} alt="" className="w-full h-full object-cover" /></button>
                    : <span className="w-8 h-8 rounded-md bg-bg2 border border-line flex items-center justify-center text-xs shrink-0">{ge(e.category)?.emoji || "📦"}</span>}
                    <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate">{e.description}</div><div className="text-[10px] text-mute">{fmtTimeVN(e.createdAt)} · {ge(e.category)?.label}</div></div>
                    <span className="font-bold text-[11px] text-red tnum shrink-0">−{fmtCurrency(e.amount)}</span>
                    <button onClick={() => del("e", e.id)} className="mt-1 text-mute2 hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"><Ic d={P.x} size={12} /></button>
                  </div>))}
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
          </>
        )}
      </main>

      {/* BOTTOM NAV — always visible */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg/95 backdrop-blur-md border-t border-line py-1.5 z-30">
        <div className="flex justify-around max-w-xl mx-auto">
          {[
            { d: P.fork, l: "Ăn", m: "meal" },
            { d: P.clip, l: "Việc", m: "act" },
            { d: P.wallet, l: "Chi", m: "exp" },
            { d: P.clock, l: "Focus", m: "pomo" },
            { d: P.calendar, l: "Sử", m: "hist" },
          ].map(b => (
            <button key={b.m} onClick={() => setModal(b.m === "pomo" ? null : b.m)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-mute hover:text-ink active:scale-90 transition-all">
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
      {modal === "addHabit" && <AddHabitModal onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "qn" && <QNModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}

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
function playAlarm() {
  try {
    const ac = new AudioContext();
    const ring = (freq: number, t: number, dur: number) => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, ac.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + dur);
    };
    for (let i = 0; i < 5; i++) {
      ring(880, i * 0.5, 0.12);
      ring(880, i * 0.5 + 0.15, 0.12);
      ring(1320, i * 0.5 + 0.3, 0.15);
    }
  } catch { /* blocked */ }
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

/* ═══ MODALS — iOS keyboard-safe using visualViewport ═══ */
function Wrap({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv || !boxRef.current) return;

    const update = () => {
      const box = boxRef.current;
      if (!box) return;
      // on iOS when keyboard opens, visualViewport.height shrinks
      const kbHeight = window.innerHeight - vv.height;
      if (kbHeight > 50) {
        // keyboard is open — shrink modal and push up
        box.style.maxHeight = `${vv.height - 16}px`;
        box.style.transform = `translateY(${-kbHeight}px)`;
      } else {
        box.style.maxHeight = "";
        box.style.transform = "";
      }
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (<div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center sm:items-center" onClick={onClose}>
    <div ref={boxRef} onClick={e => e.stopPropagation()}
      className="bg-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-3.5 a-rise border border-line flex flex-col transition-transform duration-200"
      style={{ maxHeight: "85dvh" }}>
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <h2 className="font-bold text-sm">{title}</h2>
        <button onClick={onClose} className="w-7 h-7 rounded-md bg-bg2 hover:bg-red/15 hover:text-red flex items-center justify-center text-mute transition-colors"><Ic d={P.x} size={13} /></button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain" onFocus={e => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") {
          setTimeout(() => t.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350);
        }
      }}>{children}</div>
    </div></div>);
}
const ic = "w-full px-3 py-2 rounded-md bg-bg2 border border-line outline-none focus:border-ink text-sm transition-colors";

function MoneyIn({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const p = parseMoney(value);
  return (<div><input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={ic} />
    {value.trim() && <p className={`text-[10px] mt-0.5 text-right font-semibold ${p != null ? "text-green" : "text-red"}`}>{p != null ? `= ${fmtCurrency(p)}` : "Lỗi"}</p>}</div>);
}
function ImgP({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  if (value) return (<div className="relative mb-2.5"><img src={value} alt="" className="w-full h-28 object-cover rounded-lg border border-line" /><button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 w-6 h-6 bg-bg/80 hover:bg-red text-ink rounded-full flex items-center justify-center transition-colors"><Ic d={P.x} size={11} /></button></div>);
  return (<label className="mb-2.5 py-2.5 border border-dashed border-line rounded-lg text-center text-xs text-mute cursor-pointer hover:border-ink hover:text-ink flex items-center justify-center gap-1.5 font-medium"><Ic d={P.cam} size={14} /> Chụp ảnh<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(f); }} /></label>);
}

function MealModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [mt, setMt] = useState(autoMealType()); const [fn, setFn] = useState(""); const [cal, setCal] = useState(""); const [tm, setTm] = useState(nowHHMM()); const [price, setPrice] = useState(""); const [im, setIm] = useState<string | null>(null);
  const pp = parseMoney(price);
  return (<Wrap title="Thêm bữa ăn" onClose={onClose}>
    <div className="flex gap-1 mb-2.5">{MEALS.map(m => (<button key={m.value} onClick={() => setMt(m.value)} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${mt === m.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}><div className="text-sm">{m.emoji}</div>{m.label}</button>))}</div>
    <ImgP value={im} onChange={setIm} />
    <input type="text" value={fn} onChange={e => setFn(e.target.value)} placeholder="Tên món" autoFocus className={`${ic} mb-2`} />
    <div className="flex gap-1.5 mb-2"><input type="time" value={tm} onChange={e => setTm(e.target.value)} className={`${ic} flex-1`} /><input type="number" value={cal} onChange={e => setCal(e.target.value)} placeholder="Cal" className={`${ic} flex-1`} /></div>
    <div className="mb-2"><MoneyIn value={price} onChange={setPrice} placeholder="Giá tiền" /></div>
    {pp != null && pp > 0 && <div className="flex items-center gap-1 bg-gold2 text-gold border border-gold/20 rounded-md px-2 py-1 text-[10px] font-medium mb-2.5 a-pop"><Ic d={P.wallet} size={11} /> Vào chi tiêu</div>}
    <button onClick={() => { if (!fn.trim()) return; S.addMeal({ date, mealType: mt, foodName: fn.trim(), calories: cal ? parseInt(cal) : null, time: tm || nowHHMM(), notes: null, image: im, price: pp }); if (pp != null && pp > 0) S.addExpense({ date, category: "food", description: fn.trim(), amount: pp, image: im }); onDone(); }} disabled={!fn.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold transition-colors disabled:opacity-30 active:scale-[0.98]">Thêm</button>
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
  const [cat, setCat] = useState("food"); const [ds, setDs] = useState(""); const [am, setAm] = useState(""); const [im, setIm] = useState<string | null>(null);
  const p = parseMoney(am);
  return (<Wrap title="Thêm chi tiêu" onClose={onClose}>
    <div className="flex flex-wrap gap-1 mb-2.5">{EXPS.map(c => (<button key={c.value} onClick={() => setCat(c.value)} className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${cat === c.value ? "bg-ink text-bg" : "bg-bg2 text-mute border border-line"}`}>{c.emoji} {c.label}</button>))}</div>
    <ImgP value={im} onChange={setIm} />
    <input type="text" value={ds} onChange={e => setDs(e.target.value)} placeholder="Mô tả" autoFocus className={`${ic} mb-2`} />
    <div className="mb-2.5"><MoneyIn value={am} onChange={setAm} placeholder="Số tiền" /></div>
    <button onClick={() => { if (!ds.trim() || p == null || p <= 0) return; S.addExpense({ date, category: cat, description: ds.trim(), amount: p, image: im }); onDone(); }} disabled={!ds.trim() || p == null || p <= 0} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98]">{p != null && p > 0 ? `Thêm · ${fmtCurrency(p)}` : "Thêm"}</button>
  </Wrap>);
}

function AddHabitModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [name, setName] = useState(""); const [emoji, setEmoji] = useState("✅");
  return (<Wrap title="Thói quen" onClose={onClose}>
    <div className="flex gap-1.5 mb-2.5 flex-wrap">{["✅","📖","🏃","💊","🧘","💪","🚰","🎯","✍️","🛌"].map(e => (<button key={e} onClick={() => setEmoji(e)} className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all ${emoji === e ? "bg-ink text-bg scale-110" : "bg-bg2 border border-line"}`}>{e}</button>))}</div>
    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên thói quen" autoFocus className={`${ic} mb-2.5`} />
    <button onClick={() => { if (!name.trim()) return; S.addHabit(name.trim(), emoji); onDone(); }} disabled={!name.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98]">Thêm</button>
  </Wrap>);
}

function QNModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (<Wrap title="Ghi nhanh" onClose={onClose}>
    <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Ghi nhanh..." autoFocus className={`${ic} mb-2.5`} onKeyDown={e => { if (e.key === "Enter" && text.trim()) { S.addQuickNote(date, text.trim()); onDone(); } }} />
    <button onClick={() => { if (!text.trim()) return; S.addQuickNote(date, text.trim()); onDone(); }} disabled={!text.trim()} className="w-full py-2.5 rounded-lg bg-ink text-bg font-bold disabled:opacity-30 active:scale-[0.98]">Ghi</button>
  </Wrap>);
}

function InvModal({ date, exps, onClose }: { date: string; exps: S.Expense[]; onClose: () => void }) {
  const total = exps.reduce((s, e) => s + e.amount, 0);
  const grouped: Record<string, S.Expense[]> = {}; exps.forEach(e => { (grouped[e.category] = grouped[e.category] || []).push(e); });
  return (<Wrap title="Hóa đơn" onClose={onClose}>
    <div className="text-center mb-2.5"><div className="font-bold text-sm uppercase tracking-wider">Hóa đơn</div><div className="text-[11px] text-mute">{fmtDateFull(date)}</div></div>
    <div className="space-y-2">{Object.entries(grouped).map(([cat, items]) => { const ec = EXPS.find(x => x.value === cat); return (<div key={cat}><div className="flex items-center justify-between text-xs font-bold mb-0.5"><span className="text-ink2">{ec?.emoji} {ec?.label}</span><span className="text-red tnum">{fmtCurrency(items.reduce((s, e) => s + e.amount, 0))}</span></div>
      {items.map(it => (<div key={it.id} className="flex items-center justify-between pl-4 py-0.5 text-[11px]"><span className="truncate flex-1 text-ink2">{it.description}</span><span className="text-mute tnum shrink-0 ml-2">{fmtCurrency(it.amount)}</span></div>))}</div>); })}</div>
    <div className="border-t border-dashed border-line mt-3 pt-2 flex items-center justify-between"><span className="font-bold text-sm uppercase">Tổng</span><span className="font-bold text-lg text-red tnum">{fmtCurrency(total)}</span></div>
    <div className="flex gap-2 mt-3"><button onClick={() => { const d = encodeURIComponent(JSON.stringify({ date, total, items: exps.map(e => ({ description: e.description, amount: e.amount, category: e.category })) })); window.open(`https://saving-y2k.vercel.app/?expenses=${d}`, "_blank"); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-ink hover:bg-accent text-bg rounded-lg text-xs font-bold transition-colors active:scale-[0.98]"><Ic d={P.receipt} size={14} /> Xuất hóa đơn</button></div>
  </Wrap>);
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
