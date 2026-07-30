export function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
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
  if (s === today) return "Hôm nay";
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === formatDate(y)) return "Hôm qua";
  const days = ["CN","T2","T3","T4","T5","T6","T7"];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}`;
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
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
