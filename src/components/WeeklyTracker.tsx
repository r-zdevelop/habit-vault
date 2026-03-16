// Tabla principal de seguimiento semanal de hábitos
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Habit } from "../types";

// Claves de traducción para los días de la semana (lunes a domingo)
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface WeeklyTrackerProps {
  habits: Habit[];
  weekDates: string[]; // 7 fechas YYYY-MM-DD, lunes primero
  isChecked: (habitId: number, date: string) => boolean;
  onToggle: (habitId: number, date: string) => void;
  onDelete: (habitId: number) => void;
  onEdit: (habitId: number, name: string, objetivo: number) => Promise<void>;
}

export function WeeklyTracker({
  habits,
  weekDates,
  isChecked,
  onToggle,
  onDelete,
  onEdit,
}: WeeklyTrackerProps) {
  const { t } = useTranslation();

  // Estado de edición inline: id del hábito que se está editando
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editObjetivo, setEditObjetivo] = useState(7);

  // Fecha de hoy en formato ISO para resaltar la columna actual
  const today = new Date().toISOString().slice(0, 10);

  // Calcular totales por columna
  const dayTotals = weekDates.map(
    (date) => habits.filter((h) => isChecked(h.id, date)).length
  );
  const grandTotal = dayTotals.reduce((acc, n) => acc + n, 0);

  // Iniciar edición de un hábito
  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditObjetivo(habit.objetivo);
  };

  // Guardar cambios de edición
  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    await onEdit(id, editName.trim(), editObjetivo);
    setEditingId(null);
  };

  // Cancelar edición
  const cancelEdit = () => setEditingId(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800 text-gray-300">
            {/* Columna de nombre del hábito */}
            <th className="text-left px-4 py-2 font-semibold w-48 min-w-[12rem]">
              {t("table.habit")}
            </th>

            {/* Columnas de días (lunes a domingo) */}
            {weekDates.map((date, i) => (
              <th
                key={date}
                className={`text-center px-2 py-2 font-semibold w-10 ${
                  date === today
                    ? "bg-green-900/40 text-green-300"
                    : "text-gray-400"
                }`}
              >
                <div>{t(`days.${DAY_KEYS[i]}`)}</div>
                <div className="text-xs font-normal opacity-70">
                  {date.slice(8)}
                </div>
              </th>
            ))}

            {/* Columnas de estadísticas */}
            <th className="text-center px-3 py-2 font-semibold text-green-400 w-16">
              {t("table.done")}
            </th>
            <th className="text-center px-3 py-2 font-semibold text-gray-400 w-16">
              {t("table.goal")}
            </th>
            <th className="text-center px-3 py-2 font-semibold text-red-400 w-20">
              {t("table.missed")}
            </th>

            {/* Columna de acciones */}
            <th className="text-center px-3 py-2 font-semibold text-gray-500 w-20"></th>
          </tr>
        </thead>

        <tbody>
          {habits.map((habit, rowIdx) => {
            const logrado = weekDates.filter((date) =>
              isChecked(habit.id, date)
            ).length;
            const noLogrado = habit.objetivo - logrado;
            const isEditing = editingId === habit.id;

            return (
              <tr
                key={habit.id}
                className={`border-t border-gray-700 transition-colors hover:bg-gray-800/50 ${
                  rowIdx % 2 === 0 ? "bg-gray-900/30" : "bg-gray-900/10"
                }`}
              >
                {/* Nombre del hábito (o campo de edición) */}
                <td className="px-4 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(habit.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-full px-2 py-0.5 rounded bg-gray-700 border border-green-500 text-white text-sm focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-100">{habit.name}</span>
                  )}
                </td>

                {/* Botones de toggle por día */}
                {weekDates.map((date) => {
                  const checked = isChecked(habit.id, date);
                  const isToday = date === today;

                  return (
                    <td
                      key={date}
                      className={`text-center px-1 py-2 ${
                        isToday ? "bg-green-900/20" : ""
                      }`}
                    >
                      <button
                        onClick={() => onToggle(habit.id, date)}
                        className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                          checked
                            ? "bg-green-500 text-white hover:bg-green-400 shadow-sm shadow-green-500/30"
                            : "bg-gray-700 text-gray-500 hover:bg-gray-600 hover:text-gray-300"
                        }`}
                        aria-label={`${habit.name} ${date}`}
                        aria-pressed={checked}
                      >
                        {checked ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}

                {/* Días logrados */}
                <td className="text-center px-3 py-2 font-semibold text-green-400">
                  {logrado}
                </td>

                {/* Objetivo (editable inline) */}
                <td className="text-center px-3 py-2 text-gray-400">
                  {isEditing ? (
                    <select
                      value={editObjetivo}
                      onChange={(e) => setEditObjetivo(Number(e.target.value))}
                      className="px-1 py-0.5 rounded border border-green-500 text-sm focus:outline-none appearance-none text-center"
                      style={{ backgroundColor: "#374151", color: "#ffffff" }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n} style={{ backgroundColor: "#374151", color: "#ffffff" }}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : (
                    habit.objetivo
                  )}
                </td>

                {/* No logrado */}
                <td className="text-center px-3 py-2">
                  {noLogrado <= 0 ? (
                    <span className="text-yellow-400 text-lg" title="¡Objetivo cumplido!">
                      ☺
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold">{noLogrado}</span>
                  )}
                </td>

                {/* Acciones: editar / guardar / cancelar / eliminar */}
                <td className="text-center px-2 py-2">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => saveEdit(habit.id)}
                        className="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
                        title={t("table.save")}
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-0.5 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold transition-colors"
                        title={t("table.cancel")}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(habit)}
                        className="px-2 py-0.5 rounded bg-gray-700 hover:bg-blue-700 text-gray-300 hover:text-white text-xs transition-colors"
                        title={t("table.edit")}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDelete(habit.id)}
                        className="px-2 py-0.5 rounded bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white text-xs transition-colors"
                        title={t("table.delete")}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Fila de totales */}
          {habits.length > 0 && (
            <tr className="border-t-2 border-gray-600 bg-gray-800 font-semibold text-gray-300">
              <td className="px-4 py-2">{t("table.total")}</td>

              {dayTotals.map((total, i) => (
                <td
                  key={weekDates[i]}
                  className={`text-center px-1 py-2 ${
                    weekDates[i] === today ? "bg-green-900/20" : ""
                  }`}
                >
                  {total > 0 ? (
                    <span className="text-green-400">{total}</span>
                  ) : (
                    <span className="text-gray-600">–</span>
                  )}
                </td>
              ))}

              <td className="text-center px-3 py-2 text-green-400">
                {grandTotal}
              </td>
              <td className="text-center px-3 py-2 text-gray-500">
                {habits.reduce((acc, h) => acc + h.objetivo, 0)}
              </td>
              <td className="text-center px-3 py-2"></td>
              <td className="text-center px-3 py-2"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Mensaje cuando no hay hábitos */}
      {habits.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-base">
          No hay hábitos aún. ¡Agrega uno arriba!
        </div>
      )}
    </div>
  );
}
