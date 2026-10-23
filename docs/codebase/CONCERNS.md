# Concerns

## Core Sections (Required)

### 1) Intent vs. reality (high priority)

| Claim (docs / naming) | Observed reality | Evidence |
|-----------------------|------------------|----------|
| Brand ΛΞVOS / lxvOS | Many strings still “Verdigris Cloud OS” / `ai-studio-angular-app` | `TODO.md` title, `package.json` name, OpenAPI `info.title`, AI system prompt in `ai.ts` |
| Bun-first workflow | `docs/setup.md` still says `npm install` / `npm start`; `Dockerfile` uses npm + `node` | `docs/setup.md`, `Dockerfile` |
| Turso edge DB connected | Open TODO; `GatewayService` mocks queries / URLs | `TODO.md`, `gateway.service.ts` |
| Express gateway Polar wiring | Express removed; Polar lives on Bun | `README.md` KPI, `TODO.md` checked item wording vs `bun/internal/handlers/polar.ts` |
| Auth / IAM | Simulated operator + client RBAC | `go/internal/middleware/auth.go`, `auth-rbac.service.ts` |

### 2) Dual / ambiguous Go entry points

- Documented peel path: `go/cmd/server/main.go` (stdlib mux, Xi + items + console).
- Also present: large `go/app.go` (Gin + Appwrite SDK + Blades + pattern packages, ~600 lines).
- Risk: contributors run the wrong binary; features diverge.

Evidence: `go/cmd/server/main.go`, `go/app.go`, `README.md`, `go/gateway/README.md`.

`[ASK USER]` Is `go/app.go` still the intended production Go surface, a demo, or legacy to delete?

### 3) Missing / mismatched dependencies

- `bun/internal/storage/appwrite.ts` imports `node-appwrite` / `node-appwrite/file`, but package is **not** in root `package.json` or `bun.lock`.
- `tabler-icons-react` is a React icon package in an Angular host dependency list — likely unused or accidental.

Evidence: `bun/internal/storage/appwrite.ts`, `package.json`, `bun.lock` grep.

### 4) Oversized UI / service files

| File | ~Lines | Risk |
|------|--------|------|
| `appwrite-databases.component.ts` | 1387 | Mixed UI + domain; hard to review/test |
| `agentic-value-framework.component.ts` | 999 | Same |
| `appwrite-database.service.ts` | 997 | Same |

Evidence: `wc -l` on those paths; scan “largest files”.

### 5) Security risks

- Go auth middleware never rejects unauthenticated callers; Bearer token becomes user ID without verification (`go/internal/middleware/auth.go`).
- `GatewayService` embeds a placeholder Turso URL with `authToken=eyJhbGci...` stub in source (`gateway.service.ts`) — treat as fake, but pattern is dangerous if real tokens land in repo.
- Bun CORS default `CORS_ORIGIN=*` (`bun/internal/config.ts`, `bun/.env.example`).
- AI handler may echo upstream error messages to clients (`AI_GENERATION_FAILED` with `err.message`).
- No Dependabot / SECURITY.md / CI security scans detected.

### 6) Testing gaps

- “E2E” suites do not drive a browser or live Bun/Go servers.
- No CI workflows to enforce `bun test` / `ng build` gates claimed in README.
- Test TODOs vs product TODOs: product open items in `TODO.md` (DnD desktop icons, WOPI WebDAV locks, PWA SW, Turso live, Lefthook scoping).

### 7) High-churn / fragile areas

Scan high-churn (90d) still lists pre-migration `src/...` paths alongside `CHANGELOG.md`, `README.md`, `package.json`, `TODO.md`, `angular.json`, window-manager / app-launcher / dock / window components.

Post-migration fragility concentrated in: federation/SSR (`server.ts`, `server.entry.mjs`), window manager, Docker/Appwrite compose.

Evidence: `docs/codebase/.codebase-scan.txt` HIGH-CHURN FILES; recent commits about Bun SSR and Angular migration.

### 8) Contract drift

- OpenAPI servers/title still Verdigris / Cloud Run URL; Bun routes use `/api/ai/chat`, `/api/polar/*`, `/api/xi/*` while OpenAPI also documents `/v1/...` process/preferences paths — verify generation consumers stay aligned.
- `[TODO]` Whether codegen (`contracts/scripts/codegen-*.sh`) is run in CI or only manually.

Evidence: `contracts/openapi/webos.v1.yaml`, Bun handlers, `TODO.md` Phase 1 notes.

### 9) Open product TODOs (from `TODO.md`)

- Drag-and-drop desktop icon rearrangement
- WOPI mock → real-time WebDAV locks
- Offline PWA service worker for federation manifests
- Connect Turso replicas to live gateway proxy
- Lefthook execution scoping (Phase 4 polish)

### 10) Evidence

- `TODO.md`, `README.md`, `docs/setup.md`
- `Dockerfile`, `package.json`, `bun.lock`
- `go/app.go`, `go/cmd/server/main.go`, `go/internal/middleware/auth.go`
- `bun/internal/storage/appwrite.ts`, `bun/internal/handlers/ai.ts`
- `ts/apps/host/app/services/gateway.service.ts`
- `docs/codebase/.codebase-scan.txt`
