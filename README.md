# HabitVault

**HabitVault** es una aplicación de escritorio multiplataforma para el seguimiento semanal de hábitos.
**HabitVault** is a cross-platform desktop app for weekly habit tracking.

---

## Stack

- [Tauri 2.0](https://tauri.app/) — framework de escritorio / desktop framework
- [React 19 + TypeScript + Vite](https://vitejs.dev/)
- [SQLite via rusqlite](https://github.com/rusqlite/rusqlite) — base de datos local / local database
- [Tailwind CSS v4](https://tailwindcss.com/)
- [i18next + react-i18next](https://www.i18next.com/) — internacionalización ES/EN
- tauri-plugin-store — persistencia de ajustes / settings persistence
- tauri-plugin-dialog — selector de carpeta nativo / native folder picker
- tauri-plugin-autostart — inicio automático / autostart

---

## Funcionalidades / Features

- Tabla de seguimiento semanal con navegación entre semanas
  Weekly tracking table with week navigation
- Agregar y eliminar hábitos con objetivo personalizado (1-7 días)
  Add and delete habits with custom goal (1-7 days)
- Toggle de check por día con resumen visual
  Day-by-day toggle with visual summary
- Columna "Logrado / Done", "Objetivo / Goal", "No logrado / Missed"
  Done, Goal, Missed columns with smiley when goal met
- Fila de totales al final de la tabla
  Totals row at the bottom of the table
- Día actual resaltado en la tabla
  Current day highlighted in the table
- Selector de idioma ES / EN en la cabecera
  ES / EN language switcher in the header
- Primer uso: selector de carpeta para la base de datos
  First run: folder picker for the database location
- La ruta de la DB se persiste en tauri-plugin-store
  DB path persisted via tauri-plugin-store

---

## Prerrequisitos del sistema / System Prerequisites

### Linux

```bash
sudo apt-get install -y \
  pkg-config \
  libglib2.0-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libsoup-3.0-dev \
  librsvg2-dev \
  libjavascriptcoregtk-4.1-dev
```

### macOS

```bash
# Xcode Command Line Tools required
xcode-select --install
```

### Windows

Install the [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and the [WebView2 runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

---

## Instalación / Installation

```bash
# Instalar dependencias de Node
npm install

# Iniciar en modo desarrollo
npm run tauri dev

# Compilar para producción
npm run tauri build
```

---

## Estructura del proyecto / Project Structure

```
habit-vault/
├── src/                        # Frontend React
│   ├── components/
│   │   ├── WeeklyTracker.tsx   # Tabla principal de habitos
│   │   ├── AddHabitForm.tsx    # Formulario agregar habito
│   │   ├── WeekNav.tsx         # Navegacion entre semanas
│   │   ├── LanguageSwitcher.tsx# Selector ES/EN
│   │   └── SetupScreen.tsx     # Pantalla de primer uso
│   ├── hooks/
│   │   └── useHabits.ts        # Hook Tauri React
│   ├── i18n/
│   │   ├── index.ts            # Configuracion i18next
│   │   └── locales/
│   │       ├── es.json         # Traducciones espanol
│   │       └── en.json         # English translations
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   ├── App.tsx                 # Componente raiz
│   └── main.tsx                # Punto de entrada
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── db.rs           # Comandos de base de datos
│   │   │   ├── habits.rs       # CRUD de habitos
│   │   │   └── checks.rs       # Checks diarios
│   │   ├── lib.rs              # Registro de comandos Tauri
│   │   └── main.rs             # Punto de entrada Rust
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json        # Permisos de plugins
└── package.json
```

---

## Schema de la base de datos / Database Schema

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
  check_date TEXT NOT NULL,
  UNIQUE(habit_id, check_date)
);
```

---

## Comandos Tauri / Tauri Commands

| Comando | Descripcion |
|---------|-------------|
| `open_database(path)` | Abre / crea la DB en la ruta indicada |
| `get_db_path()` | Retorna la ruta de la DB activa |
| `select_db_folder()` | Abre dialogo de seleccion de carpeta |
| `get_habits()` | Lista todos los habitos activos |
| `create_habit(name, objetivo)` | Crea un nuevo habito |
| `delete_habit(id)` | Elimina un habito (hard delete con cascade) |
| `toggle_check(habit_id, check_date)` | Alterna un check diario |
| `get_week_checks(week_start)` | Retorna los checks de una semana |

---

## Licencia / License

MIT
