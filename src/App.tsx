// Componente raíz de HabitVault
// Gestiona el flujo: configuración de DB → vista principal

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

import { SetupScreen } from "./components/SetupScreen";
import { WeeklyTracker } from "./components/WeeklyTracker";
import { WeekNav } from "./components/WeekNav";
import { AddHabitForm } from "./components/AddHabitForm";
import { DietLog } from "./components/DietLog";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { AutostartToggle } from "./components/AutostartToggle";
import { useHabits } from "./hooks/useHabits";
import { useDiet } from "./hooks/useDiet";

// Clave usada en el store de Tauri para persistir la ruta de la DB
const STORE_DB_KEY = "db_folder";
const DB_FILENAME = "habitvault.db";

type AppStatus =
  | "loading"      // verificando configuración
  | "setup"        // primera vez: seleccionar carpeta
  | "db_missing"   // carpeta configurada pero archivo no existe
  | "ready";       // DB abierta y lista

type Tab = "habits" | "diet";

export default function App() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AppStatus>("loading");
  const [tab, setTab] = useState<Tab>("habits");

  const {
    habits,
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
  } = useHabits();

  const {
    date: dietDate,
    setDate: setDietDate,
    entries: dietEntries,
    error: dietError,
    setError: setDietError,
    addEntry: addDietEntry,
    updateEntry: updateDietEntry,
    deleteEntry: deleteDietEntry,
    reload: reloadDiet,
  } = useDiet();

  // Al montar: verificar si ya hay una carpeta guardada en el store
  useEffect(() => {
    checkDbConfig();
  }, []);

  const checkDbConfig = async () => {
    try {
      const store = await load("settings.json");
      const folder = await store.get<string>(STORE_DB_KEY);

      if (!folder) {
        // Primera vez: no hay carpeta configurada
        setStatus("setup");
        return;
      }

      // Intentar abrir la DB en la carpeta guardada
      const dbPath = `${folder}/${DB_FILENAME}`;
      try {
        await invoke("open_database", { path: dbPath });
        setStatus("ready");
        reload();
        reloadDiet();
      } catch {
        // El archivo no existe o no se puede abrir
        setStatus("db_missing");
      }
    } catch {
      setStatus("setup");
    }
  };

  // Cuando el usuario selecciona una carpeta en la pantalla de setup
  const handleFolderSelected = async (folder: string) => {
    const dbPath = `${folder}/${DB_FILENAME}`;
    try {
      await invoke("open_database", { path: dbPath });

      // Persistir la ruta en el store de Tauri
      const store = await load("settings.json");
      await store.set(STORE_DB_KEY, folder);
      await store.save();

      setStatus("ready");
      reload();
      reloadDiet();
    } catch (e) {
      setError(String(e));
    }
  };

  // === Renderizado condicional según el estado ===

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-lg">...</div>
      </div>
    );
  }

  if (status === "setup") {
    return (
      <SetupScreen isFirstRun={true} onFolderSelected={handleFolderSelected} />
    );
  }

  if (status === "db_missing") {
    return (
      <SetupScreen isFirstRun={false} onFolderSelected={handleFolderSelected} />
    );
  }

  // === Vista principal ===
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Barra de navegación superior */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 shadow-md">
        <h1 className="text-xl font-bold text-green-400 tracking-tight">
          {t("app.title")}
        </h1>

        {/* Selector de pestaña: Hábitos / Dieta */}
        <div className="flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => setTab("habits")}
            className={`px-3 py-1.5 rounded transition-colors ${
              tab === "habits"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            {t("tabs.habits")}
          </button>
          <button
            onClick={() => setTab("diet")}
            className={`px-3 py-1.5 rounded transition-colors ${
              tab === "diet"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            {t("tabs.diet")}
          </button>
        </div>

        {tab === "habits" && (
          <WeekNav
            weekStart={weekStart}
            onPrev={goToPrevWeek}
            onToday={goToToday}
            onNext={goToNextWeek}
          />
        )}

        <div className="flex items-center gap-3">
          <AutostartToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Mensaje de error global */}
      {(tab === "habits" ? error : dietError) && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm flex items-center justify-between">
          <span>{t((tab === "habits" ? error : dietError) as string)}</span>
          <button
            onClick={() => (tab === "habits" ? setError(null) : setDietError(null))}
            className="ml-4 text-red-400 hover:text-red-200 font-bold"
          >
            x
          </button>
        </div>
      )}

      {tab === "habits" ? (
        <>
          {/* Formulario para agregar hábitos */}
          <AddHabitForm onAdd={createHabit} />

          {/* Indicador de carga */}
          {loading && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Loading...
            </div>
          )}

          {/* Tabla de hábitos */}
          <main className="flex-1 overflow-auto">
            <WeeklyTracker
              habits={habits}
              weekDates={weekDates}
              isChecked={isChecked}
              onToggle={toggleCheck}
              onDelete={deleteHabit}
              onEdit={updateHabit}
            />
          </main>
        </>
      ) : (
        <main className="flex-1 overflow-auto flex flex-col">
          <DietLog
            date={dietDate}
            onDateChange={setDietDate}
            entries={dietEntries}
            onAdd={addDietEntry}
            onEdit={updateDietEntry}
            onDelete={deleteDietEntry}
          />
        </main>
      )}
    </div>
  );
}
