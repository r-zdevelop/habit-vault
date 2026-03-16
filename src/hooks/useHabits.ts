// Hook principal para conectar componentes React con los comandos Tauri
import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Habit, CheckRecord } from "../types";

// Retorna la fecha ISO (YYYY-MM-DD) del lunes de la semana que contiene `date`
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday, 1=Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // ajuste al lunes
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Genera los 7 días de la semana partiendo del lunes
function buildWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const base = new Date(weekStart + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [weekStart, setWeekStart] = useState<string>(() =>
    getWeekStart(new Date())
  );
  const [weekDates, setWeekDates] = useState<string[]>(() =>
    buildWeekDates(getWeekStart(new Date()))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar hábitos desde Rust
  const loadHabits = useCallback(async () => {
    try {
      const result = await invoke<Habit[]>("get_habits");
      setHabits(result);
      setError(null);
    } catch (e) {
      setError("errors.load_habits");
    }
  }, []);

  // Cargar checks de la semana actual
  const loadWeekChecks = useCallback(async (start: string) => {
    try {
      const result = await invoke<CheckRecord[]>("get_week_checks", {
        weekStart: start,
      });
      setChecks(result);
    } catch (e) {
      setError("errors.load_habits");
    }
  }, []);

  // Inicialización y recarga al cambiar semana
  useEffect(() => {
    setLoading(true);
    Promise.all([loadHabits(), loadWeekChecks(weekStart)]).finally(() =>
      setLoading(false)
    );
  }, [weekStart, loadHabits, loadWeekChecks]);

  // Crear un nuevo hábito
  const createHabit = useCallback(
    async (name: string, objetivo: number) => {
      try {
        const newHabit = await invoke<Habit>("create_habit", {
          name,
          objetivo,
        });
        setHabits((prev) => [...prev, newHabit]);
        setError(null);
      } catch (e) {
        setError("errors.save");
        throw e;
      }
    },
    []
  );

  // Actualizar nombre y objetivo de un hábito
  const updateHabit = useCallback(async (id: number, name: string, objetivo: number) => {
    try {
      const updated = await invoke<Habit>("update_habit", { id, name, objetivo });
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      setError(null);
    } catch (e) {
      setError("errors.save");
      throw e;
    }
  }, []);

  // Eliminar un hábito
  const deleteHabit = useCallback(async (id: number) => {
    try {
      await invoke("delete_habit", { id });
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setChecks((prev) => prev.filter((c) => c.habit_id !== id));
      setError(null);
    } catch (e) {
      setError("errors.save");
      throw e;
    }
  }, []);

  // Alternar check de un hábito en una fecha
  const toggleCheck = useCallback(
    async (habitId: number, checkDate: string) => {
      try {
        const isNowChecked = await invoke<boolean>("toggle_check", {
          habitId,
          checkDate,
        });
        if (isNowChecked) {
          // Agregar el check localmente con id temporal
          setChecks((prev) => [
            ...prev,
            { id: Date.now(), habit_id: habitId, check_date: checkDate },
          ]);
        } else {
          // Quitar el check localmente
          setChecks((prev) =>
            prev.filter(
              (c) => !(c.habit_id === habitId && c.check_date === checkDate)
            )
          );
        }
        setError(null);
      } catch (e) {
        setError("errors.save");
      }
    },
    []
  );

  // Navegar a la semana anterior
  const goToPrevWeek = useCallback(() => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    const newStart = d.toISOString().slice(0, 10);
    setWeekStart(newStart);
    setWeekDates(buildWeekDates(newStart));
  }, [weekStart]);

  // Navegar a la semana siguiente
  const goToNextWeek = useCallback(() => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    const newStart = d.toISOString().slice(0, 10);
    setWeekStart(newStart);
    setWeekDates(buildWeekDates(newStart));
  }, [weekStart]);

  // Volver a la semana actual
  const goToToday = useCallback(() => {
    const start = getWeekStart(new Date());
    setWeekStart(start);
    setWeekDates(buildWeekDates(start));
  }, []);

  // Verificar si un hábito tiene check en una fecha específica
  const isChecked = useCallback(
    (habitId: number, date: string): boolean =>
      checks.some((c) => c.habit_id === habitId && c.check_date === date),
    [checks]
  );

  // Recargar datos (útil después de abrir una nueva DB)
  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([loadHabits(), loadWeekChecks(weekStart)]).finally(() =>
      setLoading(false)
    );
  }, [loadHabits, loadWeekChecks, weekStart]);

  return {
    habits,
    checks,
    weekStart,
    weekDates,
    loading,
    error,
    setError,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleCheck,
    isChecked,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    reload,
  };
}
