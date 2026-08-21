"use client";

import { useState } from "react";
import * as S from "@/lib/storage";
import { fmtCurrency, fmtDateDisp, daysUntil, parseMoney, formatDate, CAT_ICONS } from "@/lib/utils";
import { getUpcomingHolidays } from "@/lib/holidays";

function SvgIcon({ path, size = 13, color = "currentColor" }: { path: string; size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}
const I_TRAVEL = "M9 20l-5.5-4 3.5-1L9 20l5-2 2 2 5-4-8-5-5 2 3-4 9 5 2-2-3-8-2-2-6 4 2 3-7 4-2 3 5 2-4 2";

const input = "w-full px-2.5 py-2 rounded-lg bg-bg2 border border-line text-[11px] outline-none focus:border-ink min-h-[40px]";
export function playNotify() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new Ctx();
    const g = ac.createGain(); g.connect(ac.destination); g.gain.value = 0.25;
    [880, 1174, 1568].forEach((f, i) => {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f;
      o.connect(g); o.start(ac.currentTime + i * 0.18); o.stop(ac.currentTime + i * 0.18 + 0.28);
    });
  } catch { /* blocked */ }
}

export function ExpiryManager({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [days, setDays] = useState(""); const [link, setLink] = useState("");
  const items = S.getExpiringWithin(999).sort((a, b) => a.daysLeft - b.daysLeft);
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Hạn sử dụng đồ dùng</div>
    <div className="grid grid-cols-2 gap-1.5">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên (Chuối, Trứng...)" className={input} />
      <input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="Giá" className={input} />
      <input value={days} onChange={e => setDays(e.target.value)} inputMode="numeric" placeholder="Bao nhiêu ngày hết hạn" className={input} />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link mua lại (tùy chọn)" className={input} />
    </div>
    <button onClick={() => { const p = parseMoney(price) || 0, d = parseInt(days) || 0;
      if (!name.trim() || d <= 0) return;
      // Tự ghi lại giá mua để lần sau bán gợi đúng giá
      if (p > 0) S.addExpensePreset({ description: name.trim(), amount: p, category: "shopping" });
      S.addExpiryItem({ name: name.trim(), price: p, link: link.trim() || null, boughtDate: formatDate(new Date()), expiryDays: d });
      setName(""); setPrice(""); setDays(""); setLink(""); onChanged(); playNotify();
    }} className="w-full min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold">+ Thêm</button>
    {items.length === 0 && <div className="text-center text-mute text-[9px] py-2">Chưa có món nào. Thêm chuối/trứng/sữa để pet nhắc hạn.</div>}
    {items.map(x => {
      const urgent = x.daysLeft <= 1;
      return <div key={x.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${urgent ? "border-red/50 bg-red/5" : "border-line bg-bg2"}`}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold truncate">{x.name}{x.price > 0 && <span className="text-mute font-normal"> · {fmtCurrency(x.price)}</span>}</div>
          <div className={`text-[9px] ${urgent ? "text-red font-bold" : "text-mute"}`}>
            {x.daysLeft < 0 ? `Hết hạn ${Math.abs(x.daysLeft)} ngày trước!` : x.daysLeft === 0 ? "HẾT HẠN HÔM NAY!" : `Còn ${x.daysLeft} ngày · ${fmtDateDisp(x.expiryDate)}`}
          </div>
        </div>
        {x.link && <button onClick={() => window.open(x.link || "", "_blank")} className="text-[9px] bg-blue2 text-blue px-1.5 py-1 rounded font-bold">Mua lại</button>}
        <button onClick={() => { S.deleteExpiryItem(x.id); onChanged(); }} className="w-7 h-7 text-mute hover:text-red">✕</button>
      </div>;
    })}
  </div>;
}

export function RecurringManager({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [next, setNext] = useState(""); const [cycle, setCycle] = useState<S.RecurringItem["cycle"]>("monthly"); const [kind, setKind] = useState<S.RecurringItem["kind"]>("subscription"); const [note, setNote] = useState("");
  const items = S.getRecurringDueWithin(999).sort((a, b) => a.daysLeft - b.daysLeft);
  const kindLabel: Record<S.RecurringItem["kind"], string> = { subscription: "Gói cước", insurance: "Bảo hiểm", vehicle: "Xe", bill: "Hóa đơn", chore: "Việc định kỳ", other: "Khác" };
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Gia hạn định kỳ (Netflix, Gym, bảo hiểm, xe...)</div>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Netflix, Spotify, Bảo hiểm xe, Gym..." className={input} />
    <div className="grid grid-cols-4 gap-1">{(["subscription","insurance","vehicle","bill"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`min-h-[36px] rounded-md text-[9px] font-bold ${kind === k ? "bg-ink text-bg" : "bg-bg2 border border-line text-mute"}`}>{kindLabel[k]}</button>)}</div>
    <div className="grid grid-cols-2 gap-1.5">
      <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="Số tiền (tùy chọn)" className={input} />
      <select value={cycle} onChange={e => setCycle(e.target.value as S.RecurringItem["cycle"])} className={input}>
        <option value="daily">Hằng ngày</option><option value="weekly">Hàng tuần</option><option value="monthly">Hàng tháng</option><option value="quarterly">Hàng quý</option><option value="yearly">Hàng năm</option>
      </select>
    </div>
    <label className="text-[9px] text-mute font-bold block">Gia hạn tiếp theo<input type="date" value={next} onChange={e => setNext(e.target.value)} className={`${input} min-h-[44px] mt-0.5`} /></label>
    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" className={input} />
    <button onClick={() => { if (!name.trim() || !next) return;
      S.addRecurring({ name: name.trim(), kind, amount: parseMoney(amount) || 0, cycle, cycleDays: null, nextDate: next, note: note.trim() || null, link: null });
      setName(""); setAmount(""); setNext(""); setNote(""); onChanged(); playNotify();
    }} className="w-full min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold">+ Thêm</button>
    {items.length === 0 && <div className="text-center text-mute text-[9px] py-2">Chưa có gói nào. Thêm Netflix/Gym để pet nhắc gia hạn.</div>}
    {items.map(r => {
      const urgent = r.daysLeft <= 1;
      return <div key={r.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${urgent ? "border-red/50 bg-red/5" : "border-line bg-bg2"}`}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold truncate">{r.name} <span className="text-[8px] text-mute font-normal">· {kindLabel[r.kind]}</span></div>
          <div className={`text-[9px] ${urgent ? "text-red font-bold" : "text-mute"}`}>
            {r.daysLeft < 0 ? `Trễ ${Math.abs(r.daysLeft)} ngày!` : r.daysLeft === 0 ? "GIA HẠN HÔM NAY!" : `Còn ${r.daysLeft} ngày · ${fmtDateDisp(r.nextDate)} · ${S.cycleLabel(r)}`}
            {r.amount > 0 && <span className="text-red"> · {fmtCurrency(r.amount)}</span>}
          </div>
        </div>
        <button onClick={() => { S.bumpRecurring(r.id); onChanged(); playNotify(); }} title="Đã gia hạn" className="px-2 py-1 bg-green2 border border-green/20 text-green rounded-md text-[9px] font-bold">Đã đóng</button>
        <button onClick={() => { S.deleteRecurring(r.id); onChanged(); }} className="w-7 h-7 text-mute hover:text-red">✕</button>
      </div>;
    })}
  </div>;
}

export function OthersManager({ onChanged }: { onChanged: () => void }) {
  const [section, setSection] = useState<"place" | "borrow" | null>(null);
  const [name, setName] = useState(""); const [note, setNote] = useState(""); const [address, setAddress] = useState(""); const [bestFor, setBestFor] = useState(""); const [priceRange, setPriceRange] = useState(""); const [placeLink, setPlaceLink] = useState(""); const [rating, setRating] = useState(5); const [kind, setKind] = useState<S.PlaceItem["kind"]>("food");
  const [borrower, setBorrower] = useState(""); const [item, setItem] = useState(""); const [ret, setRet] = useState(""); const [bNote, setBNote] = useState(""); const [priority, setPriority] = useState(1);
  const places = S.getPlaces(), borrows = S.getBorrows(), overdue = S.getOverdueBorrows(30);
  const suggest = () => { const p = S.suggestPlace(); alert(p ? `${p.name}\n${p.kind === "food" ? "Quán ăn" : p.kind === "coffee" ? "Cafe" : p.kind === "play" ? "Chỗ chơi" : "Địa điểm"}\n${p.address || ""}\n${p.bestFor ? "Hợp: " + p.bestFor : ""}\n${p.priceRange ? "Giá: " + p.priceRange : ""}\n${p.note || ""}${p.link ? "\n" + p.link : ""}` : "Chưa lưu địa điểm nào."); };
  return <div className="p-3 space-y-2">
    <button onClick={() => setSection(section === "place" ? null : "place")} className="w-full min-h-[42px] px-2 bg-bg2 border border-line rounded-lg flex items-center justify-between text-[10px] font-bold"><span>Địa điểm hay ({places.length})</span><span>›</span></button>
    {section === "place" && <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1">{(["food","coffee","play","other"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`min-h-[34px] rounded-md text-[8px] font-bold ${kind === k ? "bg-ink text-bg" : "bg-bg2 border border-line text-mute"}`}>{k === "food" ? "Ăn" : k === "coffee" ? "Cafe" : k === "play" ? "Chơi" : "Khác"}</button>)}</div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên địa điểm" className={input} />
      <div className="grid grid-cols-2 gap-1.5"><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ" className={input}/><input value={priceRange} onChange={e => setPriceRange(e.target.value)} placeholder="Khoảng giá" className={input}/><input value={bestFor} onChange={e => setBestFor(e.target.value)} placeholder="Hợp đi với ai/dịp gì" className={input}/><input value={placeLink} onChange={e => setPlaceLink(e.target.value)} placeholder="Link bản đồ" className={input}/></div>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Món ngon / điểm hay / lưu ý" className={input}/>
      <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} className={`flex-1 min-h-[32px] rounded-md text-[10px] ${n <= rating ? "bg-gold2 text-gold" : "bg-bg2 text-mute"}`}>★</button>)}</div>
      <div className="flex gap-1.5"><button onClick={() => { if (!name.trim()) return; S.addPlace({ name:name.trim(), kind, note:note||null, link:placeLink||null, address:address||null, bestFor:bestFor||null, priceRange:priceRange||null, rating }); setName("");setNote("");setAddress("");setBestFor("");setPriceRange("");setPlaceLink("");onChanged(); }} className="flex-1 min-h-[38px] bg-ink text-bg rounded-lg text-[9px] font-bold">Lưu địa điểm</button><button onClick={suggest} className="flex-1 min-h-[38px] bg-gold2 text-gold border border-gold/20 rounded-lg text-[9px] font-bold">Pet: đi đâu?</button></div>
      {places.map(p => <div key={p.id} className="bg-bg2 border border-line rounded-lg p-2"><div className="flex"><div className="flex-1"><div className="text-[10px] font-bold">{p.name} <span className="text-gold">{"★".repeat(p.rating||0)}</span></div><div className="text-[9px] text-mute">{p.address}{p.priceRange?` · ${p.priceRange}`:""}</div>{p.bestFor&&<div className="text-[9px] text-mute">Hợp: {p.bestFor}</div>}{p.note&&<div className="text-[9px]">{p.note}</div>}</div><button onClick={()=>{S.deletePlace(p.id);onChanged();}} className="w-7 h-7 text-mute">✕</button></div>{p.link&&<button onClick={()=>window.open(p.link||"","_blank")} className="text-[9px] text-blue mt-1">Mở bản đồ</button>}</div>)}
    </div>}
    <button onClick={() => setSection(section === "borrow" ? null : "borrow")} className="w-full min-h-[42px] px-2 bg-bg2 border border-line rounded-lg flex items-center justify-between text-[10px] font-bold"><span>Đồ cho mượn ({borrows.length}) {overdue.length>0&&<b className="text-red">· {overdue.length} trễ</b>}</span><span>›</span></button>
    {section === "borrow" && <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5"><input value={borrower} onChange={e=>setBorrower(e.target.value)} placeholder="Ai mượn" className={input}/><input value={item} onChange={e=>setItem(e.target.value)} placeholder="Mượn gì" className={input}/></div>
      <label className="text-[9px] text-mute">Cần lấy lại ngày<input type="date" value={ret} onChange={e=>setRet(e.target.value)} className={input}/></label>
      <input value={bNote} onChange={e=>setBNote(e.target.value)} placeholder="Ghi chú" className={input}/>
      <div className="grid grid-cols-3 gap-1">{[0,1,2].map(p=><button key={p} onClick={()=>setPriority(p)} className={`min-h-[34px] rounded-md text-[8px] font-bold ${priority===p?"bg-ink text-bg":"bg-bg2 border border-line text-mute"}`}>{p===0?"Không gấp":p===1?"Cần lại":"Rất gấp"}</button>)}</div>
      <button onClick={()=>{if(!borrower.trim()||!item.trim())return;S.addBorrow({borrower:borrower.trim(),item:item.trim(),lentDate:formatDate(new Date()),expectedReturn:ret||null,priority,note:bNote||null});setBorrower("");setItem("");setRet("");setBNote("");onChanged();playNotify();}} className="w-full min-h-[38px] bg-ink text-bg rounded-lg text-[9px] font-bold">Ghi lại</button>
      {borrows.map(b=>{const left=b.expectedReturn?daysUntil(b.expectedReturn):null,urgent=(b.priority||0)>=2||left!==null&&left<=0;return <div key={b.id} className={`bg-bg2 border rounded-lg p-2 ${urgent?"border-red/50":"border-line"}`}><div className="flex gap-2"><div className="flex-1"><div className="text-[10px] font-bold">{b.borrower} ← {b.item} {(b.priority||0)>=2&&<span className="text-red">RẤT GẤP</span>}</div><div className={`text-[9px] ${urgent?"text-red":"text-mute"}`}>{left===null?"Chưa đặt hạn":left<0?`Trễ ${Math.abs(left)} ngày`:left===0?"CẦN LẠI HÔM NAY":`Còn ${left} ngày`}</div>{b.note&&<div className="text-[9px]">{b.note}</div>}</div><button onClick={()=>{S.markBorrowReturned(b.id);onChanged();}} className="px-2 min-h-[32px] bg-green2 text-green rounded-md text-[8px] font-bold">Đã trả</button></div><div className="flex gap-1 mt-1">{b.expectedReturn&&<button onClick={()=>{const d=prompt("Gia hạn tới ngày (YYYY-MM-DD):",b.expectedReturn||"");if(d){S.extendBorrow(b.id,d);onChanged();}}} className="text-[8px] text-blue">Gia hạn ngày trả</button>}<button onClick={()=>{S.deleteBorrow(b.id);onChanged();}} className="ml-auto text-[8px] text-mute">Xóa</button></div></div>})}
    </div>}
  </div>;
}

