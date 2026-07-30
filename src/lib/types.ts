export interface Meal {
  id: number;
  date: string;
  mealType: string;
  foodName: string;
  calories: number | null;
  notes: string | null;
  time: string | null;
  image: string | null;
  createdAt: string;
}

export interface Activity {
  id: number;
  date: string;
  category: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
}

export interface DailyStatusData {
  id: number;
  date: string;
  sleepHours: number | null;
  waterCups: number | null;
  weight: number | null;
  dailyNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string | null;
  image: string | null;
  createdAt: string;
}

export interface LiveTrack {
  id: number;
  title: string;
  category: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  notes: string | null;
  latitude: string | null;
  longitude: string | null;
  locationName: string | null;
}

export interface Summary {
  totalCalories: number;
  totalExpenses: number;
  totalActivityMinutes: number;
  mealsCount: number;
  activitiesCount: number;
  expensesCount: number;
}

export interface DayData {
  meals: Meal[];
  activities: Activity[];
  expenses: Expense[];
  dailyStatus: DailyStatusData | null;
  summary: Summary;
}

export interface DailyReport {
  date: string;
  meals: Meal[];
  activities: Activity[];
  expenses: Expense[];
  dailyStatus: DailyStatusData | null;
  liveTracking: LiveTrack[];
  summary: {
    totalCalories: number;
    totalExpenses: number;
    totalActivityMinutes: number;
    totalTrackMinutes: number;
    mealsCount: number;
    activitiesCount: number;
    expensesCount: number;
    trackCount: number;
  };
}

export interface DaySummary {
  date: string;
  mealsCount: number;
  activitiesCount: number;
  expensesCount: number;
  expensesTotal: number;
  trackCount: number;
  totalCalories: number;
}

export interface PendingEntry {
  id: string;
  type: "meal" | "expense" | "activity";
  data: Record<string, unknown>;
  createdAt: number;
}

export const MEAL_TYPES = [
  { value: "breakfast", label: "Sáng", emoji: "🌅" },
  { value: "lunch", label: "Trưa", emoji: "☀️" },
  { value: "dinner", label: "Tối", emoji: "🌙" },
  { value: "snack", label: "Ăn vặt", emoji: "🍿" },
];

export const ACTIVITY_CATEGORIES = [
  { value: "work", label: "Công việc", emoji: "💼", color: "bg-blue-100 text-blue-700" },
  { value: "exercise", label: "Tập luyện", emoji: "🏃", color: "bg-green-100 text-green-700" },
  { value: "study", label: "Học tập", emoji: "📚", color: "bg-purple-100 text-purple-700" },
  { value: "personal", label: "Cá nhân", emoji: "🧘", color: "bg-pink-100 text-pink-700" },
  { value: "entertainment", label: "Giải trí", emoji: "🎮", color: "bg-yellow-100 text-yellow-700" },
  { value: "chores", label: "Việc nhà", emoji: "🏠", color: "bg-orange-100 text-orange-700" },
  { value: "social", label: "Giao lưu", emoji: "👥", color: "bg-teal-100 text-teal-700" },
  { value: "rest", label: "Nghỉ ngơi", emoji: "😴", color: "bg-gray-100 text-gray-700" },
  { value: "eat", label: "Ăn uống", emoji: "🍜", color: "bg-red-100 text-red-700" },
  { value: "travel", label: "Di chuyển", emoji: "🚗", color: "bg-cyan-100 text-cyan-700" },
];

export const EXPENSE_CATEGORIES = [
  { value: "food", label: "Ăn uống", emoji: "🍜" },
  { value: "transport", label: "Di chuyển", emoji: "🚗" },
  { value: "shopping", label: "Mua sắm", emoji: "🛍️" },
  { value: "bills", label: "Hóa đơn", emoji: "📄" },
  { value: "entertainment", label: "Giải trí", emoji: "🎬" },
  { value: "health", label: "Sức khỏe", emoji: "💊" },
  { value: "education", label: "Học tập", emoji: "📖" },
  { value: "other", label: "Khác", emoji: "📦" },
];
