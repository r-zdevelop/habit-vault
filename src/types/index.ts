// Tipos TypeScript para HabitVault

export interface Habit {
  id: number;
  name: string;
  objetivo: number;
  order_idx: number;
  created_at: string;
  is_active: boolean;
}

export interface CheckRecord {
  id: number;
  habit_id: number;
  check_date: string;
}

export interface WeekData {
  dates: string[];
  checks: CheckRecord[];
}

export interface HabitWeekStats {
  habit: Habit;
  logrado: number;
  noLogrado: number;
}
