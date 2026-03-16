// Selector de idioma: alterna entre Español e Inglés
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        onClick={() => i18n.changeLanguage("es")}
        className={`px-2 py-1 rounded transition-colors ${
          i18n.language === "es"
            ? "bg-green-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
        aria-label="Español"
      >
        {t("lang.es")}
      </button>
      <span className="text-gray-500">/</span>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2 py-1 rounded transition-colors ${
          i18n.language === "en"
            ? "bg-green-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
        aria-label="English"
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