export function ChecklistManager({ onChanged }: { onChanged: () => void }) {
  const [listId, setListId] = useState<string | null>(null);
  const [newList, setNewList] = useState(""); const [newIcon, setNewIcon] = useState("travel");
  const [newItem, setNewItem] = useState("");
  const lists = S.getChecklists();
  const current = lists.find(l => l.id === listId) || lists[0] || null;
  const preIconOpts = ["travel", "work", "study", "personal", "chores", "exercise", "eat", "social"] as const;
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Checklist mang theo khi đi</div>
    <div className="flex gap-1.5">
      <input value={newList} onChange={e => setNewList(e.target.value)} placeholder="Chủ đề (Du lịch, Đi học, Đi làm...)" className={input} />
      <div className="grid grid-cols-4 gap-0.5 w-32 shrink-0">{preIconOpts.map(k => <button key={k} onClick={() => setNewIcon(k)} title={k} className={`min-h-[34px] rounded flex items-center justify-center ${newIcon === k ? "bg-ink text-bg" : "bg-bg2 border border-line"}`}><SvgIcon path={k === "travel" ? I_TRAVEL : CAT_ICONS[k] || CAT_ICONS.other} size={13} /></button>)}</div>
      <button onClick={() => { if (!newList.trim()) return; S.addChecklist({ name: newList.trim(), icon: newIcon, items: [] }); setNewList(""); onChanged(); }} className="px-3 min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold shrink-0">+ Tạo</button>
    </div>
    {lists.length === 0 && <div className="text-center text-mute text-[9px] py-2">Chưa có checklist. Tạo một cái cho Du lịch / Đi học / Đi làm để pet nhắc đem đủ đồ.</div>}
    {lists.length > 0 && <>
      <div className="flex gap-1 overflow-x-auto pb-0.5">{lists.map(l => <button key={l.id} onClick={() => setListId(l.id)} className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold min-h-[36px] flex items-center gap-1 ${current?.id === l.id ? "bg-ink text-bg" : "bg-bg2 border border-line text-mute"}`}><SvgIcon path={l.icon === "travel" ? I_TRAVEL : CAT_ICONS[l.icon] || CAT_ICONS.other} size={12} />{l.name}</button>)}</div>
      {current && <div className="bg-bg2 rounded-lg border border-line p-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold">{current.name} · {current.items.filter(i => i.checked).length}/{current.items.length}</span>
          <div className="flex gap-1">
            <button onClick={() => { S.resetChecklist(current.id); onChanged(); }} className="text-[8px] text-mute hover:text-ink px-1.5 py-1 rounded" title="Dùng lại lần sau">↺ Dùng lại</button>
            <button onClick={() => { if (confirm("Xóa checklist?")) { S.deleteChecklist(current.id); setListId(null); onChanged(); } }} className="text-[8px] text-mute hover:text-red px-1.5 py-1 rounded">Xóa</button>
          </div>
        </div>
        <div className="flex gap-1.5 mb-1.5">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) { S.addChecklistItem(current.id, newItem.trim()); setNewItem(""); onChanged(); } }} placeholder="Đồ cần đem (áo, sạc, tiền mặt...)" className={input} />
          <button onClick={() => { if (newItem.trim()) { S.addChecklistItem(current.id, newItem.trim()); setNewItem(""); onChanged(); } }} className="px-3 min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold shrink-0">+</button>
        </div>
        {current.items.length === 0 && <div className="text-[9px] text-mute text-center py-1.5">Chưa có đồ nào. Thêm đồng, sạc, tiền mặt...</div>}
        {current.items.map(it => (
          <div key={it.id} className="flex items-center gap-2 py-1 group">
            <button onClick={() => { S.toggleChecklistItem(current.id, it.id); onChanged(); }} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 shrink-0 ${it.checked ? "bg-green border-green text-bg" : "border-line hover:border-ink"}`}>{it.checked && "✓"}</button>
            <span className={`text-[11px] flex-1 ${it.checked ? "line-through text-mute" : ""}`}>{it.name}</span>
            <button onClick={() => { S.deleteChecklistItem(current.id, it.id); onChanged(); }} className="text-mute text-[10px] hover:text-red opacity-100 sm:opacity-0 sm:group-hover:opacity-100">✕</button>
          </div>
        ))}
        {current.items.length > 0 && current.items.every(i => i.checked) && <div className="text-[9px] text-green font-bold text-center py-1">Đủ đồ! Sẵn sàng đi ✓</div>}
      </div>}
    </>}
  </div>;
}

