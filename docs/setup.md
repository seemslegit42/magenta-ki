# Setup Guide

## Local Development (Λ Ξ V O S shell)

1. **Prerequisites**: Bun 1.4+, and optionally Go 1.22+ if peeling Xi to the Go control plane.
2. **Install**: `bun install`
3. **Env**: copy `bun/.env.example` → `bun/.env` (and root `.env.example` for `GEMINI_API_KEY` if using AI).
4. **Control plane**: `bun run bun:api` → `http://127.0.0.1:1991`
5. **Shell host**: `bun run dev` → `http://localhost:3000` (proxies `/api` → Bun)

## Turso / libSQL

- Default: local file `TURSO_URL=file:./data/lxvos-shell.db` (created under `data/` on first boot).
- Optional embedded replica: set `TURSO_SYNC_URL`, `TURSO_AUTH_TOKEN`, and optionally `TURSO_SYNC_INTERVAL` (seconds). Writes stay local-first (`offline: true`).
- Health: `GET /api/db/health` · Query: `POST /api/db/query` · Sync: `POST /api/db/sync`

## Domain VFS + blobs

- Tree metadata lives in Turso (`vfs_nodes`).
- Blobs: local `./data/blobs` by default, or Appwrite Storage when `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, and `APPWRITE_BUCKET_ID` are all set (virtual `folder` attribute on upload).
- FS API: `GET/DELETE /api/fs`, `POST /api/fs/mkdir`, `PUT/GET /api/fs/file`, `POST /api/fs/move`

## Gemini

Set `GEMINI_API_KEY` for `/api/ai/chat`.
