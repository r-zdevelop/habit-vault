# HabitVault — Prompt inicial para Claude Code

## Contexto del proyecto

Quiero construir **HabitVault**, una aplicación de escritorio multiplataforma (Windows, Linux, macOS) para registrar y hacer seguimiento de hábitos semanales. La inspiración viene del libro *El Efecto Compuesto*, que propone una tabla semanal donde cada hábito tiene días marcados (✓), un objetivo numérico, y se calcula lo logrado vs no logrado por semana.

## Stack técnico

- **Framework de escritorio:** Tauri 2.0
- **Frontend:** React + TypeScript + Vite
- **Base de datos:** SQLite via `tauri-plugin-sql`
- **Estilos:** CSS Modules o Tailwind CSS (elige el más adecuado)
- **Selector de archivo DB:** `tauri-plugin-dialog` (para que el usuario elija la carpeta donde guardar el `.db`, como KeePassXC)
- **Autostart:** `tauri-plugin-autostart` (la app se abre al encender el PC)
- **Internacionalización:** `i18next` + `react-i18next` (soporte para español e inglés)

## Filosofía de la base de datos

El archivo `habitvault.db` debe vivir en una carpeta **elegida por el usuario** (no hardcodeada). Al primer arranque, mostrar un diálogo para que elija la carpeta. La ruta se guarda en el store local de Tauri. De esta manera el usuario puede poner el `.db` en Dropbox, Google Drive o cualquier carpeta sincronizada y tener sus hábitos disponibles en todos sus equipos.

## Estructura del proyecto

```
habitvault/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   └── commands/
│   │       ├── habits.rs       # CRUD de hábitos
│   │       ├── checks.rs       # Toggle de días completados
│   │       └── db.rs           # Inicialización y selección de DB
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   │   ├── WeeklyTracker.tsx   # Tabla principal (ver diseño abajo)
│   │   ├── AddHabitForm.tsx    # Formulario para añadir hábito
│   │   ├── WeekNav.tsx         # Navegación entre semanas
│   │   └── LanguageSwitcher.tsx # Selector de idioma (ES / EN)
│   ├── hooks/
│   │   └── useHabits.ts        # Hook que conecta con Tauri commands
│   ├── i18n/
│   │   ├── index.ts            # Configuración de i18next
│   │   └── locales/
│   │       ├── es.json         # Traducciones en español
│   │       └── en.json         # Traducciones en inglés
│   ├── types/
│   │   └── index.ts            # Interfaces: Habit, CheckRecord, WeekData
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## Schema de base de datos (SQLite)

```sql
CREATE TABLE IF NOT EXISTS habits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  objetivo   INTEGER NOT NULL DEFAULT 7,
  order_idx  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (date('now')),
  is_active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS checks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  check_date TEXT NOT NULL,  -- formato: YYYY-MM-DD
  UNIQUE(habit_id, check_date)
);
```

## Comandos Tauri requeridos (Rust → Frontend)

```rust
// Retorna todos los hábitos activos
#[tauri::command]
async fn get_habits() -> Result<Vec<Habit>, String>

// Crea un nuevo hábito
#[tauri::command]
async fn create_habit(name: String, objetivo: i32) -> Result<Habit, String>

// Elimina un hábito (soft delete: is_active = 0)
#[tauri::command]
async fn delete_habit(id: i32) -> Result<(), String>

// Alterna el check de un día (si existe lo borra, si no existe lo crea)
#[tauri::command]
async fn toggle_check(habit_id: i32, check_date: String) -> Result<bool, String>

// Retorna todos los checks de una semana dada
// week_start: lunes de la semana en formato YYYY-MM-DD
#[tauri::command]
async fn get_week_checks(week_start: String) -> Result<Vec<CheckRecord>, String>

// Abre un diálogo para seleccionar la carpeta del .db
#[tauri::command]
async fn select_db_folder(app: tauri::AppHandle) -> Result<String, String>

