# ΛΞVOS — The Lambda Xi Von Operating System
### **lxvOS** | *The Function. The Unknown. The Machine.*

---

## Architectural Trinity

**ΛΞVOS** (Lambda Xi Von Operating System, or **lxvOS** when restricted to ASCII) is an enterprise-grade cloud operating system and native federation host. It bridges deterministic computation with stochastic intelligence through three foundational pillars:

1. **Lambda (λ) — The Function:** Pure, reactive, stateless computation built on Angular Signals and immutable state transitions.
2. **Xi (Ξ) — The Unknown:** Stochastic intelligence and emergent agent workflows powered by Gemini APIs, telemetry meters, and the **Ξ (Xi) Economy**.
3. **Von (V) — The Machine:** Sandboxed process memory, AgentFS, window stack management, and language-peer control planes (`go/`, `bun/`).

---

## Repository Structure

```text
/
├── contracts/               # Cross-language schemas & OpenAPI (SoT)
├── go/                      # Go control plane (Xi authority, Appwrite)
│   ├── cmd/server/
│   └── gateway/             # Peel docs — set GO_API_URL on Bun
├── bun/                     # Bun control plane (AI, Polar, Xi shim/proxy)
│   ├── cmd/server/
│   └── internal/handlers/
├── ts/apps/host/            # Angular Native Federation host (ex-src/)
│   ├── app/
│   ├── server.ts            # SSR + static only (no Express)
│   └── generated/
├── tests/                   # bun:test unit + e2e
├── proxy.conf.json          # ng serve → Bun :1991 for /api
└── angular.json
```

---

## Control Planes

### Bun API (`bun run bun:api` → `:1991`)
- `/api/ai/chat` — Gemini + Polar cost telemetry
- `/api/polar/*` — metering, checkouts, customer state, webhooks
- `/api/xi/*` — local stubs, or proxied to Go when `GO_API_URL` is set

### Go API (`go run ./cmd/server` → `:8080`)
- Authoritative `/api/xi/*` (and Appwrite console routes)

### Angular host (`bun run dev` → `:3000`)
- Proxies `/api` to Bun via `proxy.conf.json`
- SSR entry: `ts/apps/host/server.ts` (Node `http` + `AngularNodeAppEngine`)
- Native Federation: Angular adapter → [`@softarc/native-federation-orchestrator`](https://github.com/native-federation/orchestrator)
  - Browser: `ts/apps/host/main.ts` — `initFederation` + `localStorageEntry`, `convertFlatSharedInfo`
  - Manifest: `public/federation.manifest.json` → remote `remoteEntry.json` URLs
  - SSR (Bun): `bun run serve:ssr:app` → `ts/apps/host/server.entry.mjs` → `initNodeFederation` then `dist/app/server/server.mjs`
    - Bun-safe `setImportMapFn` / `loadModuleFn` (Node loader MessageChannel is unreliable under Bun)

---

## Development

```bash
bun install

# Terminal A — Bun control plane
bun run bun:api

# Terminal B — Angular NF host (proxies /api → :1991)
bun run dev

# Tests
bun test
bun run test:unit
bun run test:e2e

# Production Angular build
bun run build

# Peel Xi to Go
GO_API_URL=http://127.0.0.1:8080 bun run bun:api
```

---

## KPI snapshot (Control-Plane Split)

| KPI | Status |
|---|---|
| Express / cors deps | Removed |
| Bun serves 10/10 former Express routes | Yes |
| `bun test` | Gate |
| `ng build` | Gate |
| Host path | `ts/apps/host` |

---

## API & Contract Standards

Boundaries are defined in `contracts/openapi/webos.v1.yaml`. Bun error bodies use `{ error: { code, message, details? } }`.

---

*ΛΞVOS Core Engineering | The Future Needs Context | Innovate, Automate, Dominate*
