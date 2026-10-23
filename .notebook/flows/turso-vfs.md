# Turso + domain VFS

Tags: turso, vfs, bun, appwrite, storage

## Flow
1. Boot: `bun/cmd/server` → `migrate()` applies `contracts/sql/schema.sql`, seeds `vfs_nodes.root` + `system_preferences`.
2. DB: `GET /api/db/health`, `POST /api/db/query`, `POST /api/db/sync` — `bun/internal/handlers/db.ts` + `bun/internal/db/*`.
3. VFS: Turso tree (`NodeRepository`) + `BlobStore` (local or Appwrite folder attr) — `bun/internal/storage/filesystem.ts`.
4. Host: `GatewayService` fetch → `/api/db/*` (proxy in dev).

## Env
- Local: `TURSO_URL=file:./data/lxvos-shell.db`
- Replica: `TURSO_SYNC_URL` + `TURSO_AUTH_TOKEN` (+ `offline: true`)
- Appwrite blobs: full `APPWRITE_*` set; else `LOCAL_BLOB_ROOT`

## Gotcha
SQL migrator strips `--` comments **before** splitting on `;` — never leave bare `;` inside comments without that order.
