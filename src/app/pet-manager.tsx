"use client";

import { useState, useEffect } from "react";
import * as S from "@/lib/storage";
import { fmtCurrency, fmtDateDisp, daysUntil, parseMoney, formatDate, CAT_ICONS } from "@/lib/utils";
import { getCurrentAndNextMonthHolidays } from "@/lib/holidays";

const input = "w-full px-2.5 py-2 rounded-lg bg-bg2 border border-line text-[11px] outline-none focus:border-ink min-h-[40px]";

// ── Money input có hiện format VNĐ khi gõ ──
function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const n = parseMoney(value);
  return <div>
    <input value={value} onChange={e => onChange(e.target.value)} inputMode="decimal" placeholder={placeholder} className={input} />
    {value.trim() && <p className={`text-[9px] text-right mt-0.5 font-bold ${n == null ? "text-red" : "text-green"}`}>{n == null ? "Sai số tiền" : fmtCurrency(n)}</p>}
  </div>;
}

function SvgIcon({ path, size = 13 }: { path: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}
const I_TRAVEL = "M9 20l-5.5-4 3.5-1L9 20l5-2 2 2 5-4-8-5-5 2 3-4 9 5 2-2-3-8-2-2-6 4 2 3-7 4-2 3 5 2-4 2";

let notifyCtx: AudioContext | null = null;
export function playNotify() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!notifyCtx) notifyCtx = new Ctx();
    if (notifyCtx.state === "suspended") notifyCtx.resume();
    const g = notifyCtx.createGain(); g.gain.value = 0.4; g.connect(notifyCtx.destination);
    [880, 1174, 1568].forEach((f, i) => { const o = notifyCtx!.createOscillator(); o.frequency.value = f; o.connect(g); o.start(notifyCtx!.currentTime + i * 0.16); o.stop(notifyCtx!.currentTime + i * 0.16 + 0.24); });
  } catch {}
}
if (typeof window !== "undefined") { const u = () => { try { notifyCtx ??= new AudioContext(); notifyCtx.resume(); } catch {} }; window.addEventListener("touchstart", u, { once: true }); window.addEventListener("click", u, { once: true }); }

