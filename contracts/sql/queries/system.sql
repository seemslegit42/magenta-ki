-- ============================================================================
-- Verdigris Cloud OS - Canonical Query Contracts (sqlc compliant)
-- Location: /contracts/sql/queries/system.sql
-- ============================================================================

-- name: GetSystemPreferences :one
SELECT id, theme, wallpaper_url, scaling_factor, dock_position, sound_enabled, desktop_toasts_enabled, min_priority, updated_at
FROM system_preferences
WHERE id = ? LIMIT 1;

-- name: UpdateSystemPreferences :exec
INSERT INTO system_preferences (id, theme, wallpaper_url, scaling_factor, dock_position, sound_enabled, desktop_toasts_enabled, min_priority, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  theme = excluded.theme,
  wallpaper_url = excluded.wallpaper_url,
  scaling_factor = excluded.scaling_factor,
  dock_position = excluded.dock_position,
  sound_enabled = excluded.sound_enabled,
  desktop_toasts_enabled = excluded.desktop_toasts_enabled,
  min_priority = excluded.min_priority,
  updated_at = excluded.updated_at;

-- name: ListActiveProcesses :many
SELECT pid, name, binary_path, status, memory_usage, started_at
FROM active_processes
ORDER BY started_at DESC;

-- name: UpsertProcess :exec
INSERT INTO active_processes (pid, name, binary_path, status, memory_usage, started_at)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(pid) DO UPDATE SET
  status = excluded.status,
  memory_usage = excluded.memory_usage;

-- name: DeleteProcess :exec
DELETE FROM active_processes WHERE pid = ?;

-- name: ListWindowStates :many
SELECT window_id, pid, title, x, y, width, height, z_index, is_minimized, is_maximized
FROM window_states
ORDER BY z_index ASC;

-- name: UpsertWindowState :exec
INSERT INTO window_states (window_id, pid, title, x, y, width, height, z_index, is_minimized, is_maximized)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(window_id) DO UPDATE SET
  title = excluded.title,
  x = excluded.x,
  y = excluded.y,
  width = excluded.width,
  height = excluded.height,
  z_index = excluded.z_index,
  is_minimized = excluded.is_minimized,
  is_maximized = excluded.is_maximized;

-- name: GetTenantContext :one
SELECT tenant_id, user_id, roles_json, turso_conn_url, updated_at
FROM tenant_contexts
WHERE tenant_id = ? LIMIT 1;

-- name: GetLatestXiCogs :one
SELECT id, c_infra, w_infra, c_exec, w_exec, c_align, w_align, c_valid, w_valid, calculated_floor, updated_at
FROM xi_cogs_breakdowns
ORDER BY updated_at DESC LIMIT 1;

-- name: GetXiLedger :one
SELECT id, available_supply, minted_fiat_purchased, minted_poa_pool, burned_execution_pool, burned_elastic_access_pool, terminal_operational_cogs_usd, updated_at
FROM xi_ledger
WHERE id = 'primary_ledger' LIMIT 1;
