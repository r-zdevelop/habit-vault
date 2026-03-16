// Formulario para agregar un nuevo hábito con nombre y objetivo semanal
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface AddHabitFormProps {
  onAdd: (name: string, objetivo: number) => Promise<void>;
}

export function AddHabitForm({ onAdd }: AddHabitFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [objetivo, setObjetivo] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(name.trim(), objetivo);
      setName("");
      setObjetivo(7);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700"
    >
      {/* Campo de nombre del hábito */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("form.placeholder")}
        className="flex-1 px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-green-500"
        disabled={submitting}
      />

      {/* Selector de objetivo (1-7) */}
      <label className="flex items-center gap-1 text-sm text-gray-400 whitespace-nowrap">
        {t("form.goal_label")}:
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(Number(e.target.value))}
          className="ml-1 px-2 py-1.5 rounded border border-gray-600 text-sm focus:outline-none focus:border-green-500 appearance-none cursor-pointer"
          style={{ backgroundColor: "#374151", color: "#ffffff" }}
          disabled={submitting}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n} style={{ backgroundColor: "#374151", color: "#ffffff" }}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {/* Botón de agregar */}
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
      >
        {t("form.add")}
      </button>
    </form>
  );
}
