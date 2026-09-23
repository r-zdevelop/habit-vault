// Diet entry commands: daily food log with description and optional kcal

use crate::commands::db::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Represents a single diet entry row returned to the frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DietEntry {
    pub id: i64,
    pub entry_date: String,
    pub description: String,
    pub kcal: Option<i64>,
    pub created_at: String,
}

/// Tauri command: return all diet entries for a given date (YYYY-MM-DD), oldest first
#[tauri::command]
pub fn get_diet_entries(
    entry_date: String,
    state: State<'_, DbState>,
) -> Result<Vec<DietEntry>, String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, entry_date, description, kcal, created_at
             FROM diet_entries
             WHERE entry_date = ?1
             ORDER BY id ASC",
        )
        .map_err(|e| format!("Prepare error: {e}"))?;

    let entries = stmt
        .query_map(rusqlite::params![entry_date], |row| {
            Ok(DietEntry {
                id: row.get(0)?,
                entry_date: row.get(1)?,
                description: row.get(2)?,
                kcal: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row error: {e}"))?;

    Ok(entries)
}

/// Tauri command: insert a new diet entry and return the created row
#[tauri::command]
pub fn create_diet_entry(
    entry_date: String,
    description: String,
    kcal: Option<i64>,
    state: State<'_, DbState>,
) -> Result<DietEntry, String> {
    if description.trim().is_empty() {
        return Err("Description cannot be empty".to_string());
    }
    if let Some(k) = kcal {
        if k < 0 {
            return Err("Kcal cannot be negative".to_string());
        }
    }

    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    conn.execute(
        "INSERT INTO diet_entries (entry_date, description, kcal) VALUES (?1, ?2, ?3)",
        rusqlite::params![entry_date, description.trim(), kcal],
    )
    .map_err(|e| format!("Insert error: {e}"))?;

    let id = conn.last_insert_rowid();

    let entry = conn
        .query_row(
            "SELECT id, entry_date, description, kcal, created_at FROM diet_entries WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(DietEntry {
                    id: row.get(0)?,
                    entry_date: row.get(1)?,
                    description: row.get(2)?,
                    kcal: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| format!("Fetch error: {e}"))?;

    Ok(entry)
}

/// Tauri command: update the description and/or kcal of an existing diet entry
#[tauri::command]
pub fn update_diet_entry(
    id: i64,
    description: String,
    kcal: Option<i64>,
    state: State<'_, DbState>,
) -> Result<DietEntry, String> {
    if description.trim().is_empty() {
        return Err("Description cannot be empty".to_string());
    }
    if let Some(k) = kcal {
        if k < 0 {
            return Err("Kcal cannot be negative".to_string());
        }
    }

    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    conn.execute(
        "UPDATE diet_entries SET description = ?1, kcal = ?2 WHERE id = ?3",
        rusqlite::params![description.trim(), kcal, id],
    )
    .map_err(|e| format!("Update error: {e}"))?;

    let entry = conn
        .query_row(
            "SELECT id, entry_date, description, kcal, created_at FROM diet_entries WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(DietEntry {
                    id: row.get(0)?,
                    entry_date: row.get(1)?,
                    description: row.get(2)?,
                    kcal: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| format!("Fetch error: {e}"))?;

    Ok(entry)
}

/// Tauri command: delete a diet entry by id
#[tauri::command]
pub fn delete_diet_entry(id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    conn.execute("DELETE FROM diet_entries WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Delete error: {e}"))?;

    Ok(())
}
