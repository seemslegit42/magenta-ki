# Integrations

## Core Sections (Required)

### 1) External APIs and services

| Integration | How used | Credentials / config | Evidence |
|-------------|----------|----------------------|----------|
| Google Gemini | Bun `POST /api/ai/chat` via `@google/genai` | `GEMINI_API_KEY` | `bun/internal/handlers/ai.ts`, `.env.example`, `bun/.env.example` |
| Polar (checkout / metering surface) | Bun routes under `/api/polar/*`; host `PolarBillingService`; checkout URL `https://checkout.polar.sh/...` | `EMBED_ORIGIN`; metering mostly handler-local | `bun/internal/handlers/polar.ts`, `polar-billing.service.ts` |
| Appwrite Cloud / self-host | Go env client config; Bun Storage adapter; UI “Appwrite Databases” app; Compose include | `APPWRITE_ENDPOINT`, `PROJECT_ID`, `API_KEY`, `DATABASE_ID`, `BUCKET_ID` | `go/.env.example`, `bun/internal/storage/appwrite.ts`, `appwrite/docker-compose.yml` |
| Native Federation remotes | Manifest-driven remotes | `public/federation.manifest.json`, `federation.config.mjs` | `ts/apps/host/main.ts`, `native-federation.service.ts` |
| Turso / libSQL | Documented + mocked in `GatewayService` | Mock `tursoConnUrl` string in service (not live client) | `gateway.service.ts`, `docs/developer-guide.md`, `TODO.md` |
| Cloud Run (docs) | OpenAPI lists a Cloud Run server URL | `[TODO]` deploy pipeline not in repo CI | `contracts/openapi/webos.v1.yaml` |

### 2) Internal service mesh / proxy

- Dev: Angular `proxy.conf.json` forwards `/api` → `http://127.0.0.1:1991`.
- Bun → Go: when `GO_API_URL` is set, `/api/xi/*` proxied (`bun/internal/handlers/xi.ts`, `go/gateway/README.md`).
- Root Compose: `lexvos-gateway` (Angular Dockerfile image) + included Appwrite network.

### 3) Databases

| Store | Status in codebase | Evidence |
|-------|--------------------|----------|
| `contracts/sql/schema.sql` + sqlc queries | Canonical DDL for System/Processes/Windows/RBAC/Appwrite/Polar/Xi | `contracts/sql/`, `TODO.md` |
| Turso edge | Intent; gateway queries mocked | `gateway.service.ts`, open TODO |
| Appwrite TablesDB | Go SDK usage in `go/app.go`; UI service large client-side model | `go/app.go`, `appwrite-database.service.ts` |
| AgentFS / OPFS | Client-side VFS service | `agentfs.service.ts` |

### 4) Auth

- Go: `AuthMiddleware` accepts optional Bearer; otherwise hardcoded simulated user (`go/internal/middleware/auth.go`).
- Angular: `AuthRbacService` role/permission matrix client-side (`auth-rbac.service.ts`, `manifest.acp.md`).
- `[ASK USER]` Target production IdP (Appwrite Auth vs other) and whether simulated auth must remain for demos.

### 5) Monitoring / observability

- No APM/Prometheus/Sentry configs in scan (`SECURITY & COMPLIANCE` / performance sections empty).
- Host `AuditService` / `NotificationService` provide in-app forensic/UX telemetry (`manifest.acp.md`, services).
- Polar `polarUsage` attached to AI responses for metering narrative (`ai.ts`).

### 6) Message queues / workers

- None detected in manifests or entry points.
- Appwrite self-host compose may run its own workers (under `appwrite/docker-compose.yml`) — treat as external stack, not app code.

### 7) Evidence

- `bun/internal/handlers/{ai,polar,xi}.ts`
- `bun/internal/storage/appwrite.ts`
- `bun/.env.example`, `go/.env.example`, `.env.example`
- `proxy.conf.json`
- `contracts/openapi/webos.v1.yaml`
- `docs/appwrite-self-hosted.md`, `docs/developer-guide.md`
