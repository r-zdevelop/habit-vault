// Hook para el registro diario de dieta (descripción + kcal opcional)
import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DietEntry } from "../types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDiet() {
  const [date, setDate] = useState<string>(() => todayIso());
  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar entradas del día seleccionado
  const loadEntries = useCallback(async (forDate: string) => {
    try {
      const result = await invoke<DietEntry[]>("get_diet_entries", {
        entryDate: forDate,
      });
      setEntries(result);
      setError(null);
    } catch (e) {
      setError("errors.load_diet");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEntries(date).finally(() => setLoading(false));
  }, [date, loadEntries]);

  // Registrar una nueva entrada
  const addEntry = useCallback(
    async (description: string, kcal: number | null) => {
      try {
        const newEntry = await invoke<DietEntry>("create_diet_entry", {
          entryDate: date,
          description,
          kcal,
        });
        setEntries((prev) => [...prev, newEntry]);
        setError(null);
      } catch (e) {
        setError("errors.save");
        throw e;
      }
    },
    [date]
  );

  // Editar descripción y/o kcal de una entrada existente
  const updateEntry = useCallback(
    async (id: number, description: string, kcal: number | null) => {
      try {
        const updated = await invoke<DietEntry>("update_diet_entry", {
          id,
          description,
          kcal,
        });
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        setError(null);
      } catch (e) {
        setError("errors.save");
        throw e;
      }
    },
    []
  );

  // Eliminar una entrada
  const deleteEntry = useCallback(async (id: number) => {
    try {
      await invoke("delete_diet_entry", { id });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setError(null);
    } catch (e) {
      setError("errors.save");
      throw e;
    }
  }, []);

  // Recargar entradas del día actual (útil después de abrir una nueva DB)
  const reload = useCallback(() => {
    setLoading(true);
    loadEntries(date).finally(() => setLoading(false));
  }, [date, loadEntries]);

  return {
    date,
    setDate,
    entries,
    loading,
    error,
    setError,
    addEntry,
    updateEntry,
    deleteEntry,
    reload,
  };
}