// ═══ EXPIRY ═══
export function ExpiryManager({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [days, setDays] = useState(""); const [link, setLink] = useState("");
  const items = S.getExpiringWithin(999).sort((a, b) => a.daysLeft - b.daysLeft);
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Hạn sử dụng · pet nhắc trước 1 ngày</div>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên đồ/món" className={input} />
    <MoneyInput value={price} onChange={setPrice} placeholder="Giá mua (VD: 25k, 50000)" />
    <div className="flex gap-1.5"><input value={days} onChange={e => setDays(e.target.value)} inputMode="numeric" placeholder="Dùng được bao nhiêu ngày" className={input} /><input value={link} onChange={e => setLink(e.target.value)} placeholder="Link mua lại (tùy chọn)" className={input} /></div>
    <button onClick={() => { const d = +days || 0, p = parseMoney(price) || 0; if (!name.trim() || d <= 0) return; if (p > 0) S.addExpensePreset({ description: name.trim(), amount: p, category: "shopping" }); S.addExpiryItem({ name: name.trim(), price: p, link: link.trim() || null, boughtDate: formatDate(new Date()), expiryDays: d }); setName(""); setPrice(""); setDays(""); setLink(""); onChanged(); }} className="w-full min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold">Thêm</button>
    {items.map(x => <div key={x.id} className={`flex gap-2 items-center p-2 rounded-lg border ${x.daysLeft <= 1 ? "border-red/50 bg-red/5" : "border-line bg-bg2"}`}>
      <div className="flex-1"><div className="text-[10px] font-bold">{x.name}{x.price > 0 && <span className="text-mute font-normal"> · {fmtCurrency(x.price)}</span>}</div>
      <div className={`text-[9px] ${x.daysLeft <= 1 ? "text-red font-bold" : "text-mute"}`}>{x.daysLeft < 0 ? `Quá hạn ${-x.daysLeft} ngày` : x.daysLeft === 0 ? "HẾT HẠN HÔM NAY!" : `Còn ${x.daysLeft} ngày · ${fmtDateDisp(x.expiryDate)}`}</div></div>
      {x.link && <button onClick={() => window.open(x.link || "", "_blank")} className="px-2 py-1 bg-blue2 text-blue rounded text-[8px] font-bold">Mua</button>}
      <button onClick={() => { S.deleteExpiryItem(x.id); onChanged(); }} className="w-7 h-7 text-mute">✕</button>
    </div>)}
  </div>;
}

// ═══ RECURRING ═══
export function RecurringManager({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [next, setNext] = useState(""); const [endDate, setEndDate] = useState(""); const [cycle, setCycle] = useState<S.RecurringItem["cycle"]>("monthly"); const [kind, setKind] = useState<S.RecurringItem["kind"]>("subscription"); const [note, setNote] = useState(""); const [keep, setKeep] = useState(true);
  const items = S.getRecurringDueWithin(999); const kindLabel: Record<S.RecurringItem["kind"], string> = { subscription: "Gói", insurance: "Bảo hiểm", vehicle: "Xe", bill: "Hóa đơn", chore: "Việc", other: "Khác" };
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Gia hạn định kỳ</div>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="4G 10k/ngày, Gym 7 tháng, Netflix..." className={input} />
    <div className="grid grid-cols-3 gap-1">{(["subscription", "insurance", "vehicle", "bill", "chore", "other"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`min-h-[34px] rounded text-[8px] font-bold ${kind === k ? "bg-ink text-bg" : "bg-bg2 border border-line text-mute"}`}>{kindLabel[k]}</button>)}</div>
    <MoneyInput value={amount} onChange={setAmount} placeholder="Số tiền (VD: 10k, 500000)" />
    <div className="grid grid-cols-2 gap-1.5"><select value={cycle} onChange={e => setCycle(e.target.value as S.RecurringItem["cycle"])} className={input}><option value="daily">Hằng ngày</option><option value="weekly">Hàng tuần</option><option value="monthly">Hàng tháng</option><option value="quarterly">Hàng quý</option><option value="yearly">Hàng năm</option></select>
    <label className="text-[9px] text-mute font-bold">Ngày bắt đầu<input type="date" value={next} onChange={e => setNext(e.target.value)} className={`${input} mt-0.5`} /></label></div>
    <label className="text-[9px] text-mute font-bold">Hạn cuối (tùy chọn — VD: gói Gym 7 tháng thì nhập ngày hết hạn)<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${input} mt-0.5`} /></label>
    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú" className={input} />
    <label className="flex gap-2 items-center text-[9px] text-mute"><input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)} />Tiếp tục gia hạn</label>
    <button onClick={() => { if (!name.trim() || !next) return; S.addRecurring({ name: name.trim(), kind, amount: parseMoney(amount) || 0, cycle, cycleDays: null, nextDate: next, endDate: endDate || null, note: note.trim() || null, link: null, keep }); setName(""); setAmount(""); setNext(""); setEndDate(""); setNote(""); onChanged(); }} className="w-full min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold">Thêm</button>
    {items.map(r => <div key={r.id} className={`flex gap-2 items-center p-2 rounded-lg border ${r.daysLeft <= 1 ? "border-red/50 bg-red/5" : "border-line bg-bg2"}`}>
      <div className="flex-1"><div className="text-[10px] font-bold">{r.name}{r.keep === false && <span className="text-gold text-[8px]"> · CÂN NHẮC HỦY</span>}</div>
      <div className={`text-[9px] ${r.daysLeft <= 1 ? "text-red" : "text-mute"}`}>{r.daysLeft < 0 ? `Trễ ${-r.daysLeft} ngày` : r.daysLeft === 0 ? "HÔM NAY" : `Còn ${r.daysLeft} ngày`} · {S.cycleLabel(r)}{r.amount > 0 && ` · ${fmtCurrency(r.amount)}`}</div>
      {r.endDate && <div className={`text-[9px] ${daysUntil(r.endDate) <= 7 ? "text-red font-bold" : "text-mute"}`}>Hết hạn: {fmtDateDisp(r.endDate)}{daysUntil(r.endDate) >= 0 ? ` (còn ${daysUntil(r.endDate)} ngày)` : " (đã hết)"}</div>}</div>
      <button onClick={() => { S.bumpRecurring(r.id); onChanged(); }} className="px-2 min-h-[32px] bg-green2 text-green rounded text-[8px] font-bold">Đã đóng</button>
      <button onClick={() => { S.deleteRecurring(r.id); onChanged(); }} className="w-7 h-7 text-mute">✕</button>
    </div>)}
  </div>;
}

// ═══ CHECKLIST ═══
export function ChecklistManager({ onChanged }: { onChanged: () => void }) {
  const [listId, setListId] = useState<string | null>(null);
  const [newList, setNewList] = useState(""); const [newIcon, setNewIcon] = useState("travel"); const [tripDate, setTripDate] = useState(""); const [remindBefore, setRemindBefore] = useState("1"); const [newItem, setNewItem] = useState("");
  const lists = S.getChecklists(); const current = lists.find(l => l.id === listId) || lists[0] || null;
  const preIconOpts = ["travel", "work", "study", "personal", "chores", "exercise", "eat", "social"] as const;
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Checklist mang theo khi đi</div>
    <input value={newList} onChange={e => setNewList(e.target.value)} placeholder="Chủ đề (Du lịch, Đi học...)" className={input} />
    <div className="grid grid-cols-2 gap-1.5">
      <label className="text-[9px] text-mute font-bold">Ngày đi<input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} className={`${input} mt-0.5`} /></label>
      <label className="text-[9px] text-mute font-bold">Nhắc trước (ngày)<input type="number" value={remindBefore} onChange={e => setRemindBefore(e.target.value)} placeholder="1" className={`${input} mt-0.5`} /></label>
    </div>
    <div className="flex gap-1">{preIconOpts.map(k => <button key={k} onClick={() => setNewIcon(k)} className={`flex-1 min-h-[34px] rounded flex items-center justify-center ${newIcon === k ? "bg-ink text-bg" : "bg-bg2 border border-line"}`}><SvgIcon path={k === "travel" ? I_TRAVEL : CAT_ICONS[k] || CAT_ICONS.other} size={13} /></button>)}</div>
    <button onClick={() => { if (!newList.trim()) return; S.addChecklist({ name: newList.trim(), icon: newIcon, items: [], tripDate: tripDate || null, remindBefore: parseInt(remindBefore) || 1 }); setNewList(""); setTripDate(""); onChanged(); }} className="w-full min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold">+ Tạo checklist</button>
    {lists.map(l => {
      const isCurrent = current?.id === l.id;
      const dl = l.tripDate ? daysUntil(l.tripDate) : null;
      const shouldRemind = l.tripDate && dl !== null && dl <= (l.remindBefore || 1) && l.items.some(i => !i.checked);
      return <div key={l.id}>
        <button onClick={() => setListId(isCurrent ? null : l.id)} className={`w-full min-h-[40px] px-2 rounded-lg flex items-center justify-between text-[10px] font-bold ${isCurrent ? "bg-ink text-bg" : "bg-bg2 border border-line"}`}>
          <span className="flex items-center gap-1"><SvgIcon path={l.icon === "travel" ? I_TRAVEL : CAT_ICONS[l.icon] || CAT_ICONS.other} size={12} />{l.name}{shouldRemind && <span className="text-gold">⚠</span>}</span>
          <span className="text-[9px] font-normal">{l.items.filter(i => i.checked).length}/{l.items.length}{l.tripDate && ` · ${fmtDateDisp(l.tripDate)}`}</span>
        </button>
        {isCurrent && <div className="bg-bg2 rounded-lg border border-line p-2 mt-1 space-y-1.5">
          {l.tripDate && <div className={`text-[9px] font-bold ${dl === 0 ? "text-gold" : dl !== null && dl < 0 ? "text-red" : "text-mute"}`}>{dl === 0 ? "ĐI HÔM NAY!" : dl !== null && dl < 0 ? `Đã qua ${-dl} ngày` : `Còn ${dl} ngày nữa đi`}</div>}
          <div className="flex gap-1.5"><input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) { S.addChecklistItem(current!.id, newItem.trim()); setNewItem(""); onChanged(); } }} placeholder="Đồ cần đem..." className={input} /><button onClick={() => { if (newItem.trim()) { S.addChecklistItem(current!.id, newItem.trim()); setNewItem(""); onChanged(); } }} className="px-3 bg-ink text-bg rounded-lg text-[10px] font-bold">+</button></div>
          {l.items.map(it => <div key={it.id} className="flex items-center gap-2 py-0.5 group">
            <button onClick={() => { S.toggleChecklistItem(l.id, it.id); onChanged(); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[9px] ${it.checked ? "bg-green border-green text-bg" : "border-line"}`}>{it.checked && "✓"}</button>
            <span className={`text-[11px] flex-1 ${it.checked ? "line-through text-mute" : ""}`}>{it.name}</span>
            <button onClick={() => { S.deleteChecklistItem(l.id, it.id); onChanged(); }} className="text-mute text-[9px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100">✕</button>
          </div>)}
          {l.items.length > 0 && l.items.every(i => i.checked) && <div className="text-[9px] text-green font-bold text-center py-1">Đủ đồ! Sẵn sàng ✓</div>}
          <div className="flex gap-1"><button onClick={() => { S.resetChecklist(l.id); onChanged(); }} className="text-[8px] text-mute px-1.5 py-1 rounded">↺ Dùng lại</button><button onClick={() => { if (confirm("Xóa?")) { S.deleteChecklist(l.id); setListId(null); onChanged(); } }} className="text-[8px] text-mute hover:text-red px-1.5 py-1 rounded ml-auto">Xóa</button></div>
        </div>}
      </div>;
    })}
  </div>;
}

