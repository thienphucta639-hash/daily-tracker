// Ngày lễ Việt Nam — 12 tháng. KHÔNG có lễ đạo. Bạn tự thêm lễ cá nhân (Giáng Sinh, Phục Sinh...) qua tab Sự kiện.
import { formatDate } from "./utils";

export interface Holiday { name: string; date: string }

const FIXED: { name: string; month: number; day: number }[] = [
  // Tháng 1
  { name: "Tết Dương Lịch (1/1)", month: 1, day: 1 },
  { name: "Ngày Thành lập ĐCSVN (3/2)", month: 2, day: 3 },
  // Tháng 2
  { name: "Tết Nguyên Đán (ước tính)", month: 2, day: 10 },
  { name: "Ngày Thơ Việt Nam (16/2, Giỗ Tổ Hùng Vương ước tính)", month: 2, day: 16 },
  // Tháng 3
  { name: "Quốc tế Phụ nữ (8/3)", month: 3, day: 8 },
  { name: "Ngày Thanh niên (26/3)", month: 3, day: 26 },
  // Tháng 4
  { name: "Ngày Chiến thắng (30/4)", month: 4, day: 30 },
  // Tháng 5
  { name: "Quốc tế Lao động (1/5)", month: 5, day: 1 },
  { name: "Chiến thắng Điện Biên Phủ (7/5)", month: 5, day: 7 },
  { name: "Sinh nhật Chủ tịch Hồ Chí Minh (19/5)", month: 5, day: 19 },
  // Tháng 6
  { name: "Quốc tế Thiếu nhi (1/6)", month: 6, day: 1 },
  { name: "Ngày Báo chí Cách mạng (21/6)", month: 6, day: 21 },
  // Tháng 7
  { name: "Ngày Thương binh Liệt sĩ (27/7)", month: 7, day: 27 },
  // Tháng 8
  { name: "Quốc khánh Cách mạng Tháng Tám (19/8)", month: 8, day: 19 },
  // Tháng 9
  { name: "Quốc khánh nước CHXHCN Việt Nam (2/9)", month: 9, day: 2 },
  { name: "Ngày Bien phòng (chủ nhật đầu tháng 9)", month: 9, day: 1 },
  // Tháng 10
  { name: "Ngày Giải phóng Thủ đô (10/10)", month: 10, day: 10 },
  { name: "Ngày Phụ nữ Việt Nam (20/10)", month: 10, day: 20 },
  { name: "Ngày Nông dân Việt Nam (14/10)", month: 10, day: 14 },
  // Tháng 11
  { name: "Ngày Nhà giáo Việt Nam (20/11)", month: 11, day: 20 },
  { name: "Ngày Pháp luật Việt Nam (9/11)", month: 11, day: 9 },
  // Tháng 12
  { name: "Ngày Quân đội Nhân dân Việt Nam (22/12)", month: 12, day: 22 },
  { name: "Ngày Công nhân Viên chức (ngày cuối năm)", month: 12, day: 31 },
];

function getHolidaysForYear(year: number): Holiday[] {
  return FIXED.map(h => ({ name: h.name, date: formatDate(new Date(year, h.month - 1, h.day)) })).sort((a, b) => a.date.localeCompare(b.date));
}

export function getHolidaysForMonth(month: number, year: number): { name: string; date: string; daysLeft: number }[] {
  const todayStr = formatDate(new Date());
  return getHolidaysForYear(year).filter(h => parseInt(h.date.split("-")[1]) === month)
    .map(h => ({ ...h, daysLeft: Math.round((new Date(h.date + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000) }));
}

export function getCurrentAndNextMonthHolidays(): { name: string; date: string; daysLeft: number; monthLabel: string }[] {
  const now = new Date();
  const m1 = now.getMonth() + 1, y = now.getFullYear();
  const m2 = m1 === 12 ? 1 : m1 + 1, y2 = m1 === 12 ? y + 1 : y;
  const monthNames = ["", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const out: { name: string; date: string; daysLeft: number; monthLabel: string }[] = [];
  for (const h of getHolidaysForMonth(m1, y)) out.push({ ...h, monthLabel: monthNames[m1] });
  for (const h of getHolidaysForMonth(m2, y2)) out.push({ ...h, monthLabel: monthNames[m2] });
  return out;
}

// Keep for backward compat — returns VN holidays only
export function getUpcomingHolidays(count: number = 5): { name: string; date: string; daysLeft: number; christian?: boolean }[] {
  const todayStr = formatDate(new Date());
  const t = new Date().getFullYear();
  return [...getHolidaysForYear(t), ...getHolidaysForYear(t + 1)]
    .map(h => ({ ...h, daysLeft: Math.round((new Date(h.date + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000) }))
    .filter(h => h.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, count);
}
