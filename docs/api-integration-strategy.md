# Verdigris Cloud OS — Comprehensive API Integration Strategy

> **Scope:** Authoritative architectural specification for all external service integrations, transport protocols, payload schemas, resilience controls, and security boundaries across the Angular SSR/Express edge layer and Go microservice gateway.

---

## 1. Executive Architecture

Verdigris Cloud OS enforces a **Zero-Browser-Secret / Centralized Gateway Pattern**:

```text
Angular Client (Browser)
   │  HTTPS + Bearer Session / Correlation ID (No external API keys)
   ▼
Express SSR & API Proxy (src/server.ts) ──► ResilientHttpClient (Circuit Breaker + Timeout + Retry)
   │  Internal IPC / mTLS / Timeout-Bounded Proxy
   ▼
Go Microservice Gateway (go/cmd/server/main.go)
   ├──► Google Gemini API (@google/genai)
   ├──► Appwrite Backend (TablesDB, Auth, Storage, Messaging)
   ├──► Turso / libSQL Edge Replicas
   ├──► Polar.sh Metering & Billing
   ├──► WOPI Office Host Protocol
   └──► GitLab CI/CD & Native Federation Remotes
```

**Core Invariant:** Browser code **never** calls third-party services directly with credentials or embeds private API tokens. All external traffic terminates at the Express or Go server boundary via centralized, typed client wrappers.

---

## 2. External Service Inventory, Protocols & Data Formats

| Service | Business Capability | Protocol & Transport | Auth Mechanism (Server-Only) | Request / Response Format |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini API** (`@google/genai`) | AI Copilot chat, autonomous workflows, and deep user feedback classification (`gemini-4-hydrogen`) | HTTPS (`TLS 1.3`), REST + Server-Sent Events (SSE) for streaming | `X-Goog-Api-Key` via `process.env.GEMINI_API_KEY` | JSON (`application/json`) with strict `responseSchema` typing; `text/event-stream` for streaming |
| **Appwrite Backend** (`TablesDB`, `Auth`, `Storage`, `Messaging`) | Multi-tenant projects/items CRUD, team isolation, file storage, transactional email/SMS/push | HTTPS REST JSON; `multipart/form-data` / `InputFile` for binary objects | `X-Appwrite-Key` (`APPWRITE_API_KEY`) + `X-Appwrite-Project` + scoped JWT | JSON rows (`createdBy` / `teamId` immutable); binary Buffers converted from Base64 only at server boundary |
| **Turso / libSQL Edge DB** | Per-tenant edge database routing, OS preferences, window state, offline VFS snapshots | `libsql://` SQLite wire & HTTPS **Hrana** pipeline (`TLS 1.3`) | Per-tenant scoped Bearer JWT (`TURSO_AUTH_TOKEN`) | Parameterized SQL statements + JSON/Protobuf Hrana result frames |
| **Polar.sh Billing & Metering** | Usage event ingestion (`_cost` sub-cent tracking), hosted checkouts, entitlement checks, webhooks | HTTPS REST JSON + Signed Webhooks | Bearer PAT (`POLAR_ACCESS_TOKEN`); **Standard Webhooks** HMAC-SHA256 | JSON (`externalCustomerId`, meter events, checkout URLs); `webhook-id`, `webhook-timestamp`, `webhook-signature` |
| **WOPI Collabora / Office Host** | Collaborative `.docx`/`.xlsx`/`.pptx` editing, `CheckFileInfo`, pessimistic concurrency locking | HTTPS REST + Raw Octet-Stream | Short-lived scoped `access_token` (Bearer) + `X-WOPI-Lock` header | JSON metadata (`CheckFileInfo`) & binary file streams (`GetFile` / `PutFile`) with HTTP `409 Conflict` lock negotiation |
| **GitLab CI/CD & Webhooks** | Pipeline triggers, staging deployment probes, feedback triage escalation hooks | HTTPS REST JSON | `X-Gitlab-Token` secret comparison (`crypto.timingSafeEqual`) | JSON webhook payloads verified against strict schema |
| **Native Federation Remotes** | Dynamic runtime micro-frontend loading (`federation.manifest.json`) | HTTPS ESM JavaScript + JSON import maps | Strict origin allowlist + Content Security Policy (`script-src`) | ESM bundles & W3C Import Map JSON |

---

## 3. Data Format & Contract Governance

1. **Canonical Contract First**:
   - Control-plane routes and payloads are specified in `/contracts/openapi/webos.v1.yaml` (OpenAPI 3.1) and `/contracts/sql/schema.sql`.
   - Generated TypeScript types flow downstream to `/src/generated/api.types.ts`.