export function HolidaysManager({ onChanged }: { onChanged: () => void }) {
  void onChanged;
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [note, setNote] = useState("");
  const custom = S.getCustomEvents();
  const holidays = getUpcomingHolidays(8);
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Đếm ngược lễ & sự kiện</div>
    <div className="text-[8px] text-mute">Lễ Tin Lành và lễ Việt Nam có sẵn. Tự thêm sinh nhật, thi, hẹn...</div>
    <div className="flex gap-1.5">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên sự kiện" className={input} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${input} shrink-0 w-32`} />
      <button onClick={() => { if (!name.trim() || !date) return; S.addCustomEvent({ name: name.trim(), date, note: note.trim() || null }); setName(""); setDate(""); setNote(""); onChanged(); playNotify(); }} className="px-3 min-h-[40px] bg-ink text-bg rounded-lg text-[10px] font-bold shrink-0">+</button>
    </div>
    {name && <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" className={input} />}
    {custom.length > 0 && <div className="text-[8px] font-bold text-mute uppercase">Sự kiện cá nhân</div>}
    {[...custom].sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
      const dl = daysUntil(ev.date); if (dl < 0) return null;
      return <div key={ev.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${dl === 0 ? "border-gold/40 bg-gold/5" : "border-line bg-bg2"}`}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold truncate">{ev.name}</div>
          <div className={`text-[9px] ${dl === 0 ? "text-gold font-bold" : dl <= 3 ? "text-blue font-bold" : "text-mute"}`}>
            {dl === 0 ? "HÔM NAY!" : dl === 1 ? "NGÀY MAI" : `còn ${dl} ngày`} · {fmtDateDisp(ev.date)}
          </div>
        </div>
        <button onClick={() => { S.deleteCustomEvent(ev.id); onChanged(); }} className="w-7 h-7 text-mute hover:text-red">✕</button>
      </div>;
    })}
    <div className="text-[8px] font-bold text-mute uppercase">Lễ có sẵn</div>
    {holidays.map(h => (
      <div key={h.date + h.name} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${h.daysLeft === 0 ? "border-gold/40 bg-gold/5" : "border-line bg-bg2"}`}>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold truncate flex items-center gap-1.5">{h.christian ? <SvgIcon path="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zM12 9v8M10 11h4" size={11} /> : <SvgIcon path={CAT_ICONS.bills} size={11} />}{h.name}</div>
          <div className={`text-[9px] ${h.daysLeft === 0 ? "text-gold font-bold" : h.daysLeft <= 3 ? "text-blue font-bold" : "text-mute"}`}>
            {h.daysLeft === 0 ? "HÔM NAY!" : h.daysLeft === 1 ? "NGÀY MAI" : `còn ${h.daysLeft} ngày`} · {fmtDateDisp(h.date)}
          </div>
        </div>
      </div>
    ))}
  </div>;
}

