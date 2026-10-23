/**
 * Apply contracts/sql/schema.sql once, then seed VFS root + default prefs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "./client";

const MIGRATION_ID = "contracts-schema-v1";

/** Strip `--` line comments, then split on statement terminators. */
function splitSql(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("--")) return "";
      return line;
    })
    .join("\n");

  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function migrate(): Promise<void> {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const existing = await db.execute({
    sql: "SELECT id FROM schema_migrations WHERE id = ?",
    args: [MIGRATION_ID],
  });
  if (existing.rows.length > 0) {
    await ensureSeeds();
    return;
  }

  const schemaPath = join(
    import.meta.dir,
    "../../../contracts/sql/schema.sql",
  );
  const ddl = readFileSync(schemaPath, "utf8");
  for (const stmt of splitSql(ddl)) {
    await db.execute(stmt);
  }

  await db.execute({
    sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
    args: [MIGRATION_ID, Date.now()],
  });

  await ensureSeeds();
}

async function ensureSeeds(): Promise<void> {
  const db = getDb();
  const now = Date.now();

  await db.execute({
    sql: `INSERT OR IGNORE INTO vfs_nodes (id, parent_id, name, kind, blob_id, size, mime, updated_at)
          VALUES ('root', NULL, '', 'dir', NULL, 0, NULL, ?)`,
    args: [now],
  });

  await db.execute({
    sql: `INSERT OR IGNORE INTO system_preferences
          (id, theme, wallpaper_url, scaling_factor, dock_position, sound_enabled,
           desktop_toasts_enabled, min_priority, updated_at)
          VALUES ('default', 'dark', NULL, 1.0, 'bottom', 1, 1, 'low', ?)`,
    args: [now],
  });
}
