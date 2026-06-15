// Toggle para iniciar HabitVault automáticamente al encender el equipo
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

export function AutostartToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<boolean>("plugin:autostart|is_enabled")
      .then(setEnabled)
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await invoke("plugin:autostart|disable");
        setEnabled(false);
      } else {
        await invoke("plugin:autostart|enable");
        setEnabled(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={enabled ? t("autostart.disable") : t("autostart.enable")}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
        enabled
          ? "bg-green-700 text-green-100 hover:bg-green-600"
          : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
      }`}
    >
      <span>{enabled ? "⏻" : "⏻"}</span>
      <span>{enabled ? t("autostart.on") : t("autostart.off")}</span>
    </button>
  );
}