export function Top3Manager({ onChanged }: { onChanged: () => void }) {
  const today = formatDate(new Date());
  const plans = S.getPlans(today).filter(p => !p.done);
  const top3 = S.getTop3(today);
  return <div className="p-3 space-y-2">
    <div className="text-[10px] font-bold">Top 3 việc quan trọng hôm nay <span className="text-mute font-normal">(chọn đúng 3)</span></div>
    {plans.length === 0 && <div className="text-[9px] text-mute">Chưa có kế hoạch nào hôm nay. Thêm plan trước rồi chọn Top 3.</div>}
    {plans.map(p => {
      const on = top3.includes(p.id);
      return <button key={p.id} onClick={() => {
        let next = on ? top3.filter(x => x !== p.id) : [...top3, p.id];
        if (next.length > 3) return; // max 3
        S.setTop3(today, next); onChanged(); if (!on && next.length === 3) playNotify();
      }} className={`w-full flex items-center gap-2 min-h-[40px] px-2 py-1.5 rounded-lg border text-left transition-all ${on ? "bg-gold2 border-gold/30 text-gold" : "bg-bg2 border-line text-ink"}`}>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${on ? "border-gold bg-gold text-bg" : "border-line"}`}>{on ? "✓" : ""}</span>
        <span className="text-[11px] font-bold flex-1 truncate">{p.title}</span>
        {p.time && <span className="text-[9px] text-mute tnum shrink-0">{p.time}</span>}
      </button>;
    })}
    {top3.length > 0 && <div className="text-[9px] text-gold font-bold">{top3.length}/3 đã chọn · Pet sẽ nhắc tập trung vào {top3.length === 3 ? "3 việc này" : "những việc đã chọn"}</div>}
  </div>;
}
