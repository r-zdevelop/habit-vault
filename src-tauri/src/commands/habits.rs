// Habit CRUD commands

use crate::commands::db::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Represents a habit row returned to the frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Habit {
    pub id: i64,
    pub name: String,
    pub objetivo: i64,
    pub order_idx: i64,
    pub created_at: String,
    pub is_active: bool,
}

/// Tauri command: return all active habits ordered by order_idx
#[tauri::command]
pub fn get_habits(state: State<'_, DbState>) -> Result<Vec<Habit>, String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, objetivo, order_idx, created_at, is_active
             FROM habits
             WHERE is_active = 1
             ORDER BY order_idx ASC, id ASC",
        )
        .map_err(|e| format!("Prepare error: {e}"))?;

    let habits = stmt
        .query_map([], |row| {
            Ok(Habit {
                id: row.get(0)?,
                name: row.get(1)?,
                objetivo: row.get(2)?,
                order_idx: row.get(3)?,
                created_at: row.get(4)?,
                is_active: row.get::<_, i64>(5)? != 0,
            })
        })
        .map_err(|e| format!("Query error: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Row error: {e}"))?;

    Ok(habits)
}

/// Tauri command: insert a new habit and return the created row
#[tauri::command]
pub fn create_habit(
    name: String,
    objetivo: i64,
    state: State<'_, DbState>,
) -> Result<Habit, String> {
    if name.trim().is_empty() {
        return Err("Habit name cannot be empty".to_string());
    }
    if !(1..=7).contains(&objetivo) {
        return Err("Goal must be between 1 and 7".to_string());
    }

    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    // Determine the next order_idx
    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(order_idx), -1) FROM habits WHERE is_active = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Query error: {e}"))?;

    conn.execute(
        "INSERT INTO habits (name, objetivo, order_idx) VALUES (?1, ?2, ?3)",
        rusqlite::params![name.trim(), objetivo, max_order + 1],
    )
    .map_err(|e| format!("Insert error: {e}"))?;

    let id = conn.last_insert_rowid();

    let habit = conn
        .query_row(
            "SELECT id, name, objetivo, order_idx, created_at, is_active FROM habits WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(Habit {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    objetivo: row.get(2)?,
                    order_idx: row.get(3)?,
                    created_at: row.get(4)?,
                    is_active: row.get::<_, i64>(5)? != 0,
                })
            },
        )
        .map_err(|e| format!("Fetch error: {e}"))?;

    Ok(habit)
}

/// Tauri command: update the name and/or goal of an existing habit
#[tauri::command]
pub fn update_habit(
    id: i64,
    name: String,
    objetivo: i64,
    state: State<'_, DbState>,
) -> Result<Habit, String> {
    if name.trim().is_empty() {
        return Err("Habit name cannot be empty".to_string());
    }
    if !(1..=7).contains(&objetivo) {
        return Err("Goal must be between 1 and 7".to_string());
    }

    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    conn.execute(
        "UPDATE habits SET name = ?1, objetivo = ?2 WHERE id = ?3",
        rusqlite::params![name.trim(), objetivo, id],
    )
    .map_err(|e| format!("Update error: {e}"))?;

    let habit = conn
        .query_row(
            "SELECT id, name, objetivo, order_idx, created_at, is_active FROM habits WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(Habit {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    objetivo: row.get(2)?,
                    order_idx: row.get(3)?,
                    created_at: row.get(4)?,
                    is_active: row.get::<_, i64>(5)? != 0,
                })
            },
        )
        .map_err(|e| format!("Fetch error: {e}"))?;

    Ok(habit)
}

/// Tauri command: soft-delete a habit by setting is_active = 0,
/// and cascade-delete all related check records
#[tauri::command]
pub fn delete_habit(id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let guard = state.lock().map_err(|_| "DB mutex poisoned".to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;

    // Hard delete so the checks cascade
    conn.execute("DELETE FROM habits WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Delete error: {e}"))?;

    Ok(())
}
