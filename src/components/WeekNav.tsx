// Navegación entre semanas: Anterior / Hoy / Siguiente
import { useTranslation } from "react-i18next";

interface WeekNavProps {
  weekStart: string;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

// Formatea la fecha de inicio de semana para mostrar el rango "Lu DD/MM – Do DD/MM"
function formatWeekRange(weekStart: string, lang: string): string {
  const base = new Date(weekStart + "T00:00:00");
  const end = new Date(base);
  end.setDate(base.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "2-digit",
    });

  return `${fmt(base)} – ${fmt(end)}`;
}

export function WeekNav({ weekStart, onPrev, onToday, onNext }: WeekNavProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
      >
        {t("nav.previous")}
      </button>

      <button
        onClick={onToday}
        className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
      >
        {t("nav.today")}
      </button>

      <span className="text-gray-400 text-sm font-mono">
        {formatWeekRange(weekStart, i18n.language)}
      </span>

      <button
        onClick={onNext}
        className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
      >
        {t("nav.next")}
      </button>
    </div>
  );
}
