export function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Buổi sáng";
  if (h >= 11 && h < 13) return "Buổi trưa";
  if (h >= 13 && h < 17) return "Buổi chiều";
  if (h >= 17 && h < 21) return "Buổi tối";
  return "Đêm khuya";
}

export function getTimeEmoji(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "🌅";
  if (h >= 11 && h < 13) return "☀️";
  if (h >= 13 && h < 17) return "🌤️";
  if (h >= 17 && h < 21) return "🌙";
  return "🌃";
}

export function nowHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export function autoMealType(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "breakfast";
  if (h >= 10 && h < 14) return "lunch";
  if (h >= 17 && h < 21) return "dinner";
  return "snack";
}

export function mealPeriod(time: string | null): { label: string; emoji: string; order: number } {
  if (!time) return { label: "Khác", emoji: "🍽️", order: 9 };
  const h = parseInt(time.split(":")[0]);
  if (h >= 5 && h < 11) return { label: "Buổi sáng", emoji: "🌅", order: 1 };
  if (h >= 11 && h < 14) return { label: "Buổi trưa", emoji: "☀️", order: 2 };
  if (h >= 14 && h < 17) return { label: "Buổi chiều", emoji: "🌤️", order: 3 };
  if (h >= 17 && h < 22) return { label: "Buổi tối", emoji: "🌙", order: 4 };
  return { label: "Đêm", emoji: "🌃", order: 5 };
}

export function fmtDateDisp(s: string): string {
  const d = new Date(s + "T00:00:00");
  const today = formatDate(new Date());
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const full = `${days[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
  if (s === today) return `Hôm nay · ${dd}/${mm}/${yyyy}`;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === formatDate(y)) return `Hôm qua · ${dd}/${mm}/${yyyy}`;
  return full;
}

export function fmtDateFull(s: string): string {
  const d = new Date(s + "T00:00:00");
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

// Compact Vietnamese money for tight cards: 86k, 1.5m, 10m, 1.2tỷ
export function fmtCompact(n: number): string {
  const a = Math.abs(n);
  const fmt = (v: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(v);
  if (a >= 1_000_000_000) return fmt(n / 1_000_000_000) + "tỷ";
  if (a >= 1_000_000) return fmt(n / 1_000_000) + "m";
  if (a >= 1_000) return fmt(n / 1_000) + "k";
  return String(n);
}

export function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr + "T00:00:00").getTime() - new Date(formatDate(new Date()) + "T00:00:00").getTime()) / 86400000);
}

export function fmtDur(m: number): string {
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h${r}p`;
}

export function fmtTimeVN(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  let p = "sáng";
  if (h >= 12 && h < 17) p = "chiều";
  else if (h >= 17 && h < 21) p = "tối";
  else if (h >= 21 || h < 5) p = "đêm";
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${p}`;
}

export function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// "27k" -> 27000, "27m" -> 27000000, "1,5m" -> 1500000, "250" -> 250
export function parseMoney(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/[\sđ]/g, "").replace(/vnd/g, "");
  if (!s) return null;
  let mult = 1;
  if (s.endsWith("k")) { mult = 1_000; s = s.slice(0, -1); }
  else if (s.endsWith("m")) { mult = 1_000_000; s = s.slice(0, -1); }
  s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * mult);
}

// SVG icon paths for categories
export const CAT_ICONS: Record<string, string> = {
  work: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  exercise: "M18 5h-2l-4 8-3-6-4 8H3M7 13l1.5-3M14 13l2-4",
  study: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  personal: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  entertainment: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM10 8l6 4-6 4z",
  chores: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  social: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  rest: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  eat: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  travel: "M12 2L4.5 20.3l.7.7L12 18l6.8 3 .7-.7zM12 2v16",
  food: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  transport: "M12 2L4.5 20.3l.7.7L12 18l6.8 3 .7-.7zM12 2v16",
  shopping: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  bills: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  health: "M22 12h-4l-3 9L9 3l-3 9H2",
  other: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  education: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  breakfast: "M17 8C8 10 5.9 16.2 3.8 20M12 2c0 4.4-3.6 8-8 8M21 12.8A18 18 0 0 0 5.8 20",
  lunch: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  dinner: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  snack: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
};

export const MEALS = [
  { value: "breakfast", label: "Sáng", emoji: "🌅" },
  { value: "lunch", label: "Trưa", emoji: "☀️" },
  { value: "dinner", label: "Tối", emoji: "🌙" },
  { value: "snack", label: "Ăn vặt", emoji: "🍿" },
];

export const ACTS = [
  { value: "work", label: "Công việc", emoji: "💼" },
  { value: "exercise", label: "Tập luyện", emoji: "🏃" },
  { value: "study", label: "Học tập", emoji: "📚" },
  { value: "personal", label: "Cá nhân", emoji: "🧘" },
  { value: "entertainment", label: "Giải trí", emoji: "🎮" },
  { value: "chores", label: "Việc nhà", emoji: "🏠" },
  { value: "social", label: "Giao lưu", emoji: "👥" },
  { value: "rest", label: "Nghỉ ngơi", emoji: "😴" },
  { value: "eat", label: "Ăn uống", emoji: "🍜" },
  { value: "travel", label: "Di chuyển", emoji: "🚗" },
];

export const EXPS = [
  { value: "food", label: "Ăn uống", emoji: "🍜" },
  { value: "transport", label: "Di chuyển", emoji: "🚗" },
  { value: "shopping", label: "Mua sắm", emoji: "🛍️" },
  { value: "bills", label: "Hóa đơn", emoji: "📄" },
  { value: "entertainment", label: "Giải trí", emoji: "🎬" },
  { value: "health", label: "Sức khỏe", emoji: "💊" },
  { value: "other", label: "Khác", emoji: "📦" },
];
