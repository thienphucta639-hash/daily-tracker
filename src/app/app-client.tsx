"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatDate, fmtDateDisp, fmtCurrency, fmtDur, fmtTimeVN, fmtElapsed,
  getTimeOfDay, getTimeEmoji, nowHHMM, autoMealType, mealPeriod,
  MEALS, ACTS, EXPS,
} from "@/lib/utils";
import * as S from "@/lib/storage";

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(formatDate(new Date()));
  const [meals, setMeals] = useState<S.Meal[]>([]);
  const [acts, setActs] = useState<S.Activity[]>([]);
  const [exps, setExps] = useState<S.Expense[]>([]);
  const [status, setStatus] = useState<S.DailyStatus | null>(null);
  const [live, setLive] = useState<S.LiveTrack | null>(null);
  const [liveRecent, setLiveRecent] = useState<S.LiveTrack[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [modal, setModal] = useState<string | null>(null);
  const [col, setCol] = useState<Record<string, boolean>>({});
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const today = date === formatDate(new Date());
  const tog = (k: string) => setCol(p => ({ ...p, [k]: !p[k] }));

  const reload = useCallback(() => {
    setMeals(S.getMeals(date));
    setActs(S.getActivities(date));
    setExps(S.getExpenses(date));
    setStatus(S.getDailyStatus(date));
    const l = S.getLiveTracks();
    setLive(l.active);
    setLiveRecent(l.recent);
  }, [date]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!live) { setElapsed(0); return; }
    const tick = () => setElapsed(Date.now() - new Date(live.startedAt).getTime());
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [live]);

  const del = (type: string, id: string) => {
    if (!confirm("Xóa?")) return;
    if (type === "meal") S.deleteMeal(id);
    if (type === "act") S.deleteActivity(id);
    if (type === "exp") S.deleteExpense(id);
    reload();
  };

  const totCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totExp = exps.reduce((s, e) => s + e.amount, 0);
  const totAct = acts.reduce((s, a) => s + (a.durationMinutes || 0), 0);

  // Group meals by period
  const mp: Record<string, S.Meal[]> = {};
  meals.forEach(m => {
    const p = mealPeriod(m.time);
    const k = `${p.order}|${p.label}|${p.emoji}`;
    if (!mp[k]) mp[k] = [];
    mp[k].push(m);
  });

  const getCat = (v: string) => ACTS.find(x => x.value === v);
  const getEC = (v: string) => EXPS.find(x => x.value === v);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 pt-4 pb-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-black">📅 Daily Tracker</h1>
          <div className="flex items-center gap-2">
            {today && <span className="text-white/60 text-xs">{getTimeEmoji()} {getTimeOfDay()}</span>}
            <button onClick={() => setModal("history")} className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-xs font-medium">📊</button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 -mt-2.5 pb-20 space-y-2.5">
        {/* Date */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2 shadow-sm">
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()-1); setDate(formatDate(d)); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100">←</button>
          <div className="text-center">
            <div className="font-bold">{fmtDateDisp(date)}</div>
            {today && <div className="text-[11px] text-slate-500">{getTimeEmoji()} {getTimeOfDay()}</div>}
          </div>
          <div className="flex gap-1">
            {!today && <button onClick={() => setDate(formatDate(new Date()))} className="px-2.5 h-9 rounded-xl bg-indigo-100 text-indigo-600 text-xs font-medium">Nay</button>}
            <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()+1); if (d <= new Date()) setDate(formatDate(d)); }}
              disabled={today} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 disabled:opacity-30">→</button>
          </div>
        </div>

        {/* Live */}
        {today && (
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            {live ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl">{getCat(live.category)?.emoji}</span>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{live.title}</div>
                    <div className="text-white/70 text-xs">từ {fmtTimeVN(live.startedAt)}</div>
                  </div>
                  <div className="font-mono font-black text-xl tabular-nums">{fmtElapsed(elapsed)}</div>
                </div>
                <button onClick={() => { S.stopLiveTrack(); reload(); }}
                  className="w-full mt-2 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-bold">⏹ Dừng</button>
                <div className="flex gap-1.5 mt-2 overflow-x-auto">
                  {ACTS.filter(c => c.value !== live.category).slice(0, 7).map(c => (
                    <button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }}
                      className="shrink-0 bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg text-[11px]">{c.emoji}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-500 mb-2 font-medium">▶ Chọn để bắt đầu tracking:</div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTS.map(c => (
                    <button key={c.value} onClick={() => { S.startLiveTrack(c.label, c.value); reload(); }}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-green-50 hover:text-green-700 px-2 py-1.5 rounded-lg text-xs active:scale-95">
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {liveRecent.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Đã track</div>
                {liveRecent.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-2 py-0.5 text-xs text-slate-500 group">
                    <button onClick={() => { S.startLiveTrack(r.title, r.category); reload(); }} className="hover:text-green-500">▶</button>
                    <span>{getCat(r.category)?.emoji}</span>
                    <span className="flex-1 truncate">{r.title}</span>
                    <span className="text-[10px]">{fmtTimeVN(r.startedAt)}</span>
                    <button onClick={() => { S.deleteLiveTrack(r.id); reload(); }} className="hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {(totCal > 0 || totExp > 0 || totAct > 0) && (
          <div className="flex gap-1.5 overflow-x-auto">
            {totCal > 0 && <P>🔥 {totCal} cal</P>}
            {totAct > 0 && <P>⏱️ {fmtDur(totAct)}</P>}
            {totExp > 0 && <P>💸 {fmtCurrency(totExp)}</P>}
            <P>🍽️ {meals.length}</P>
            <P>📋 {acts.length}</P>
          </div>
        )}

        {/* Daily note */}
        <DayNote status={status} date={date} onSave={reload} />

        {/* Meals */}
        <Sec title="Bữa ăn" emoji="🍽️" count={meals.length} c={!!col.m} onT={() => tog("m")} onA={() => setModal("meal")}>
          {meals.length === 0 ? <Em /> : (
            <div className="space-y-2">
              {Object.entries(mp).sort((a, b) => a[0].localeCompare(b[0])).map(([k, ms]) => {
                const [, label, emoji] = k.split("|");
                return (
                  <div key={k}>
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">{emoji} {label}</div>
                    {ms.map(m => (
                      <div key={m.id} className="flex items-start gap-1.5 py-0.5 group">
                        {m.image ? (
                          <button onClick={() => setImg(m.image)} className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                            <img src={m.image} alt="" className="w-full h-full object-cover" />
                          </button>
                        ) : <span className="w-9 text-center text-sm">🍽️</span>}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] truncate">{m.foodName}</div>
                          <div className="flex gap-2 text-[10px] text-slate-400">
                            {m.time && <span>{m.time}</span>}
                            {m.calories != null && m.calories > 0 && <span className="bg-orange-100 text-orange-600 px-1 rounded-full">{m.calories}</span>}
                          </div>
                        </div>
                        <button onClick={() => del("meal", m.id)} className="text-[10px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Sec>

        {/* Activities */}
        <Sec title="Hoạt động" emoji="📋" count={acts.length} c={!!col.a} onT={() => tog("a")} onA={() => setModal("act")}>
          {acts.length === 0 ? <Em /> : acts.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 py-1 group">
              <span className="text-sm">{getCat(a.category)?.emoji || "📋"}</span>
              <span className="text-[13px] flex-1 truncate">{a.title}</span>
              {a.startTime && <span className="text-[10px] text-slate-400 shrink-0">{a.startTime}{a.endTime ? `–${a.endTime}` : ""}</span>}
              {a.durationMinutes != null && a.durationMinutes > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded-full shrink-0">{fmtDur(a.durationMinutes)}</span>}
              <button onClick={() => del("act", a.id)} className="text-[10px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0">✕</button>
            </div>
          ))}
        </Sec>

        {/* Expenses */}
        <Sec title="Chi tiêu" emoji="💰" count={exps.length} c={!!col.e} onT={() => tog("e")} onA={() => setModal("exp")}
          extra={totExp > 0 ? <span className="text-xs font-bold text-red-500">{fmtCurrency(totExp)}</span> : undefined}>
          {exps.length === 0 ? <Em /> : (
            <div className="space-y-1">
              {exps.map(e => (
                <div key={e.id} className="flex items-start gap-1.5 py-0.5 group">
                  {e.image ? (
                    <button onClick={() => setImg(e.image)} className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                      <img src={e.image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ) : <span className="w-9 text-center text-sm">{getEC(e.category)?.emoji || "📦"}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">{e.description}</div>
                    <div className="text-[10px] text-slate-400">{fmtTimeVN(e.createdAt)}</div>
                  </div>
                  <span className="text-[11px] font-bold text-red-500 shrink-0">-{fmtCurrency(e.amount)}</span>
                  <button onClick={() => del("exp", e.id)} className="text-[10px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0">✕</button>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 mt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Tổng</span>
                <span className="text-sm font-black text-red-500">{fmtCurrency(totExp)}</span>
              </div>
            </div>
          )}
        </Sec>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t py-1.5 sm:hidden z-30">
        <div className="flex justify-around max-w-xl mx-auto">
          {[
            { e: "🍽️", l: "Ăn", m: "meal" },
            { e: "📋", l: "Việc", m: "act" },
            { e: "💰", l: "Chi", m: "exp" },
            { e: "📊", l: "Lịch sử", m: "history" },
          ].map(b => (
            <button key={b.m} onClick={() => setModal(b.m)} className="flex flex-col items-center gap-0.5 px-3 py-0.5 active:scale-95">
              <span className="text-lg">{b.e}</span>
              <span className="text-[10px] font-medium text-slate-500">{b.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {modal === "meal" && <MealModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "act" && <ActModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "exp" && <ExpModal date={date} onDone={() => { reload(); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "history" && <HistModal onClose={() => setModal(null)} onPick={d => { setDate(d); setModal(null); }} />}

      {/* Image */}
      {img && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImg(null)}>
          <div className="relative max-w-lg w-full">
            <img src={img} alt="" className="w-full rounded-lg" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={e => { e.stopPropagation(); const l = document.createElement("a"); l.download = `img-${Date.now()}.jpg`; l.href = img; l.click(); }}
                className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm">📥</button>
              <button onClick={() => setImg(null)} className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small components ── */

function P({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 bg-white shadow-sm px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap">{children}</span>;
}
function Em() { return <p className="text-[11px] text-slate-400 py-1.5 text-center">💡 Nhấn + để thêm</p>; }

function Sec({ title, emoji, count, c, onT, onA, extra, children }: {
  title: string; emoji: string; count: number; c: boolean; onT: () => void; onA: () => void; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center px-3 py-2">
        <button onClick={onT} className="flex items-center gap-1.5 flex-1 text-left">
          <span className="text-sm">{emoji}</span>
          <span className="font-bold text-[13px]">{title}</span>
          {count > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
          {extra && <span className="ml-auto mr-1">{extra}</span>}
          <span className={`text-slate-400 text-[10px] transition-transform ${c ? "" : "rotate-180"}`}>▼</span>
        </button>
        <button onClick={onA} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">+</button>
      </div>
      {!c && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

function DayNote({ status, date, onSave }: { status: S.DailyStatus | null; date: string; onSave: () => void }) {
  const [ed, setEd] = useState(false);
  const [sl, setSl] = useState("");
  const [wa, setWa] = useState("");
  const [wt, setWt] = useState("");
  const [nt, setNt] = useState("");

  useEffect(() => {
    setSl(status?.sleepHours ? String(status.sleepHours / 60) : "");
    setWa(status?.waterCups ? String(status.waterCups) : "");
    setWt(status?.weight ? String(status.weight / 1000) : "");
    setNt(status?.dailyNote || "");
    setEd(false);
  }, [status, date]);

  if (!ed) {
    const h = status && (status.sleepHours || status.waterCups || status.weight || status.dailyNote);
    return (
      <div onClick={() => setEd(true)} className="flex items-center gap-2 flex-wrap cursor-pointer group">
        {h ? (
          <>
            {status.sleepHours != null && status.sleepHours > 0 && <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs">💤 {(status.sleepHours / 60).toFixed(1)}h</span>}
            {status.waterCups != null && status.waterCups > 0 && <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded-lg text-xs">💧 {status.waterCups}</span>}
            {status.weight != null && status.weight > 0 && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs">⚖️ {(status.weight / 1000).toFixed(1)}kg</span>}
            {status.dailyNote && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs truncate max-w-[150px]">📝 {status.dailyNote}</span>}
          </>
        ) : <button className="text-xs text-slate-400 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg">+ Ghi chú ngày</button>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input type="number" step="0.5" value={sl} onChange={e => setSl(e.target.value)} placeholder="💤 Ngủ(h)" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-300" />
        <input type="number" value={wa} onChange={e => setWa(e.target.value)} placeholder="💧 Nước" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-300" />
        <input type="number" step="0.1" value={wt} onChange={e => setWt(e.target.value)} placeholder="⚖️ Kg" className="px-2 py-1.5 rounded-lg bg-slate-100 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <input type="text" value={nt} onChange={e => setNt(e.target.value)} placeholder="📝 Ghi chú..." className="w-full px-2 py-1.5 rounded-lg bg-slate-100 text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-300" />
      <div className="flex gap-2">
        <button onClick={() => setEd(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">Hủy</button>
        <button onClick={() => {
          S.saveDailyStatus({ date, sleepHours: sl ? Math.round(parseFloat(sl) * 60) : null, waterCups: wa ? parseInt(wa) : null, weight: wt ? Math.round(parseFloat(wt) * 1000) : null, dailyNote: nt || null });
          onSave(); setEd(false);
        }} className="flex-1 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium">Lưu</button>
      </div>
    </div>
  );
}

/* ── Modals ── */

function Wrap({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
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

function ImgPick({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  if (value) return (
    <div className="relative mb-3">
      <img src={value} alt="" className="w-full h-32 object-cover rounded-xl" />
      <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 w-7 h-7 bg-black/50 text-white rounded-full text-xs">✕</button>
    </div>
  );
  return (
    <label className="block mb-3 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-center text-sm text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500">
      {label}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(f);
      }} />
    </label>
  );
}

function MealModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [mt, setMt] = useState(autoMealType());
  const [fn, setFn] = useState("");
  const [cal, setCal] = useState("");
  const [tm, setTm] = useState(nowHHMM());
  const [im, setIm] = useState<string | null>(null);
  return (
    <Wrap title="🍽️ Thêm bữa ăn" onClose={onClose}>
      <div className="flex gap-1.5 mb-3">
        {MEALS.map(m => (
          <button key={m.value} onClick={() => setMt(m.value)} className={`flex-1 py-2 rounded-xl text-xs font-medium ${mt === m.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            <div className="text-base">{m.emoji}</div>{m.label}
          </button>
        ))}
      </div>
      <ImgPick value={im} onChange={setIm} label="📷 Chụp ảnh món ăn" />
      <input type="text" value={fn} onChange={e => setFn(e.target.value)} placeholder="Tên món ăn" autoFocus className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2 outline-none focus:ring-2 focus:ring-indigo-300" />
      <div className="flex gap-2 mb-3">
        <input type="time" value={tm} onChange={e => setTm(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
        <input type="number" value={cal} onChange={e => setCal(e.target.value)} placeholder="🔥 Calo" className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <button onClick={() => { if (!fn.trim()) return; S.addMeal({ date, mealType: mt, foodName: fn.trim(), calories: cal ? parseInt(cal) : null, time: tm || nowHHMM(), notes: null, image: im }); onDone(); }}
        disabled={!fn.trim()} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Wrap>
  );
}

function ActModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [cat, setCat] = useState("work");
  const [ti, setTi] = useState("");
  const [dur, setDur] = useState("");
  const [st, setSt] = useState("");
  return (
    <Wrap title="📋 Thêm hoạt động" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ACTS.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)} className={`px-2 py-1.5 rounded-lg text-xs ${cat === c.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <input type="text" value={ti} onChange={e => setTi(e.target.value)} placeholder="Hoạt động gì?" autoFocus className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2 outline-none focus:ring-2 focus:ring-indigo-300" />
      <div className="flex gap-2 mb-3">
        <input type="time" value={st} onChange={e => setSt(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Bắt đầu" />
        <input type="number" value={dur} onChange={e => setDur(e.target.value)} placeholder="⏱️ Phút" className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <button onClick={() => { if (!ti.trim()) return; S.addActivity({ date, category: cat, title: ti.trim(), description: null, durationMinutes: dur ? parseInt(dur) : null, startTime: st || null, endTime: null }); onDone(); }}
        disabled={!ti.trim()} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Wrap>
  );
}

function ExpModal({ date, onDone, onClose }: { date: string; onDone: () => void; onClose: () => void }) {
  const [cat, setCat] = useState("food");
  const [ds, setDs] = useState("");
  const [am, setAm] = useState("");
  const [im, setIm] = useState<string | null>(null);
  return (
    <Wrap title="💰 Thêm chi tiêu" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXPS.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)} className={`px-2 py-1.5 rounded-lg text-xs ${cat === c.value ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <ImgPick value={im} onChange={setIm} label="🧾 Chụp hóa đơn" />
      <input type="text" value={ds} onChange={e => setDs(e.target.value)} placeholder="Mô tả" autoFocus className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-2 outline-none focus:ring-2 focus:ring-indigo-300" />
      <input type="number" value={am} onChange={e => setAm(e.target.value)} placeholder="💵 Số tiền (VNĐ)" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 mb-1 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-300" />
      {am && <p className="text-xs text-slate-400 mb-3 text-right">= {fmtCurrency(parseInt(am) || 0)}</p>}
      <button onClick={() => { if (!ds.trim() || !am) return; S.addExpense({ date, category: cat, description: ds.trim(), amount: parseInt(am), image: im }); onDone(); }}
        disabled={!ds.trim() || !am} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">Thêm</button>
    </Wrap>
  );
}

function HistModal({ onClose, onPick }: { onClose: () => void; onPick: (d: string) => void }) {
  const hist = S.getHistory().filter(d => d.date !== formatDate(new Date()));
  return (
    <Wrap title="📊 Lịch sử" onClose={onClose}>
      {hist.length === 0 ? (
        <div className="text-center py-8 text-slate-400"><span className="text-4xl block mb-2">📭</span><p>Chưa có dữ liệu</p></div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto -mx-4 px-4 space-y-0.5">
          {hist.map(d => (
            <button key={d.date} onClick={() => onPick(d.date)} className="w-full flex items-center gap-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 text-left">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-black text-indigo-600 leading-none">{new Date(d.date + "T00:00:00").getDate()}</span>
                <span className="text-[8px] text-indigo-400">{["CN","T2","T3","T4","T5","T6","T7"][new Date(d.date + "T00:00:00").getDay()]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{fmtDateDisp(d.date)}</div>
                <div className="flex gap-1 mt-0.5">
                  {d.mealsCount > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🍽️{d.mealsCount}</span>}
                  {d.activitiesCount > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">📋{d.activitiesCount}</span>}
                  {d.totalCalories > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🔥{d.totalCalories}</span>}
                </div>
              </div>
              {d.expensesTotal > 0 && <span className="text-xs text-red-500 font-bold shrink-0">{fmtCurrency(d.expensesTotal)}</span>}
              <span className="text-slate-300">→</span>
            </button>
          ))}
        </div>
      )}
    </Wrap>
  );
}
