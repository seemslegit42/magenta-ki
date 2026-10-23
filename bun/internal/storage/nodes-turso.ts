import { getDb } from "../db/client";
import type { NodeRepository, VfsNode } from "./types";

function mapRow(row: Record<string, unknown>): VfsNode {
  return {
    id: String(row["id"]),
    parentId: row["parent_id"] == null ? null : String(row["parent_id"]),
    name: String(row["name"]),
    kind: row["kind"] === "file" ? "file" : "dir",
    blobId: row["blob_id"] == null ? null : String(row["blob_id"]),
    size: Number(row["size"] ?? 0),
    mime: row["mime"] == null ? null : String(row["mime"]),
    updatedAt: Number(row["updated_at"] ?? 0),
  };
}

export function createTursoNodeRepository(): NodeRepository {
  return {
    async getById(id) {
      const res = await getDb().execute({
        sql: `SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
              FROM vfs_nodes WHERE id = ? LIMIT 1`,
        args: [id],
      });
      if (res.rows.length === 0) return null;
      return mapRow(res.rows[0] as Record<string, unknown>);
    },

    async getChild(parentId, name) {
      const pid = parentId ?? "root";
      const res = await getDb().execute({
        sql: `SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
              FROM vfs_nodes WHERE parent_id = ? AND name = ? LIMIT 1`,
        args: [pid, name],
      });
      if (res.rows.length === 0) return null;
      return mapRow(res.rows[0] as Record<string, unknown>);
    },

    async listChildren(parentId) {
      const pid = parentId ?? "root";
      const res = await getDb().execute({
        sql: `SELECT id, parent_id, name, kind, blob_id, size, mime, updated_at
              FROM vfs_nodes WHERE parent_id = ?
              ORDER BY kind ASC, name ASC`,
        args: [pid],
      });
      return res.rows.map((r) => mapRow(r as Record<string, unknown>));
    },

    async insert(node) {
      await getDb().execute({
        sql: `INSERT INTO vfs_nodes (id, parent_id, name, kind, blob_id, size, mime, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          node.id,
          node.parentId,
          node.name,
          node.kind,
          node.blobId,
          node.size,
          node.mime,
          node.updatedAt,
        ],
      });
    },

    async update(node) {
      await getDb().execute({
        sql: `UPDATE vfs_nodes
              SET parent_id = ?, name = ?, kind = ?, blob_id = ?, size = ?, mime = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          node.parentId,
          node.name,
          node.kind,
          node.blobId,
          node.size,
          node.mime,
          node.updatedAt,
          node.id,
        ],
      });
    },

    async remove(id) {
      await getDb().execute({
        sql: `DELETE FROM vfs_nodes WHERE id = ?`,
        args: [id],
      });
    },
  };
}
