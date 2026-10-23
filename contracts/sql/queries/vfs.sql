-- ============================================================================
-- Λ Ξ V O S — VFS query contracts (sqlc-style)
-- Location: /contracts/sql/queries/vfs.sql
-- ============================================================================

-- name: GetVfsNodeById :one
SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
FROM vfs_nodes
WHERE id = ? LIMIT 1;

-- name: ListVfsChildren :many
SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
FROM vfs_nodes
WHERE parent_id IS ?
ORDER BY kind ASC, name ASC;

-- name: ListVfsChildrenOfRoot :many
SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
FROM vfs_nodes
WHERE parent_id IS NULL AND id != 'root'
ORDER BY kind ASC, name ASC;

-- name: GetVfsChildByName :one
SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
FROM vfs_nodes
WHERE parent_id IS ? AND name = ?
LIMIT 1;

-- name: InsertVfsNode :exec
INSERT INTO vfs_nodes (id, parent_id, name, kind, blob_id, size, mime, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateVfsNode :exec
UPDATE vfs_nodes
SET parent_id = ?, name = ?, kind = ?, blob_id = ?, size = ?, mime = ?, updated_at = ?
WHERE id = ?;

-- name: DeleteVfsNode :exec
DELETE FROM vfs_nodes WHERE id = ?;
