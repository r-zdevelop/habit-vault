# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HabitVault is a cross-platform desktop app (Tauri 2.0 + React 19 + TypeScript) for weekly habit tracking, inspired by *The Compound Effect* / *Momentum* weekly tracker table. Data lives in a user-chosen SQLite file (like KeePassXC) so it can be synced via Dropbox/Drive across machines. UI is bilingual ES/EN, defaulting to Spanish.

`initial_prompt.md` is the original spec used to bootstrap this project — useful for intent/rationale on the MVP scope, but the actual source is authoritative for current behavior.

## Commands

```bash
pnpm install          # install JS deps (package manager is pnpm, see pnpm-lock.yaml)
pnpm tauri dev         # run the full desktop app in dev mode (Rust + Vite)
pnpm dev               # frontend-only Vite dev server (no Tauri backend/commands available)
pnpm build             # tsc typecheck + vite build -> dist/
pnpm tauri build       # produce the platform installer/binary
```

There is no test suite or lint script configured in `package.json` — don't assume `pnpm test`/`pnpm lint` exist.

Rust side (`src-tauri/`): standard `cargo build` / `cargo check` work from within `src-tauri/`, but prefer `pnpm tauri dev` since it also wires up the frontend dev server Tauri expects on port 1420.

### System prerequisites

Native build tooling is required per-OS (Xcode CLT on macOS, WebView2 + VS C++ Build Tools on Windows, several `libgtk`/`libwebkit2gtk` packages on Linux) — see README.md for the full list if a build fails on missing system libraries.

## Architecture

**Two halves communicating over `invoke()`:** React frontend in `src/`, Rust backend in `src-tauri/src/`. All backend logic is exposed as `#[tauri::command]` functions registered in `src-tauri/src/lib.rs`'s `invoke_handler`; the frontend calls them by string name via `@tauri-apps/api/core`'s `invoke()`. When adding a new command, it must be both defined in `src-tauri/src/commands/*.rs` and added to the `generate_handler!` list in `lib.rs`, or the frontend call will fail at runtime with no compile-time warning.

**Database connection is app-managed state, not fixed at startup.** `DbState = Arc<Mutex<Option<Connection>>>` (`src-tauri/src/commands/db.rs`) is `None` until the user picks a folder; every command that touches SQLite takes `State<'_, DbState>`, locks it, and errors with `"Database not initialized"` if no DB is open yet. This means most commands are unusable until `open_database` has been called — relevant when adding new commands or tests.

**DB path selection/persistence flow** (`src/App.tsx`): on mount, check `tauri-plugin-store`'s `settings.json` for a saved folder path (key `db_folder`) → construct `<folder>/habitvault.db` → call `open_database`. Three outcomes drive a state machine (`loading` / `setup` / `db_missing` / `ready`): no saved folder → show `SetupScreen` (first run); saved folder but open fails (e.g. Dropbox not synced yet) → show `SetupScreen` in "not found" mode; success → render the main tracker. Any new persisted setting (like `db_folder`, `language`) should go through this same `tauri-plugin-store` pattern, not localStorage.

**Habits use soft-delete-by-schema but hard-delete-by-code**: the `habits` table has an `is_active` column and queries filter `WHERE is_active = 1`, but `delete_habit` currently does a real `DELETE` (relying on `ON DELETE CASCADE` to clean up `checks`). Be aware of this mismatch if extending delete behavior.

**Checks are a toggle, not a set/unset call**: `toggle_check(habit_id, check_date)` inserts if absent / deletes if present and returns the resulting boolean state; the frontend (`useHabits.ts`) applies that result optimistically to local state rather than refetching the week.

**Week math lives in the frontend** (`src/hooks/useHabits.ts`): `getWeekStart` normalizes any date to that week's Monday (ISO `YYYY-MM-DD`), `buildWeekDates` expands it to 7 consecutive dates. The Rust side is agnostic to week boundaries — `get_week_checks(week_start)` just takes a date string range computed on the frontend.

**i18n**: all user-visible strings go through `react-i18next` (`useTranslation()`), keyed from `src/i18n/locales/{es,en}.json` — never hardcode UI strings. Spanish is the default/fallback for date-less initialization (`src/i18n/index.ts` sets `lng: "es"`), though the original spec called for OS-locale detection on first run.

**Convention split**: React/TS component comments are in Spanish, Rust code comments are in English — an intentional convention from the original project spec, not an inconsistency to "fix".

**Tauri plugins in use**: `store` (settings persistence), `dialog` (native folder picker for DB location), `autostart` (launch-on-login, toggled via `AutostartToggle.tsx`), `opener`. Permissions for all of these are declared in `src-tauri/capabilities/default.json` — adding a new plugin API call (e.g. a new autostart or dialog method) requires adding its permission there too, or the call will be rejected at runtime.
