# Architecture

## Core Sections (Required)

### 1) System shape

ΛΞVOS is a **WebOS-style Angular host** plus **two language-peer control planes** (Bun and Go), with **contracts/** as the stated cross-language boundary.

Stated product pillars (README): Lambda (signals/UI), Xi (AI + Ξ economy), Von (windowing / AgentFS / control planes).

```text
Browser (Angular NF host :3000)
    │  /api/*  (dev proxy)
    ▼
Bun.serve (:1991) ──► Gemini (@google/genai)
    │                 Polar route handlers (checkout URLs, ingest stubs)
    │  optional GO_API_URL
    ▼
Go http mux (:8080) ──► /api/xi/*, /api/items, /api/console/info
```

Evidence: `README.md`, `proxy.conf.json`, `bun/cmd/server/index.ts`, `bun/internal/handlers/xi.ts`, `go/cmd/server/main.go`.

### 2) Layering / organization

| Layer | Location | Pattern |
|-------|----------|---------|
| Presentation | `ts/apps/host/app/components/**` | Standalone Angular components |
| Client domain | `ts/apps/host/app/services/**` | `@Injectable({ providedIn: 'root' })` + **signals** |
| Shared models | `ts/apps/host/app/models/webos.models.ts` (+ generated types under `generated/`) | Types / contracts re-export |
| Bun API | `bun/internal/handlers` + `middleware` + `http/errors` | Route map for `Bun.serve` |
| Go API | `go/internal/handlers` + `middleware` + `services` | `http.ServeMux` in `cmd/server` |
| Alternate Go | `go/app.go` | Gin + Appwrite SDK + design-pattern demos |

Primary host organization is **feature UI + service layer**, not classic Domain/Data folders.

### 3) Data / request flow (example)

**AI chat (live path):**

1. Angular host calls `/api/ai/chat` (proxied to Bun in dev).
2. `bun/internal/handlers/ai.ts` validates JSON, calls `GoogleGenAI` model `gemini-2.5-flash`, returns `{ reply, polarUsage }`.
3. Errors use `{ error: { code, message, details? } }` via `apiError` (`bun/internal/http/errors.ts`).

**Ξ floor (stub vs peel):**

1. `GET /api/xi/floor` on Bun.
2. If `GO_API_URL` set → `proxyToGo` (`bun/internal/handlers/xi.ts`).
3. Else local stub JSON (`localFloor`).
4. Go handler registered in `go/cmd/server/main.go` as `handlers.GetXiFloor`.

**Desktop windowing (client-only):**

1. `WindowManagerService` holds `signal` maps of processes/windows.
2. Root `App` injects the service; dock/window components bind to it.
3. No server round-trip required for spawn/focus/minimize in current unit/e2e tests.

### 4) Initialization order

1. Browser: `initFederation('federation.manifest.json', …)` then dynamic `import('./bootstrap')` (`ts/apps/host/main.ts`).
2. App config: zoneless change detection, `provideHttpClient(withFetch())`, router, `provideAppInitializer` → `NativeFederationService.refreshManifest()` (`app.config.ts`).
3. Bun: load `config` from env, register CORS-wrapped `apiRoutes`, listen (`bun/cmd/server/index.ts`).

### 5) Persistence & integrations (as implemented)

| Concern | Reality in code | Evidence |
|---------|-----------------|----------|
| Appwrite Storage (Bun) | Adapter present; uses env-configured client | `bun/internal/storage/appwrite.ts` |
| Appwrite Databases (UI) | Large client service + component (in-memory / simulated UX in host) | `appwrite-database.service.ts`, component |
| Turso / libSQL | Documented intent; `GatewayService` returns **mock** tenant URL + fake query rows | `docs/developer-guide.md`, `gateway.service.ts`, `TODO.md` open item |
| AgentFS | Client `AgentFSService` + explorer UI (OPFS claimed in UI copy) | `agentfs.service.ts`, agentfs-explorer |
| Polar | Bun routes + host `PolarBillingService`; checkout builds polar.sh URL | `bun/internal/handlers/polar.ts`, `polar-billing.service.ts` |
| Auth | Simulated Bearer / default operator user | `go/internal/middleware/auth.go`, `auth-rbac.service.ts`, `gateway.service.ts` |

### 6) Design patterns observed

- Angular signals + computed for desktop state (`window-manager.service.ts`).
- Route aggregation object for Bun (`handlers/index.ts`).
- Optional reverse-proxy peel Bun → Go for Xi (`xi.ts` + `go/gateway/README.md`).
- Go `internal/patterns/{facade,observer,strategy}` used from `go/app.go` (pattern demos tied to that entry).

### 7) Evidence

- `README.md`
- `ts/apps/host/main.ts`, `app.config.ts`, `app.ts`
- `bun/cmd/server/index.ts`, `bun/internal/handlers/{ai,xi,polar,index}.ts`
- `go/cmd/server/main.go`, `go/gateway/README.md`
- `contracts/openapi/webos.v1.yaml`
- `manifest.acp.md` (subsystem inventory; product intent)
