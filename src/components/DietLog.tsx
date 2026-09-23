// Registro diario de dieta: descripción + kcal opcional
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DietEntry } from "../types";

interface DietLogProps {
  date: string;
  onDateChange: (date: string) => void;
  entries: DietEntry[];
  onAdd: (description: string, kcal: number | null) => Promise<void>;
  onEdit: (id: number, description: string, kcal: number | null) => Promise<void>;
  onDelete: (id: number) => void;
}

// Convierte el texto del campo kcal a número (o null si vacío/inválido)
function parseKcal(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || Number.isNaN(Number(trimmed))) return null;
  return Number(trimmed);
}

export function DietLog({
  date,
  onDateChange,
  entries,
  onAdd,
  onEdit,
  onDelete,
}: DietLogProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [kcal, setKcal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado de edición inline: id de la entrada que se está editando
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editKcal, setEditKcal] = useState("");

  const totalKcal = entries.reduce((acc, e) => acc + (e.kcal ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(description.trim(), parseKcal(kcal));
      setDescription("");
      setKcal("");
    } finally {
      setSubmitting(false);
    }
  };

  // Iniciar edición de una entrada
  const startEdit = (entry: DietEntry) => {
    setEditingId(entry.id);
    setEditDescription(entry.description);
    setEditKcal(entry.kcal != null ? String(entry.kcal) : "");
  };

  // Guardar cambios de edición
  const saveEdit = async (id: number) => {
    if (!editDescription.trim()) return;
    await onEdit(id, editDescription.trim(), parseKcal(editKcal));
    setEditingId(null);
  };

  // Cancelar edición
  const cancelEdit = () => setEditingId(null);

  return (
    <div className="flex flex-col flex-1">
      {/* Selector de fecha y formulario */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700 flex-wrap"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-green-500"
        />

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("diet.placeholder")}
          className="flex-1 min-w-[10rem] px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-green-500"
          disabled={submitting}
        />

        <input
          type="number"
          min={0}
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder={t("diet.kcal_placeholder")}
          className="w-28 px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-green-500"
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
        >
          {t("form.add")}
        </button>
      </form>

      {/* Lista de entradas del día */}
      <div className="flex-1 overflow-auto p-4">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-base">
            {t("diet.empty")}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-gray-300">
                <th className="text-left px-4 py-2 font-semibold">
                  {t("diet.description")}
                </th>
                <th className="text-right px-4 py-2 font-semibold w-28">
                  {t("diet.kcal")}
                </th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isEditing = editingId === entry.id;

                return (
                  <tr
                    key={entry.id}
                    className={`border-t border-gray-700 transition-colors hover:bg-gray-800/50 ${
                      idx % 2 === 0 ? "bg-gray-900/30" : "bg-gray-900/10"
                    }`}
                  >
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(entry.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-2 py-0.5 rounded bg-gray-700 border border-green-500 text-white text-sm focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-gray-100">
                          {entry.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editKcal}
                          onChange={(e) => setEditKcal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(entry.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-2 py-0.5 rounded bg-gray-700 border border-green-500 text-white text-sm text-right focus:outline-none"
                        />
                      ) : (
                        entry.kcal ?? "–"
                      )}
                    </td>
                    <td className="text-center px-2 py-2">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => saveEdit(entry.id)}
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
                            onClick={() => startEdit(entry)}
                            className="px-2 py-0.5 rounded bg-gray-700 hover:bg-blue-700 text-gray-300 hover:text-white text-xs transition-colors"
                            title={t("table.edit")}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => onDelete(entry.id)}
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
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-600 bg-gray-800 font-semibold text-gray-300">
                <td className="px-4 py-2">{t("table.total")}</td>
                <td className="px-4 py-2 text-right text-green-400">
                  {totalKcal}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