// ═══ HOLIDAYS — theo tháng hiện tại + tháng sau ═══
function useRealCountdown(targetDate: string) {
  const [tl, setTl] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate + "T00:00:00").getTime() - Date.now();
      if (diff <= 0) { setTl({ d: 0, h: 0, m: 0, s: 0, done: true }); return; }
      setTl({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return tl;
}

function FestiveCountdown({ name, daysLeft, date }: { name: string; daysLeft: number; date: string }) {
  const isXmas = name.includes("Giang") || name.toLowerCase().includes("christmas") || name.includes("Sinh");
  const isTet = name.includes("Tet") || name.includes("Nguy");
  const tl = useRealCountdown(date);
  void daysLeft;
  const fmtN = (n: number) => String(n).padStart(2, "0");

  if (isXmas) return (
    <div className="xmas-card rounded-xl p-3 text-white relative overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="snow" style={{ width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`, left: `${(i * 5.2) % 100}%`, top: `-10px`, animation: `snow${(i % 4) + 1} ${1.5 + (i % 3) * 0.5}s linear ${i * 0.15}s infinite` }} />
      ))}
      <div className="relative z-10 flex items-center gap-2">
        {/* Detailed Christmas Tree */}
        <svg width="40" height="48" viewBox="0 0 40 48" className="tree-glow shrink-0" fill="none">
          {/* Trunk */}
          <rect x="17" y="42" width="6" height="5" rx="1" fill="#6b3410" />
          {/* Tree body — 5 layered organic curves */}
          <path d="M20 2C16 7 12 11 8 16c3-1 6-2 8-3-5 6-10 11-14 17 4-1 8-2 11-3-4 6-8 11-12 16h36c-4-5-8-10-12-16 3 1 7 2 11 3-4-6-9-11-14-17 2 1 5 2 8 3C28 11 24 7 20 2Z" fill="#0a3d2e" stroke="#2ed573" strokeWidth="0.8" />
          {/* Garlands — curved lines wrapping tree */}
          <path d="M10 16Q20 13 30 16" stroke="#2ed573" strokeWidth="0.5" fill="none" opacity="0.6" />
          <path d="M6 24Q20 20 34 24" stroke="#2ed573" strokeWidth="0.5" fill="none" opacity="0.6" />
          <path d="M4 33Q20 28 36 33" stroke="#2ed573" strokeWidth="0.5" fill="none" opacity="0.6" />
          {/* Ornaments — 8 colorful balls */}
          <circle cx="13" cy="14" r="1.5" fill="#3b82f6" className="light-blink" />
          <circle cx="27" cy="14" r="1.5" fill="#ffd700" className="light-blink" style={{ animationDelay: ".15s" }} />
          <circle cx="9" cy="22" r="1.8" fill="#ef4444" className="light-blink" style={{ animationDelay: ".3s" }} />
          <circle cx="31" cy="22" r="1.5" fill="#a855f7" className="light-blink" style={{ animationDelay: ".45s" }} />
          <circle cx="20" cy="19" r="1.3" fill="#ffd700" className="light-blink" style={{ animationDelay: ".6s" }} />
          <circle cx="7" cy="31" r="1.5" fill="#ec4899" className="light-blink" style={{ animationDelay: ".2s" }} />
          <circle cx="33" cy="31" r="1.8" fill="#ffd700" className="light-blink" style={{ animationDelay: ".35s" }} />
          <circle cx="20" cy="35" r="1.5" fill="#3b82f6" className="light-blink" style={{ animationDelay: ".5s" }} />
          {/* Star on top */}
          <path d="M20 0l1.5 4 4-0.5-2.5 3 1.5 4-4-1.5-4 1.5 1.5-4-2.5-3 4 0.5z" fill="#ffd700" className="light-blink" />
          <circle cx="20" cy="3" r="1" fill="#fff" className="light-blink" style={{ animationDelay: ".1s" }} />
        </svg>
        <div className="flex-1 text-center">
          <div className="xmas-title text-[14px]">Giang Sinh</div>
          {tl.done ? <div className="xmas-num text-xl">HOM NAY!</div> : (
            <div className="flex justify-center items-baseline gap-1 mt-0.5">
              <span className="xmas-num text-xl">{tl.d}</span><span className="text-[8px] text-green-200/50">ng</span>
              <span className="text-[12px] tnum">{fmtN(tl.h)}</span><span className="text-[8px] text-green-200/50">h</span>
              <span className="text-[12px] tnum">{fmtN(tl.m)}</span><span className="text-[8px] text-green-200/50">p</span>
              <span className="text-[12px] tnum a-blink">{fmtN(tl.s)}</span><span className="text-[8px] text-green-200/50">s</span>
            </div>
          )}
          <div className="text-[8px] text-green-200/40 mt-0.5">{fmtDateDisp(date)}</div>
        </div>
      </div>
    </div>
  );

  if (isTet) return (
    <div className="tet-card rounded-xl p-3 text-white relative overflow-hidden">
      <svg className="firework fw1" viewBox="0 0 36 36"><g fill="#ffd700"><circle cx="18" cy="18" r="1.5"/><circle cx="18" cy="4" r="1"/><circle cx="18" cy="32" r="1"/><circle cx="4" cy="18" r="1"/><circle cx="32" cy="18" r="1"/><circle cx="8" cy="8" r=".8"/><circle cx="28" cy="28" r=".8"/></g><g stroke="#ffd700" strokeWidth=".8" fill="none"><line x1="18" y1="6" x2="18" y2="12"/><line x1="18" y1="24" x2="18" y2="30"/><line x1="6" y1="18" x2="12" y2="18"/><line x1="24" y1="18" x2="30" y2="18"/></g></svg>
      <svg className="firework fw2" viewBox="0 0 28 28"><g fill="#ff6b6b"><circle cx="14" cy="14" r="1"/><circle cx="14" cy="3" r=".8"/><circle cx="14" cy="25" r=".8"/><circle cx="3" cy="14" r=".8"/><circle cx="25" cy="14" r=".8"/></g></svg>
      <svg className="firework fw3" viewBox="0 0 24 24"><g fill="#fff"><circle cx="12" cy="12" r=".8"/><circle cx="12" cy="2" r=".6"/><circle cx="12" cy="22" r=".6"/><circle cx="2" cy="12" r=".6"/><circle cx="22" cy="12" r=".6"/></g></svg>
      <div className="relative z-10 flex items-center gap-2">
        <svg width="30" height="38" viewBox="0 0 40 48" className="lantern-sway shrink-0" fill="none">
          <line x1="20" y1="0" x2="20" y2="5" stroke="#ffd700" strokeWidth="1.5"/>
          <path d="M12 5Q20 2 28 5L26 9Q20 7 14 9Z" fill="#ffd700"/>
          <ellipse cx="20" cy="24" rx="14" ry="16" fill="#dc2626"/>
          <ellipse cx="20" cy="24" rx="14" ry="16" fill="none" stroke="#ffd700" strokeWidth="1.5"/>
          <path d="M8 18Q20 16 32 18" stroke="#ffd700" strokeWidth=".6" fill="none" opacity=".5"/>
          <path d="M7 24Q20 22 33 24" stroke="#ffd700" strokeWidth=".6" fill="none" opacity=".5"/>
          <path d="M8 30Q20 32 32 30" stroke="#ffd700" strokeWidth=".6" fill="none" opacity=".5"/>
          <path d="M14 39Q20 41 26 39L28 43Q20 45 12 43Z" fill="#ffd700"/>
          <line x1="20" y1="43" x2="20" y2="48" stroke="#ffd700" strokeWidth="1"/>
          <circle cx="20" cy="48" r="1.5" fill="#ffd700"/>
        </svg>
        <div className="flex-1 text-center">
          <div className="tet-title gold-shimmer text-[14px]">Tet Nguyen Dan</div>
          {tl.done ? <div className="tet-num gold-shimmer text-xl">HOM NAY!</div> : (
            <div className="flex justify-center items-baseline gap-1 mt-0.5">
              <span className="tet-num gold-shimmer text-xl">{tl.d}</span><span className="text-[8px] text-yellow-200/50">ng</span>
              <span className="text-[12px] tnum">{fmtN(tl.h)}</span><span className="text-[8px] text-yellow-200/50">h</span>
              <span className="text-[12px] tnum">{fmtN(tl.m)}</span><span className="text-[8px] text-yellow-200/50">p</span>
              <span className="text-[12px] tnum a-blink">{fmtN(tl.s)}</span><span className="text-[8px] text-yellow-200/50">s</span>
            </div>
          )}
          <div className="text-[8px] text-yellow-200/40 mt-0.5">{fmtDateDisp(date)}</div>
        </div>
      </div>
    </div>
  );
  return null;
}

