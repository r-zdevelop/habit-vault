// Database initialization and path management commands

use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use tauri::State;
use tauri_plugin_dialog::DialogExt;

/// Shared database connection state
pub type DbState = Arc<Mutex<Option<Connection>>>;

/// Initialize the database schema, creating tables if they don't exist
pub fn init_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

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
        ",
    )
}

/// Open (or create) the database at the given path and initialize the schema.
/// Returns an error string if opening fails.
pub fn open_db(path: &str) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| format!("Failed to open database: {e}"))?;
    init_schema(&conn).map_err(|e| format!("Failed to initialize schema: {e}"))?;
    Ok(conn)
}

/// Tauri command: open a folder-picker dialog and return the chosen folder path.
/// The caller is responsible for constructing the full DB file path.
#[tauri::command]
pub async fn select_db_folder(app: tauri::AppHandle) -> Result<String, String> {
    let folder = app
        .dialog()
        .file()
        .blocking_pick_folder();

    match folder {
        Some(path) => Ok(path.to_string()),
        None => Err("No folder selected".to_string()),
    }
}

/// Tauri command: return the current SQLite file path that is open,
/// or an empty string if no database is loaded yet.
#[tauri::command]
pub fn get_db_path(state: State<'_, DbState>) -> Result<String, String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    match guard.as_ref() {
        Some(conn) => {
            // rusqlite exposes the path via db_config; we stored it separately,
            // but path() works for a regular open().
            let path = conn.path().unwrap_or("").to_string();
            Ok(path)
        }
        None => Ok(String::new()),
    }
}

/// Tauri command: open (or switch to) a database at the given file path.
/// Replaces any existing connection stored in DbState.
#[tauri::command]
pub fn open_database(path: String, state: State<'_, DbState>) -> Result<(), String> {
    let conn = open_db(&path)?;
    let mut guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    *guard = Some(conn);
    Ok(())
}
