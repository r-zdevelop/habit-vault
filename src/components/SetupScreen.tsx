// Pantalla de primer uso: selección de carpeta para la base de datos
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

interface SetupScreenProps {
  /** true = first run (no DB configured), false = DB file not found */
  isFirstRun: boolean;
  onFolderSelected: (path: string) => void;
}

export function SetupScreen({ isFirstRun, onFolderSelected }: SetupScreenProps) {
  const { t } = useTranslation();
  const [selectedPath, setSelectedPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Abrir el diálogo nativo para seleccionar carpeta
  const handleBrowse = async () => {
    try {
      setLoading(true);
      const folder = await invoke<string>("select_db_folder");
      setSelectedPath(folder);
      setError("");
    } catch (e) {
      // El usuario canceló el diálogo o hubo un error
      if (String(e) !== "No folder selected") {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedPath) {
      onFolderSelected(selectedPath);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        {/* Título e ícono */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-green-400">
            {t("app.title")}
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            {isFirstRun ? t("setup.welcome") : t("setup.db_not_found")}
          </p>
        </div>

        {/* Instrucción */}
        <p className="text-gray-300 text-sm mb-4 text-center">
          {t("setup.select_folder")}
        </p>

        {/* Selector de carpeta */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={selectedPath}
            placeholder="/ruta/a/carpeta"
            className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-500 text-sm"
          />
          <button
            onClick={handleBrowse}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            {loading ? "..." : t("setup.browse")}
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <p className="text-red-400 text-xs mb-4 text-center">{error}</p>
        )}

        {/* Botón de confirmar */}
        <button
          onClick={handleConfirm}
          disabled={!selectedPath}
          className="w-full py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