export function HolidaysManager({ onChanged }: { onChanged: () => void }) {
  void onChanged;
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [note, setNote] = useState("");
  const custom = S.getCustomEvents();
  const holidays = getCurrentAndNextMonthHolidays();
  const curMonth = holidays[0]?.monthLabel || "";
  const nextMonth = holidays.find(h => h.monthLabel !== curMonth)?.monthLabel || "";
  const curHolidays = holidays.filter(h => h.monthLabel === curMonth);
  const nextHolidays = holidays.filter(h => h.monthLabel === nextMonth);
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Đếm ngược lễ & sự kiện</div>
    <div className="flex gap-1.5"><input value={name} onChange={e => setName(e.target.value)} placeholder="Tên sự kiện cá nhân" className={input} /><input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${input} shrink-0 w-28`} /><button onClick={() => { if (!name.trim() || !date) return; S.addCustomEvent({ name: name.trim(), date, note: note.trim() || null }); setName(""); setDate(""); setNote(""); onChanged(); }} className="px-3 min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold shrink-0">+</button></div>
    {name && <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú" className={input} />}
    {/* Festive countdown for Christmas + Tet — always visible */}
    {(() => {
      const now = new Date();
      const y = now.getFullYear();
      const xmas = { name: "Giang Sinh (25/12)", daysLeft: daysUntil(`${y}-12-25`), date: `${y}-12-25` };
      const xmasNext = daysUntil(xmas.date) < 0 ? { ...xmas, date: `${y+1}-12-25`, daysLeft: daysUntil(`${y+1}-12-25`) } : xmas;
      const tetApprox = { name: "Tet Nguyen Dan", daysLeft: daysUntil(`${y}-02-10`), date: `${y}-02-10` };
      const tetNext = tetApprox.daysLeft < 0 ? { ...tetApprox, date: `${y+1}-02-10`, daysLeft: daysUntil(`${y+1}-02-10`) } : tetApprox;
      return <div className="space-y-1.5"><FestiveCountdown {...xmasNext} /><FestiveCountdown {...tetNext} /></div>;
    })()}
    {[...custom].sort((a, b) => a.date.localeCompare(b.date)).filter(e => daysUntil(e.date) >= 0).map(ev => <div key={ev.id} className={`flex gap-2 items-center rounded-lg border px-2 py-1.5 ${daysUntil(ev.date) === 0 ? "border-gold/40 bg-gold/5" : daysUntil(ev.date) <= 3 ? "border-blue/30" : "border-line bg-bg2"}`}>
      <div className="flex-1"><div className="text-[10px] font-bold">{ev.name}</div><div className={`text-[9px] ${daysUntil(ev.date) === 0 ? "text-gold font-bold" : daysUntil(ev.date) <= 3 ? "text-blue" : "text-mute"}`}>{daysUntil(ev.date) === 0 ? "HÔM NAY!" : daysUntil(ev.date) === 1 ? "NGÀY MAI" : `còn ${daysUntil(ev.date)} ngày`} · {fmtDateDisp(ev.date)}</div></div>
      <button onClick={() => { S.deleteCustomEvent(ev.id); onChanged(); }} className="w-7 h-7 text-mute">✕</button>
    </div>)}
    {curHolidays.length > 0 && <div className="text-[8px] font-bold text-mute uppercase pt-1">{curMonth}</div>}
    {curHolidays.map(h => <div key={h.date + h.name} className={`flex gap-2 items-center rounded-lg border px-2 py-1.5 ${h.daysLeft === 0 ? "border-gold/40 bg-gold/5" : "border-line bg-bg2"}`}>
      <div className="flex-1"><div className="text-[10px] font-bold">{h.name}</div><div className={`text-[9px] ${h.daysLeft === 0 ? "text-gold font-bold" : h.daysLeft <= 3 ? "text-blue" : "text-mute"}`}>{h.daysLeft === 0 ? "HÔM NAY!" : h.daysLeft === 1 ? "NGÀY MAI" : `còn ${h.daysLeft} ngày`} · {fmtDateDisp(h.date)}</div></div>
    </div>)}
    {nextHolidays.length > 0 && <div className="text-[8px] font-bold text-mute uppercase pt-1">{nextMonth}</div>}
    {nextHolidays.map(h => <div key={h.date + h.name} className={`flex gap-2 items-center rounded-lg border px-2 py-1.5 ${h.daysLeft === 0 ? "border-gold/40 bg-gold/5" : "border-line bg-bg2"}`}>
      <div className="flex-1"><div className="text-[10px] font-bold">{h.name}</div><div className={`text-[9px] ${h.daysLeft === 0 ? "text-gold font-bold" : "text-mute"}`}>{h.daysLeft === 0 ? "HÔM NAY!" : `còn ${h.daysLeft} ngày`} · {fmtDateDisp(h.date)}</div></div>
    </div>)}
  </div>;
}

// ═══ OTHERS — Places + Borrows (một bảng, bấm chữ để xem) ═══
export function OthersManager({ onChanged }: { onChanged: () => void }) {
  const [tab, setTab] = useState<"places" | "borrow">("places");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [address, setAddress] = useState(""); const [note, setNote] = useState(""); const [best, setBest] = useState(""); const [price, setPrice] = useState(""); const [link, setLink] = useState(""); const [kind, setKind] = useState<S.PlaceItem["kind"]>("food"); const [expandedPlace, setExpandedPlace] = useState<string | null>(null);
  const [borrower, setBorrower] = useState(""); const [item, setItem] = useState(""); const [ret, setRet] = useState(""); const [bNote, setBNote] = useState(""); const [priority, setPriority] = useState(1);
  const places = S.getPlaces(), borrows = S.getBorrows();
  return <div className="p-3 space-y-2">
    <div className="grid grid-cols-2 gap-1 bg-bg2 p-1 rounded-lg"><button onClick={() => { setTab("places"); setAdding(false); }} className={`min-h-[34px] rounded text-[9px] font-bold ${tab === "places" ? "bg-ink text-bg" : "text-mute"}`}>Địa điểm ({places.length})</button><button onClick={() => { setTab("borrow"); setAdding(false); }} className={`min-h-[34px] rounded text-[9px] font-bold ${tab === "borrow" ? "bg-ink text-bg" : "text-mute"}`}>Cho mượn ({borrows.length})</button></div>
    {tab === "places" && <>
      {!adding ? <button onClick={() => setAdding(true)} className="w-full min-h-[36px] bg-ink text-bg rounded-lg text-[9px] font-bold">+ Thêm địa điểm</button> : <div className="bg-bg2 border border-line rounded-lg p-2 space-y-1.5">
        <div className="grid grid-cols-4 gap-1">{(["food", "coffee", "play", "other"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`min-h-[32px] rounded text-[8px] font-bold ${kind === k ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{k === "food" ? "Ăn" : k === "coffee" ? "Cafe" : k === "play" ? "Chơi" : "Khác"}</button>)}</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên địa điểm" className={input} />
        <div className="grid grid-cols-2 gap-1.5"><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ" className={input} /><MoneyInput value={price} onChange={setPrice} placeholder="Khoảng giá" /></div>
        <input value={best} onChange={e => setBest(e.target.value)} placeholder="Hợp đi với ai/dịp" className={input} />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Món ngon/điểm hay" className={input} />
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link bản đồ" className={input} />
        <div className="flex gap-1.5"><button onClick={() => { if (!name.trim()) return; S.addPlace({ name: name.trim(), kind, note: note || null, link: link || null, address: address || null, bestFor: best || null, priceRange: price || null, rating: null }); setName(""); setAddress(""); setNote(""); setBest(""); setPrice(""); setLink(""); setAdding(false); onChanged(); }} className="flex-1 min-h-[38px] bg-ink text-bg rounded text-[9px] font-bold">Lưu</button><button onClick={() => setAdding(false)} className="px-3 bg-card border border-line rounded text-[9px]">✕</button></div>
      </div>}
      {places.map(p => <div key={p.id} className="bg-bg2 border border-line rounded-lg overflow-hidden">
        <button onClick={() => setExpandedPlace(expandedPlace === p.id ? null : p.id)} className="w-full px-2 py-1.5 flex items-center justify-between text-left">
          <div className="flex-1 min-w-0"><span className="text-[10px] font-bold truncate block">{p.name}</span>{p.address && <span className="text-[9px] text-mute truncate block">{p.address}</span>}</div>
          <span className="text-[8px] text-mute shrink-0">{expandedPlace === p.id ? "▲" : "▼"}</span>
        </button>
        {expandedPlace === p.id && <div className="px-2 pb-2 space-y-0.5">
          {p.priceRange && <div className="text-[9px] text-gold">Giá: {p.priceRange}</div>}
          {p.bestFor && <div className="text-[9px] text-blue">Hợp: {p.bestFor}</div>}
          {p.note && <div className="text-[9px]">{p.note}</div>}
          <div className="flex gap-1 pt-1">{p.link && <button onClick={() => window.open(p.link || "", "_blank")} className="text-[8px] text-blue">Mở bản đồ</button>}<button onClick={() => { S.deletePlace(p.id); onChanged(); }} className="text-[8px] text-mute hover:text-red ml-auto">Xóa</button></div>
        </div>}
      </div>)}
    </>}
    {tab === "borrow" && <>
      {!adding ? <button onClick={() => setAdding(true)} className="w-full min-h-[36px] bg-ink text-bg rounded-lg text-[9px] font-bold">+ Ghi đồ cho mượn</button> : <div className="bg-bg2 border border-line rounded-lg p-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5"><input value={borrower} onChange={e => setBorrower(e.target.value)} placeholder="Ai mượn" className={input} /><input value={item} onChange={e => setItem(e.target.value)} placeholder="Mượn gì" className={input} /></div>
        <label className="text-[8px] text-mute">Cần lấy lại ngày (tùy chọn)<input type="date" value={ret} onChange={e => setRet(e.target.value)} className={input} /></label>
        <div className="grid grid-cols-3 gap-1">{[0, 1, 2].map(p => <button key={p} onClick={() => setPriority(p)} className={`min-h-[32px] rounded text-[8px] font-bold ${priority === p ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{p === 0 ? "Không gấp" : p === 1 ? "Cần lại" : "Rất gấp"}</button>)}</div>
        <input value={bNote} onChange={e => setBNote(e.target.value)} placeholder="Ghi chú" className={input} />
        <div className="flex gap-1.5"><button onClick={() => { if (!borrower.trim() || !item.trim()) return; S.addBorrow({ borrower: borrower.trim(), item: item.trim(), lentDate: formatDate(new Date()), expectedReturn: ret || null, priority, note: bNote || null }); setBorrower(""); setItem(""); setRet(""); setBNote(""); setAdding(false); onChanged(); }} className="flex-1 min-h-[38px] bg-ink text-bg rounded text-[9px] font-bold">Lưu</button><button onClick={() => setAdding(false)} className="px-3 bg-card border border-line rounded text-[9px]">✕</button></div>
      </div>}
      {borrows.map(b => { const left = b.expectedReturn ? daysUntil(b.expectedReturn) : null; const urgent = (b.priority || 0) >= 2 || (left !== null && left <= 0); return <div key={b.id} className={`bg-bg2 border rounded-lg p-2 ${urgent ? "border-red/50" : "border-line"}`}>
        <div className="flex gap-2"><div className="flex-1"><b className="text-[10px]">{b.borrower} ← {b.item}</b><div className={`text-[9px] ${(b.priority || 0) >= 2 ? "text-red font-bold" : "text-mute"}`}>{(b.priority || 0) >= 2 ? "RẤT GẤP · " : ""}{left === null ? "Chưa đặt hạn trả" : left < 0 ? `Trễ ${-left} ngày` : left === 0 ? "CẦN TRẢ HÔM NAY" : `Còn ${left} ngày`}</div>{b.note && <div className="text-[9px]">{b.note}</div>}</div><button onClick={() => { S.markBorrowReturned(b.id); onChanged(); }} className="px-2 bg-green2 text-green rounded text-[8px] font-bold shrink-0">Đã trả</button></div>
        <div className="flex mt-1">{b.expectedReturn && <button onClick={() => { const d = prompt("Gia hạn tới (YYYY-MM-DD)", b.expectedReturn || ""); if (d) { S.extendBorrow(b.id, d); onChanged(); } }} className="text-blue text-[8px]">Gia hạn</button>}<button onClick={() => { S.deleteBorrow(b.id); onChanged(); }} className="text-mute text-[8px] ml-auto">Xóa</button></div>
      </div>; })}
    </>}
  </div>;
}

// ═══ TOP 3 ═══
export function Top3Manager({ onChanged }: { onChanged: () => void }) {
  const today = formatDate(new Date()); const plans = S.getPlans(today).filter(p => !p.done); const top = S.getTop3(today);
  return <div className="p-3 space-y-2"><div className="text-[10px] font-bold">Top 3 hôm nay</div>{plans.length === 0 && <div className="text-[9px] text-mute">Chưa có kế hoạch.</div>}
    {plans.map(p => { const on = top.includes(p.id); return <button key={p.id} onClick={() => { let n = on ? top.filter(x => x !== p.id) : [...top, p.id]; if (n.length > 3) return; S.setTop3(today, n); onChanged(); if (!on && n.length === 3) playNotify(); }} className={`w-full min-h-[40px] px-2 rounded-lg border flex items-center gap-2 text-left ${on ? "bg-gold2 border-gold/30" : "bg-bg2 border-line"}`}><span className={`w-5 h-5 border-2 rounded-full flex items-center justify-center text-[9px] ${on ? "bg-gold border-gold text-bg" : "border-line"}`}>{on ? "✓" : ""}</span><span className="text-[10px] font-bold flex-1">{p.title}</span>{p.time && <span className="text-[9px] text-mute">{p.time}{p.endTime ? `–${p.endTime}` : ""}</span>}</button>; })}
    <div className="text-[9px] text-gold">{top.length}/3 đã chọn</div>
  </div>;
}
