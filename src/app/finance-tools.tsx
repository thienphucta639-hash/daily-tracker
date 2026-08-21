"use client";

import { useMemo, useState } from "react";
import * as S from "@/lib/storage";
import { fmtCurrency, fmtDateDisp, parseMoney } from "@/lib/utils";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
const I = {
  wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z",
  dream: "M12 3l2.4 4.86L20 8.67l-4 3.9.94 5.5L12 15.5l-4.94 2.57.94-5.5-4-3.9 5.6-.81z",
  think: "M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5z",
  calc: "M4 2h16v20H4zM8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
  plus: "M12 5v14M5 12h14",
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
};

const input = "w-full px-3 py-2.5 rounded-lg bg-bg2 border border-line text-sm outline-none focus:border-ink min-h-[44px]";

function MoneyField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const n = parseMoney(value);
  return <div><input value={value} onChange={e => onChange(e.target.value)} inputMode="decimal" placeholder={placeholder} className={input} />{value && <div className={`text-[9px] text-right mt-0.5 ${n == null ? "text-red" : "text-green"}`}>{n == null ? "Sai số tiền" : fmtCurrency(n)}</div>}</div>;
}

export default function FinanceTools() {
  const [tab, setTab] = useState<"money" | "dream" | "think" | "calc">("money");
  const [, refresh] = useState(0);
  const reload = () => refresh(x => x + 1);

  return (
    <section className="bg-card rounded-xl border border-line overflow-hidden">
      <div className="grid grid-cols-4 gap-1 p-1 border-b border-line">
        {[
          { k: "money" as const, l: "Tiền", d: I.wallet },
          { k: "dream" as const, l: "Mơ ước", d: I.dream },
          { k: "think" as const, l: "Cân nhắc", d: I.think },
          { k: "calc" as const, l: "Máy tính", d: I.calc },
        ].map(t => <button key={t.k} onClick={() => setTab(t.k)} className={`min-h-[44px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold ${tab === t.k ? "bg-ink text-bg" : "text-mute hover:text-ink"}`}><Icon d={t.d} size={14} />{t.l}</button>)}
      </div>
      {tab === "money" && <MoneyPanel onChanged={reload} />}
      {tab === "dream" && <DreamPanel onChanged={reload} />}
      {tab === "think" && <DecisionPanel onChanged={reload} />}
      {tab === "calc" && <Calculator />}
    </section>
  );
}

