export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Buổi sáng";
  if (h >= 11 && h < 13) return "Buổi trưa";
  if (h >= 13 && h < 17) return "Buổi chiều";
  if (h >= 17 && h < 21) return "Buổi tối";
  return "Đêm khuya";
}

export function getTimeOfDayEmoji(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "🌅";
  if (h >= 11 && h < 13) return "☀️";
  if (h >= 13 && h < 17) return "🌤️";
  if (h >= 17 && h < 21) return "🌙";
  return "🌃";
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// Categorize meal time into period
export function getMealPeriod(time: string | null): { label: string; emoji: string; order: number } {
  if (!time) return { label: "Khác", emoji: "🍽️", order: 5 };
  const [h] = time.split(":").map(Number);
  if (h >= 5 && h < 11) return { label: "Buổi sáng", emoji: "🌅", order: 1 };
  if (h >= 11 && h < 14) return { label: "Buổi trưa", emoji: "☀️", order: 2 };
  if (h >= 14 && h < 17) return { label: "Buổi chiều", emoji: "🌤️", order: 3 };
  if (h >= 17 && h < 22) return { label: "Buổi tối", emoji: "🌙", order: 4 };
  return { label: "Đêm khuya", emoji: "🌃", order: 5 };
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (dateStr === todayStr) return "Hôm nay";
  if (dateStr === yesterdayStr) return "Hôm qua";

  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const months = [
    "Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6",
    "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12",
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const months = [
    "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
    "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12",
  ];
  return `${days[date.getDay()]}, ngày ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}p`;
}

export function formatTimeVN(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  let period = "sáng";
  if (h >= 12 && h < 17) period = "chiều";
  else if (h >= 17 && h < 21) period = "tối";
  else if (h >= 21 || h < 5) period = "đêm";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${period}`;
}

export function formatTimeFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function durationBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}