// Retorna la ruta actual del .db (para mostrarla en settings)
#[tauri::command]
async fn get_db_path() -> Result<String, String>
```

## Tipos TypeScript

```typescript
interface Habit {
  id: number;
  name: string;
  objetivo: number;
  order_idx: number;
  created_at: string;
  is_active: boolean;
}

interface CheckRecord {
  id: number;
  habit_id: number;
  check_date: string; // YYYY-MM-DD
}

interface WeekData {
  dates: string[];         // 7 fechas YYYY-MM-DD (lun → dom)
  checks: CheckRecord[];
}

interface HabitWeekStats {
  habit: Habit;
  logrado: number;
  noLogrado: number;
}
```

## Diseño de la tabla semanal (WeeklyTracker)

La tabla debe replicar la lógica del libro *Momentum*:

| Columna      | Contenido                                                              |
|--------------|------------------------------------------------------------------------|
| Hábito / Habit | Nombre del hábito                                                    |
| Lu/Mo Ma/Tu Mi/We Ju/Th Vi/Fr Sá/Sa Do/Su | Botón toggle por día. Verde con ✓ si está marcado |
| Logrado / Done | Suma de días marcados en la semana                                   |
| Objetivo / Goal | Meta numérica del hábito (1–7)                                      |
| No logrado / Missed | `objetivo - logrado`. Si es ≤ 0 mostrar ☺, si es > 0 mostrar `<N>` |
| Total        | Fila de totales al final                                               |

- El día actual debe estar visualmente destacado (columna sombreada)
- Navegar entre semanas: botones "← Anterior/Previous" / "Hoy/Today" / "Siguiente/Next →"
- Al añadir un hábito: input de texto + selector de objetivo (1–7) + botón "+"
- Al hacer hover en una fila: mostrar botón "✕" para eliminar el hábito
- Selector de idioma visible en la cabecera (botón o toggle ES / EN)

## Comportamiento al primer arranque

1. Detectar si existe una ruta de DB guardada en el store de Tauri
2. Si **no existe**: mostrar un diálogo de bienvenida pidiendo seleccionar carpeta
3. Si **existe pero el archivo no se encuentra** (ej: carpeta de Dropbox no sincronizada aún): mostrar aviso amigable con opción de seleccionar otra carpeta
4. Si **existe y el archivo está disponible**: abrir directamente la app

## Internacionalización (i18n)

La app debe soportar **español** (idioma por defecto) e **inglés**, con las siguientes reglas:

- Usar `i18next` + `react-i18next` para todas las cadenas de texto visibles al usuario.
- El idioma seleccionado se persiste en el store de Tauri (`tauri-plugin-store`) bajo la clave `language`.
- Al primer arranque, detectar el idioma del sistema operativo; si es `es-*` usar español, cualquier otro idioma usar inglés.
- El componente `LanguageSwitcher` muestra un toggle simple `ES | EN` en la esquina superior derecha de la app.
- Los nombres de días de la semana deben adaptarse al idioma: `Lu Ma Mi Ju Vi Sá Do` en español y `Mo Tu We Th Fr Sa Su` en inglés.
- **Nunca** hardcodear strings visibles al usuario fuera de los archivos de traducción.

### Estructura mínima de los archivos de traducción

`src/i18n/locales/es.json`:
```json
{
  "app": { "title": "HabitVault" },
  "nav": { "previous": "← Anterior", "today": "Hoy", "next": "Siguiente →" },
  "table": {
    "habit": "Hábito", "done": "Logrado", "goal": "Objetivo",
    "missed": "No logrado", "total": "Total"
  },
  "days": { "mon": "Lu", "tue": "Ma", "wed": "Mi", "thu": "Ju", "fri": "Vi", "sat": "Sá", "sun": "Do" },
  "form": { "placeholder": "Nuevo hábito...", "add": "+", "goal_label": "Objetivo" },
  "setup": {
    "welcome": "Bienvenido a HabitVault",
    "select_folder": "Selecciona la carpeta donde guardar tu base de datos",
    "browse": "Elegir carpeta",
    "db_not_found": "No se encontró el archivo de base de datos. ¿Deseas seleccionar otra carpeta?"
  },
  "errors": { "load_habits": "Error al cargar hábitos", "save": "Error al guardar" },
  "lang": { "es": "ES", "en": "EN" }
}
```

`src/i18n/locales/en.json`:
```json
{
  "app": { "title": "HabitVault" },
  "nav": { "previous": "← Previous", "today": "Today", "next": "Next →" },
  "table": {
    "habit": "Habit", "done": "Done", "goal": "Goal",
    "missed": "Missed", "total": "Total"
  },
  "days": { "mon": "Mo", "tue": "Tu", "wed": "We", "thu": "Th", "fri": "Fr", "sat": "Sa", "sun": "Su" },
  "form": { "placeholder": "New habit...", "add": "+", "goal_label": "Goal" },
  "setup": {
    "welcome": "Welcome to HabitVault",
    "select_folder": "Select the folder where your database will be stored",
    "browse": "Choose folder",
    "db_not_found": "Database file not found. Would you like to select another folder?"
  },
  "errors": { "load_habits": "Failed to load habits", "save": "Failed to save" },
  "lang": { "es": "ES", "en": "EN" }
}
```

## MVP — Lo que se debe construir ahora

Construye únicamente el MVP con estas funcionalidades:

1. ✅ Selección de carpeta del `.db` al primer arranque
2. ✅ Crear y eliminar hábitos
3. ✅ Tabla semanal con toggle de días (Lu-Do / Mo-Su)
4. ✅ Cálculo de Logrado / Objetivo / No logrado (Done / Goal / Missed)
5. ✅ Navegación entre semanas
6. ✅ Autostart al encender el PC (registrar en el sistema operativo)
7. ✅ Ventana pequeña y funcional (no necesita ser lujosa, solo limpia y usable)
8. ✅ Soporte multiidioma: español e inglés, con selector ES / EN persistido en el store

## Lo que NO se construye en el MVP (roadmap futuro)

- Racha / streak de días consecutivos
- Estadísticas y gráficos
- Notificaciones al inicio con resumen del día anterior
- Editar nombre u objetivo de un hábito existente
- Reordenar hábitos con drag & drop

## Instrucciones adicionales para Claude Code

- Usa **arquitectura limpia**: separa comandos Tauri, lógica de negocio y componentes UI
- Maneja todos los **errores de Rust** con `Result<T, String>` y muéstralos en el frontend con un toast o mensaje visible (usar las claves de `errors` del archivo de traducción correspondiente)
- El código debe **compilar en macOS (Apple Silicon M1)**, Linux y Windows sin cambios
- Escribe el **README.md** con instrucciones claras de instalación, desarrollo y compilación (README bilingüe: primero español, luego inglés)
- Usa **comentarios en español** en los componentes React y en inglés en el código Rust (convención estándar de Tauri)
- **Nunca** hardcodear strings visibles al usuario en los componentes; siempre usar el hook `useTranslation()` de react-i18next
- Al terminar, muestra en terminal los comandos para **ejecutar en modo desarrollo** y para **compilar el binario final**

## Recursos útiles

- Tauri 2.0 docs: https://v2.tauri.app/
- tauri-plugin-sql: https://github.com/tauri-apps/tauri-plugin-sql
- tauri-plugin-dialog: https://v2.tauri.app/plugin/dialog/
- tauri-plugin-autostart: https://github.com/tauri-apps/tauri-plugin-autostart
- tauri-plugin-store: https://v2.tauri.app/plugin/store/
- i18next: https://www.i18next.com/
- react-i18next: https://react.i18next.com/