function MoneyPanel({ onChanged }: { onChanged: () => void }) {
  const accounts = S.getMoneyAccounts();
  const total = S.getTotalMoney();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<S.MoneyAccount["type"]>("bank");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#4db8ff");

  return <div className="p-3 space-y-2">
    <div className="flex items-end justify-between">
      <div><div className="text-[9px] text-mute uppercase tracking-widest font-bold">Tổng tiền hiện có</div><div className="text-2xl font-bold tnum text-green">{fmtCurrency(total)}</div></div>
      <button onClick={() => setAdding(!adding)} className="w-9 h-9 bg-ink text-bg rounded-lg flex items-center justify-center"><Icon d={adding ? I.x : I.plus} /></button>
    </div>
    {adding && <div className="bg-bg2 rounded-lg p-2 space-y-1.5 border border-line">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên tài khoản / ngân hàng" className={input} autoFocus />
      <div className="grid grid-cols-4 gap-1">{(["cash","bank","ewallet","other"] as const).map(t => <button key={t} onClick={() => setType(t)} className={`py-2 rounded-md text-[9px] font-bold ${type === t ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{t === "cash" ? "Tiền mặt" : t === "bank" ? "Ngân hàng" : t === "ewallet" ? "Ví điện tử" : "Khác"}</button>)}</div>
      <div className="flex gap-2"><div className="flex-1"><MoneyField value={balance} onChange={setBalance} placeholder="Số dư" /></div><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-11 h-11 rounded-lg border border-line" /></div>
      <button onClick={() => { const n = parseMoney(balance); if (!name.trim() || n == null) return; S.addMoneyAccount({ name: name.trim(), type, balance: n, color }); setName(""); setBalance(""); setAdding(false); onChanged(); }} className="w-full min-h-[44px] bg-ink text-bg rounded-lg font-bold text-[11px]">Lưu tài khoản</button>
    </div>}
    <div className="space-y-1.5">{accounts.map(a => <div key={a.id} className="flex items-center gap-2 bg-bg2 border border-line rounded-lg px-2.5 py-2" style={{ borderLeftColor: a.color, borderLeftWidth: 3 }}>
      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">{a.name}</div><div className="text-[9px] text-mute">{a.type === "cash" ? "Tiền mặt" : a.type === "bank" ? "Ngân hàng" : a.type === "ewallet" ? "Ví điện tử" : "Khác"}</div></div>
      <div className="font-bold text-[12px] tnum">{fmtCurrency(a.balance)}</div>
      <button onClick={() => { const v = prompt("Cộng/trừ số tiền (VD: 500k hoặc -200k):"); if (!v) return; const negative = v.trim().startsWith("-"); const n = parseMoney(v.replace("-", "")); if (n != null) { S.adjustMoneyAccount(a.id, negative ? -n : n); onChanged(); } }} className="w-8 h-8 bg-card border border-line rounded-md text-[12px] font-bold">±</button>
      <button onClick={() => { if (confirm("Xóa tài khoản?")) { S.deleteMoneyAccount(a.id); onChanged(); } }} className="w-8 h-8 flex items-center justify-center text-mute hover:text-red"><Icon d={I.x} size={12} /></button>
    </div>)}</div>
  </div>;
}

function DreamPanel({ onChanged }: { onChanged: () => void }) {
  const items = S.getDreamItems();
  const totalMoney = S.getTotalMoney();
  const urgentDebt = S.getDebts().filter(d => d.priority >= 2).reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [saved, setSaved] = useState(""); const [monthly, setMonthly] = useState(""); const [reserve, setReserve] = useState(""); const [reason, setReason] = useState(""); const [target, setTarget] = useState(""); const [category, setCategory] = useState<S.DreamItem["category"]>("want"); const [priority, setPriority] = useState(1);

  return <div className="p-3 space-y-2">
    <div className="flex justify-between items-center"><div><div className="font-bold text-sm">Món đồ mơ ước</div><div className="text-[9px] text-mute">Theo dõi, để dành và quyết định đúng lúc</div></div><button onClick={() => setAdding(!adding)} className="w-9 h-9 bg-ink text-bg rounded-lg flex items-center justify-center"><Icon d={adding ? I.x : I.plus} /></button></div>
    {adding && <div className="bg-bg2 rounded-lg border border-line p-2 space-y-1.5">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên món muốn mua" className={input} autoFocus />
      <div className="grid grid-cols-3 gap-1">{(["need","want","subscription","experience","other"] as const).map(c => <button key={c} onClick={() => setCategory(c)} className={`py-2 rounded-md text-[9px] font-bold ${category === c ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{c === "need" ? "Cần" : c === "want" ? "Muốn" : c === "subscription" ? "Gói cước" : c === "experience" ? "Trải nghiệm" : "Khác"}</button>)}</div>
      <div className="grid grid-cols-2 gap-1.5"><MoneyField value={price} onChange={setPrice} placeholder="Giá món đồ" /><MoneyField value={saved} onChange={setSaved} placeholder="Đã để dành" /><MoneyField value={monthly} onChange={setMonthly} placeholder="Để dành/tháng" /><MoneyField value={reserve} onChange={setReserve} placeholder="Quỹ dự phòng tối thiểu" /></div>
      <input type="date" value={target} onChange={e => setTarget(e.target.value)} className={input} />
      <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Vì sao muốn mua / lợi ích" className={input} />
      <div className="grid grid-cols-3 gap-1">{[0,1,2].map(p => <button key={p} onClick={() => setPriority(p)} className={`py-2 rounded-md text-[9px] font-bold ${priority === p ? "bg-ink text-bg" : "bg-card border border-line text-mute"}`}>{p === 0 ? "Để sau" : p === 1 ? "Muốn mua" : "Ưu tiên"}</button>)}</div>
      <button onClick={() => { const pr = parseMoney(price); if (!name.trim() || pr == null) return; S.addDreamItem({ name: name.trim(), category, price: pr, savedAmount: parseMoney(saved) || 0, monthlySaving: parseMoney(monthly) || 0, reserveAmount: parseMoney(reserve) || 0, priority, targetDate: target || null, reason: reason.trim() || null, status: "saving" }); setAdding(false); onChanged(); }} className="w-full min-h-[44px] bg-ink text-bg rounded-lg font-bold text-[11px]">Lưu mục tiêu</button>
    </div>}
    {items.length === 0 ? <div className="text-center text-mute text-[10px] py-4">Chưa có món mơ ước</div> : items.map(d => {
      const remaining = Math.max(0, d.price - d.savedAmount);
      const pct = d.price > 0 ? Math.min(100, Math.round(d.savedAmount / d.price * 100)) : 0;
      const months = d.monthlySaving > 0 ? Math.ceil(remaining / d.monthlySaving) : null;
      const canAffordNow = totalMoney >= d.price + d.reserveAmount;
      let advice = "Nên để dành thêm";
      let adviceColor = "text-gold";
      if (d.savedAmount >= d.price) { advice = "Đã đủ quỹ — có thể mua"; adviceColor = "text-green"; }
      else if (canAffordNow && urgentDebt === 0 && (d.category === "need" || d.priority >= 2)) { advice = "Có thể cân nhắc mua ngay"; adviceColor = "text-green"; }
      else if (urgentDebt > 0) { advice = "Nên ưu tiên trả nợ quan trọng trước"; adviceColor = "text-red"; }
      return <div key={d.id} className="bg-bg2 border border-line rounded-lg p-2.5">
        <div className="flex items-start gap-2"><div className="flex-1"><div className="text-[12px] font-bold">{d.name}</div><div className={`text-[9px] font-bold ${adviceColor}`}>{advice}</div></div><div className="text-right"><div className="text-[12px] font-bold tnum">{fmtCurrency(d.price)}</div><div className="text-[9px] text-mute">{pct}%</div></div></div>
        <div className="h-1.5 bg-card rounded-full my-1.5 overflow-hidden"><div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} /></div>
        <div className="flex flex-wrap gap-x-3 text-[9px] text-mute"><span>Còn: {fmtCurrency(remaining)}</span>{months != null && <span>≈ {months} tháng</span>}{d.targetDate && <span>Mục tiêu: {fmtDateDisp(d.targetDate)}</span>}</div>
        {d.reason && <div className="text-[9px] text-mute mt-1">{d.reason}</div>}
        <div className="flex gap-1 mt-2"><button onClick={() => { const v = prompt("Thêm vào quỹ:"); const n = v ? parseMoney(v) : null; if (n != null && n > 0) { S.contributeDream(d.id, n); onChanged(); } }} className="flex-1 py-1.5 bg-green2 border border-green/20 text-green rounded-md text-[9px] font-bold">+ Để dành</button><button onClick={() => { S.updateDreamItem(d.id, { status: "bought" }); onChanged(); }} className="px-2 py-1.5 bg-card border border-line text-mute rounded-md text-[9px] font-bold"><Icon d={I.check} size={11} /></button><button onClick={() => { if(confirm("Xóa mục tiêu?")){S.deleteDreamItem(d.id);onChanged();} }} className="px-2 py-1.5 text-mute hover:text-red"><Icon d={I.x} size={11}/></button></div>
      </div>;
    })}
  </div>;
}

function DecisionPanel({ onChanged }: { onChanged: () => void }) {
  const totalMoney = S.getTotalMoney();
  const totalDebt = S.getTotalDebt();
  const [name,setName]=useState(""); const [type,setType]=useState<S.BuyDecision["type"]>("item"); const [price,setPrice]=useState(""); const [monthly,setMonthly]=useState(""); const [uses,setUses]=useState("1"); const [importance,setImportance]=useState(3); const [urgency,setUrgency]=useState(2); const [alt,setAlt]=useState(false); const [notes,setNotes]=useState("");
  const p = parseMoney(price) || 0; const mp = parseMoney(monthly) || 0;
  const annual = type === "subscription" ? mp * 12 : p;
  const useCount = Math.max(1, parseInt(uses) || 1);
  const costPerUse = annual / useCount;
  const burden = totalMoney > 0 ? annual / totalMoney : 99;
  let score = importance * 18 + urgency * 10 - (alt ? 15 : 0) - Math.min(35, burden * 35) - (totalDebt > 0 && type !== "item" ? 15 : 0);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const result = score >= 70 && annual <= totalMoney ? "Có thể cân nhắc mua" : score >= 45 ? "Nên chờ 7 ngày rồi đánh giá lại" : "Chưa nên mua";
  const color = score >= 70 ? "text-green" : score >= 45 ? "text-gold" : "text-red";

  return <div className="p-3 space-y-2">
    <div><div className="font-bold text-sm">Có nên mua?</div><div className="text-[9px] text-mute">Phân tích theo tiền hiện có, nợ, độ cần thiết và tần suất dùng</div></div>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Món đồ / gói cước / chương trình" className={input}/>
    <div className="grid grid-cols-4 gap-1">{(["item","subscription","course","service"] as const).map(t=><button key={t} onClick={()=>setType(t)} className={`py-2 rounded-md text-[9px] font-bold ${type===t?"bg-ink text-bg":"bg-bg2 border border-line text-mute"}`}>{t==="item"?"Món đồ":t==="subscription"?"Gói cước":t==="course"?"Khóa học":"Dịch vụ"}</button>)}</div>
    <div className="grid grid-cols-2 gap-1.5"><MoneyField value={price} onChange={setPrice} placeholder="Giá mua 1 lần"/><MoneyField value={monthly} onChange={setMonthly} placeholder="Phí mỗi tháng"/></div>
    <input type="number" value={uses} onChange={e=>setUses(e.target.value)} placeholder="Số lần dự kiến sử dụng/năm" className={input}/>
    <div className="grid grid-cols-2 gap-1.5"><label className="text-[9px] text-mute">Cần thiết: {importance}/5<input type="range" min="1" max="5" value={importance} onChange={e=>setImportance(+e.target.value)} className="w-full"/></label><label className="text-[9px] text-mute">Gấp: {urgency}/5<input type="range" min="1" max="5" value={urgency} onChange={e=>setUrgency(+e.target.value)} className="w-full"/></label></div>
    <label className="flex items-center gap-2 text-[10px] text-mute"><input type="checkbox" checked={alt} onChange={e=>setAlt(e.target.checked)}/>Có phương án rẻ/miễn phí thay thế</label>
    <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Lý do, lợi ích, rủi ro..." rows={2} className={`${input} resize-none`}/>
    <div className="bg-bg2 border border-line rounded-lg p-2.5">
      <div className="flex justify-between items-center"><span className="text-[10px] text-mute">Điểm hợp lý</span><span className={`text-xl font-bold tnum ${color}`}>{score}/100</span></div>
      <div className={`text-[11px] font-bold ${color}`}>{result}</div>
      <div className="grid grid-cols-2 gap-1 mt-1 text-[9px] text-mute"><span>Chi phí/năm: {fmtCurrency(annual)}</span><span>Lần dùng: {fmtCurrency(Math.round(costPerUse))}</span><span>Tiền hiện có: {fmtCurrency(totalMoney)}</span><span>Tổng nợ: {fmtCurrency(totalDebt)}</span></div>
    </div>
    <button onClick={()=>{if(!name.trim())return;S.addBuyDecision({name:name.trim(),type,price:p,monthlyPrice:mp,expectedUses:useCount,importance,urgency,hasAlternative:alt,notes:notes.trim()||null,result,score});onChanged();}} className="w-full min-h-[44px] bg-ink text-bg rounded-lg font-bold text-[11px]">Lưu đánh giá</button>
    {S.getBuyDecisions().slice(0,3).map(d=><div key={d.id} className="flex items-center gap-2 bg-bg2 border border-line rounded-lg px-2 py-1.5"><div className="flex-1"><div className="text-[10px] font-bold">{d.name}</div><div className="text-[9px] text-mute">{d.result}</div></div><span className="text-[10px] font-bold tnum">{d.score}</span><button onClick={()=>{S.deleteBuyDecision(d.id);onChanged();}} className="text-mute hover:text-red"><Icon d={I.x} size={10}/></button></div>)}
  </div>;
}

function Calculator() {
  const [expr,setExpr]=useState(""); const [result,setResult]=useState("0");
  const calc=()=>{try{if(!/^[0-9+\-*/().%\s]+$/.test(expr))throw 0;const v=Function(`"use strict";return (${expr.replace(/%/g,"/100")})`)();if(!Number.isFinite(v))throw 0;setResult(new Intl.NumberFormat("vi-VN",{maximumFractionDigits:4}).format(v));}catch{setResult("Lỗi");}};
  return <div className="p-3"><div className="bg-bg2 border border-line rounded-lg p-3 text-right mb-2"><input value={expr} onChange={e=>setExpr(e.target.value)} inputMode="decimal" placeholder="0" className="w-full bg-transparent text-right text-sm outline-none"/><div className="text-2xl font-bold tnum mt-1">{result}</div></div><div className="grid grid-cols-4 gap-1.5">{["7","8","9","/","4","5","6","*","1","2","3","-","0",".","%","+","(",")","C","="].map(k=><button key={k} onClick={()=>{if(k==="C"){setExpr("");setResult("0");}else if(k==="=")calc();else setExpr(expr+k);}} className={`min-h-[44px] rounded-lg font-bold text-sm ${k==="="?"bg-ink text-bg":/[+\-*/]/.test(k)?"bg-gold2 text-gold border border-gold/20":"bg-bg2 border border-line"}`}>{k}</button>)}</div></div>;
}