2. **Normalized Error Envelope (`ApiErrorEnvelope`)**:
   - Every server route and integration adapter translates upstream vendor errors into a predictable, sanitized structure:
     ```json
     {
       "error": {
         "code": "UPSTREAM_UNAVAILABLE",
         "message": "The billing service is temporarily unavailable. Please try again shortly.",
         "serviceId": "polar-billing",
         "retryable": true,
         "correlationId": "cor_9a8f1b2c",
         "timestamp": 1795200000000
       }
     }
     ```
   - Stack traces, internal hostnames, SQL text, and vendor API keys are **never** serialized in client error responses.
3. **Timestamps & Numeric Precision**:
   - Timestamps travel as UTC epoch milliseconds (`number`) or ISO-8601 UTC strings (`string`).
   - Billing and CogniOps cost events preserve decimal-cents strings/high-precision floats without client-side rounding loss.

---

## 4. Resilient Error Handling Plan

All outbound integrations route through `ResilientHttpClient` (`src/server/resilient-http-client.ts`) enforcing four defensive layers:

| Control | Policy | Configuration Guidelines |
| :--- | :--- | :--- |
| **Strict Timeout Budgets** | Every outbound call attaches `AbortSignal.timeout(timeoutMs)` to prevent hung sockets or thread exhaustion. | Fast health/IPC: `300ms–1000ms`; CRUD DB calls: `3000ms`; LLM inference: `15000ms`. |
| **Bounded Retries + Full Jitter** | Retry only idempotent methods (`GET`, `HEAD`, `PUT`, `DELETE`) or requests carrying an explicit `Idempotency-Key` when receiving HTTP `408`, `429`, `502`, `503`, `504`, or transient network errors. | Max `2–3` retries; delay = `random(0, min(capMs, baseMs * 2^attempt))`; honor upstream `Retry-After` header when present. **Never** retry HTTP `400`, `401`, `403`, `404`, or `422`. |
| **Circuit Breaker State Machine** | Prevents cascading failures when a dependency degrades (`closed` → `open` → `half-open`). | Opens after `3` consecutive upstream `5xx`/network failures within a window; fast-fails for `30s` cooldown with `503 CIRCUIT_OPEN` before allowing a single `half-open` probe. |
| **Explicit Upstream Failure Propagation** | Never silently mask missing credentials (`GEMINI_API_KEY` unset) or upstream rejections with fabricated AI output. | Return actionable HTTP `400`/`403`/`429`/`503` guidance so the UI can display clear user recovery instructions or fall back explicitly only where offline/development parity is documented (e.g., local dev store). |

---

## 5. Security & Governance Plan

1. **Zero Client-Side Secret Exposure**:
   - All API keys (`GEMINI_API_KEY`, `APPWRITE_API_KEY`, `POLAR_ACCESS_TOKEN`, `TURSO_AUTH_TOKEN`, webhook signing secrets) reside strictly in server `process.env` and `.env.example` placeholders. No `VITE_` or `NG_APP_` prefixes are permitted for private credentials.
2. **SSRF & Outbound Host Allowlisting**:
   - Any dynamically resolved outbound URL (remote federation manifest probe, webhook dispatch, external health check) is validated by `assertSafeOutboundUrl()`:
     - Restricts protocol strictly to `https:` (or controlled local dev loopback only for explicitly allowlisted local service ports).
     - Blocks cloud metadata IPs (`169.254.169.254`, `fd00:ec2::254`), loopback addresses, and RFC-1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) from untrusted/user-supplied URLs.
     - Enforces hostname allowlist matching per registered integration.
3. **Webhook Authenticity & Replay Prevention**:
   - Polar and GitLab webhooks verify HMAC-SHA256 signatures and shared tokens via `crypto.timingSafeEqual`.
   - Reject timestamps older than `300 seconds` to defeat replay attacks.
4. **Input Validation, Ownership & Injection Protection**:
   - All REST inputs trim strings, enforce explicit type & length constraints, strip HTML/script payloads, and reject attempts to mutate immutable ownership columns (`createdBy`, `teamId`).
   - Parameterized SQL (`contracts/sql/queries/system.sql`, Turso/libSQL) eliminates SQL injection; strict TypeScript checks disallow arbitrary JSON operator objects.
5. **Audit Trail & Least Privilege**:
   - Security-sensitive integration events (secret rejections, circuit opens, RBAC blocks, feedback triage changes) log to `AuditService` with user role, timestamp, entity ID, and correlation ID.
   - Server logs scrub `Authorization`, `Cookie`, `X-Appwrite-Key`, `X-Goog-Api-Key`, and query token parameters before output.
