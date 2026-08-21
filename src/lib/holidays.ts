// Ngày lễ Tin Lành + lễ dân sự Việt Nam — có sẵn, không cần nhập tay
import { formatDate } from "./utils";

export interface Holiday { name: string; month: number; day: number; keyword: string; christian?: boolean }

// Ngày Phục Sinh thay đổi mỗi năm → dùng thuật toán Computus
export function easterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const FIXED: Holiday[] = [
  // Tháng 1
  { name: "Tết Dương Lịch", month: 1, day: 1, keyword: "tết dương" },
  { name: "20/1 Lễ Hiến Di Chúa (Epiphany)", month: 1, day: 6, keyword: "hiến", christian: true },
  // Tháng 2
  { name: "14/2 Lễ Tình Nhân", month: 2, day: 14, keyword: "14/2" },
  { name: "Tết Nguyên Đán (ước tính)", month: 2, day: 10, keyword: "tết nguyên đán" }, // approx; user can adjust
  // Tháng 3
  { name: "8/3 Quốc Tế Phụ Nữ", month: 3, day: 8, keyword: "8/3" },
  { name: "26/3 Ngày Thanh Niên VN", month: 3, day: 26, keyword: "26/3" },
  // Tháng 4
  { name: "30/4 Giải Phóng Miền Nam", month: 4, day: 30, keyword: "30/4" },
  // Tháng 5
  { name: "1/5 Quốc Tế Lao Động", month: 5, day: 1, keyword: "1/5" },
  { name: "Chủ Nhật Tuần 2 Tháng 5 · Ngày Cứa Mẹ (xấp xỉ)", month: 5, day: 12, keyword: "mẹ" },
  { name: "19/5 Sinh Nhật Bác Hồ", month: 5, day: 19, keyword: "19/5" },
  // Tháng 6
  { name: "1/6 Quốc Tế Thiếu Nhi", month: 6, day: 1, keyword: "1/6" },
  { name: "Chủ Nhật Tuần 3 Tháng 6 · Ngày Cứa Cha (xấp xỉ)", month: 6, day: 16, keyword: "cha" },
  // Tháng 7
  { name: "27/7 Thương Binh Liệt Sĩ", month: 7, day: 27, keyword: "27/7" },
  { name: "30/7 Ngày Tình Bạn Quốc Tế", month: 7, day: 30, keyword: "30/7" },
  // Tháng 8
  { name: "15/8 Lễ Đức Mẹ Lên Trễ (Tin Lành edition: Đức Mẹ)", month: 8, day: 15, keyword: "15/8", christian: true },
  // Tháng 9
  { name: "2/9 Quốc Khánh", month: 9, day: 2, keyword: "2/9" },
  // Tháng 10
  { name: "20/10 Phụ Nữ Việt Nam", month: 10, day: 20, keyword: "20/10" },
  { name: "25/10 Ngày Báo Chí VN", month: 10, day: 25, keyword: "25/10" },
  { name: "Hallloween (31/10) — Vệ Carolyn Nhân Dân", month: 10, day: 31, keyword: "31/10" },
  // Tháng 11
  { name: "1/11 Lễ Các Thánh (All Saints') — Tin Lành", month: 11, day: 1, keyword: "thánh", christian: true },
  { name: "2/11 Lễ Các Linh (All Souls') — Tin Lành", month: 11, day: 2, keyword: "linh", christian: true },
  { name: "20/11 Ngày Nhà Giáo VN", month: 11, day: 20, keyword: "20/11" },
  { name: "Thứ Năm Tuần 4 Tháng 11 · Lễ Tạ Ơn (Thanksgiving, Tin Lành)", month: 11, day: 27, keyword: "tạ ơn", christian: true },
  // Tháng 12
  { name: "22/12 Ngày Quân Đội Nhân Dân VN", month: 12, day: 22, keyword: "22/12" },
  { name: "25/12 Giáng Sinh (Chúa Giê-xu giáng thể)", month: 12, day: 25, keyword: "giáng sinh", christian: true },
  { name: "31/12 Đêm Giao Thừa Dương Lịch", month: 12, day: 31, keyword: "31/12" },
];

function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function getHolidaysForYear(year: number): { name: string; date: string; christian?: boolean }[] {
  const easter = easterDate(year); // Sunday
  const out = FIXED.map(h => ({ name: h.name, date: formatDate(new Date(year, h.month - 1, h.day)), christian: h.christian }));
  out.push(
    { name: "Thứ Sáu Tuần Thánh (Chúa chịu chết)", date: formatDate(addDays(easter, -2)), christian: true },
    { name: "Lễ Phục Sinh (Chúa sống lại)", date: formatDate(easter), christian: true },
    { name: "Lễ Ngũ Tuần (Đức Thánh Linh giáng lâm)", date: formatDate(addDays(easter, 49)), christian: true },
  );
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingHolidays(count = 5): { name: string; date: string; daysLeft: number; christian?: boolean }[] {
  const todayStr = formatDate(new Date());
  const t = new Date().getFullYear();
  return [...getHolidaysForYear(t), ...getHolidaysForYear(t + 1)]
    .map(h => ({ ...h, daysLeft: Math.round((new Date(h.date + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000) }))
    .filter(h => h.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, count);
}
