// HabitVault – Tauri 2.0 library entry point
// All public commands are registered here and exposed to the frontend.

mod commands;

use commands::checks::{get_week_checks, toggle_check};
use commands::db::{get_db_path, open_database, select_db_folder, DbState};
use commands::habits::{create_habit, delete_habit, get_habits, update_habit};
use std::sync::{Arc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared SQLite connection: starts as None until the user selects a DB folder
    let db_state: DbState = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            // DB management
            select_db_folder,
            get_db_path,
            open_database,
            // Habits
            get_habits,
            create_habit,
            update_habit,
            delete_habit,
            // Checks
            toggle_check,
            get_week_checks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
