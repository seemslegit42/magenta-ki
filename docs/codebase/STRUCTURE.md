# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `ts/apps/host/` | Angular Native Federation host (UI, SSR, services, desktop apps) | `angular.json` `sourceRoot`, `README.md` |
| `bun/` | Bun control plane: `/api/*` (AI, Polar, Xi stub/proxy) | `bun/cmd/server/index.ts`, `README.md` |
| `go/` | Go control plane: Xi economy + Appwrite-related handlers; alternate Gin app in `go/app.go` | `go/cmd/server/main.go`, `go/app.go`, `go/gateway/README.md` |
| `contracts/` | SoT: OpenAPI, SQL schema/queries, codegen scripts | `contracts/openapi/webos.v1.yaml`, `contracts/sql/` |
| `tests/` | Bun unit + “e2e” suites | `bunfig.toml`, `tests/unit/`, `tests/e2e/` |
| `public/` | Static assets + `federation.manifest.json` | `angular.json` assets, `public/federation.manifest.json` |
| `docs/` | Setup, developer, user, Appwrite self-host guides | `docs/*.md` |
| `appwrite/` | Self-hosted Appwrite Docker stack (included by root compose) | `appwrite/docker-compose.yml`, root `docker-compose.yml` |
| `proxy.conf.json` | Dev proxy `/api` → Bun `:1991` | `proxy.conf.json`, `angular.json` serve options |
| `federation.config.mjs` | Native Federation build config | root |
| `.ai/`, `.aistudio/` | AI Studio / chronicle artifacts (not runtime source) | scan tree |

### 2) Entry Points

- Angular browser: `ts/apps/host/main.ts` → federation init → `./bootstrap`
- Angular SSR: `ts/apps/host/server.ts` / `main.server.ts`; Bun wrapper `ts/apps/host/server.entry.mjs` (`serve:ssr:app`)
- Bun API: `bun/cmd/server/index.ts` (`bun run bun:api`)
- Go API (documented peel): `go/cmd/server/main.go`
- Alternate Go main (Gin monolith-style): `go/app.go` — **not** what `README` documents for `go run ./cmd/server`
- How selected: `package.json` scripts; Angular via `angular.json` `browser` / NF builders

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `ts/apps/host/app/components/` | Desktop chrome + in-window “apps” UI | Persistence / billing IO (prefer services or Bun) |
| `ts/apps/host/app/services/` | Client-side domain services (signals, mocks, HTTP to `/api`) | Raw Gemini/Polar secrets handling |
| `bun/internal/handlers/` | HTTP route handlers for AI / Polar / Xi | Angular UI |
| `bun/internal/storage/` | Appwrite Storage adapter at API boundary | UI state |
| `go/internal/handlers|services/` | Authoritative Xi + console/items when Go is up | Frontend |
| `contracts/` | Shared schemas and generation inputs | Hand-edited generated output as SoT |

### 4) Naming and Organization Rules

- File naming: Angular components/services use `kebab-case` + `.component.ts` / `.service.ts` (e.g. `window-manager.service.ts`)
- Selectors: element `app-*` kebab-case; directive attribute `app*` camelCase (`eslint.config.js`)
- Directory organization: host is feature/UI folders under `components/` (desktop, dock, window, apps/*) + layered `services/`, `models/`
- Imports: relative within host app; models from `../models/webos.models`; no `@/` path alias in root `tsconfig.json`

### 5) Evidence

- `README.md` repository structure
- `angular.json` (`sourceRoot`: `ts/apps/host`)
- `package.json` scripts
- `docs/codebase/.codebase-scan.txt` directory tree
- `eslint.config.js` selector rules
