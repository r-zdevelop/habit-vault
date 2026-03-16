// Check (daily completion) commands

use crate::commands::db::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Represents a single check record returned to the frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CheckRecord {
    pub id: i64,
    pub habit_id: i64,
    pub check_date: String,
}

/// Tauri command: toggle a check for a habit on a given date.
/// Returns true if the check now EXISTS (was inserted), false if it was removed.
#[tauri::command]
pub fn toggle_check(
    habit_id: i64,
    check_date: String,
    state: State<'_, DbState>,
) -> Result<bool, String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    // Check if a row already exists for this habit + date
    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM checks WHERE habit_id = ?1 AND check_date = ?2",
            rusqlite::params![habit_id, check_date],
            |row| row.get(0),
        )
        .ok();

    if let Some(existing_id) = existing {
        // Remove the check
        conn.execute(
            "DELETE FROM checks WHERE id = ?1",
            rusqlite::params![existing_id],
        )
        .map_err(|e| format!("Delete error: {e}"))?;
        Ok(false)
    } else {
        // Insert the check
        conn.execute(
            "INSERT INTO checks (habit_id, check_date) VALUES (?1, ?2)",
            rusqlite::params![habit_id, check_date],
        )
        .map_err(|e| format!("Insert error: {e}"))?;
        Ok(true)
    }
}

/// Tauri command: return all check records for the week starting on week_start (YYYY-MM-DD).
/// The week covers week_start through week_start + 6 days inclusive.
#[tauri::command]
pub fn get_week_checks(
    week_start: String,
    state: State<'_, DbState>,
) -> Result<Vec<CheckRecord>, String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.habit_id, c.check_date
             FROM checks c
             INNER JOIN habits h ON h.id = c.habit_id
             WHERE h.is_active = 1
               AND c.check_date >= ?1
               AND c.check_date <= date(?1, '+6 days')
             ORDER BY c.check_date ASC",
        )
        .map_err(|e| format!("Prepare error: {e}"))?;

    let records = stmt
        .query_map(rusqlite::params![week_start], |row| {
            Ok(CheckRecord {
                id: row.get(0)?,
                habit_id: row.get(1)?,
                check_date: row.get(2)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row error: {e}"))?;

    Ok(records)
}
