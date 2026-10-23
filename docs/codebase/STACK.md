# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary languages | TypeScript (Angular host + Bun API), Go (control plane) | `package.json`, `go/go.mod`, `ts/apps/host/`, `bun/` |
| Frontend runtime | Browser + Angular SSR (Node/`AngularNodeAppEngine`; Bun via `server.entry.mjs`) | `ts/apps/host/server.ts`, `ts/apps/host/server.entry.mjs`, `package.json` scripts |
| Bun API runtime | Bun (local install observed `1.4.2`) | `bun/cmd/server/index.ts`, `bunfig.toml` |
| Go runtime | `go 1.22` module directive (host toolchain observed `go1.27.3`) | `go/go.mod` |
| Package managers | Root: `bun.lock` present; `angular.json` `cli.packageManager` = `npm`; Go modules | `bun.lock`, `angular.json`, `go/go.mod` |
| Module/build system | Angular Application Builder + Native Federation; Bun.serve routes; Go `http`/`gin` | `angular.json`, `federation.config.mjs`, `bun/cmd/server/index.ts`, `go/cmd/server/main.go`, `go/app.go` |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| `@angular/core` (+ platform, router, SSR, forms, CDK, Material) | `^22.2.0` | Zoneless Angular WebOS host UI | `package.json` |
| `@angular-architects/native-federation` | `^22.2.3` | Micro-frontend host / remotes | `package.json`, `ts/apps/host/main.ts` |
| `@softarc/native-federation-orchestrator` | `^4.8.0` (dev) | Federation init options (storage, profile) | `package.json`, `ts/apps/host/main.ts` |
| `@google/genai` | `^2.4.0` | Gemini chat from Bun `/api/ai/chat` | `package.json`, `bun/internal/handlers/ai.ts` |
| `rxjs` | `~7.8.0` | Angular reactive interop | `package.json` |
| `motion` | `^12.23.24` | UI motion | `package.json` |
| `@tabler/icons` / `tabler-icons-react` | `^3.49.0` / `^1.56.0` | Icons (React package present in Angular app deps) | `package.json` |
| `github.com/gin-gonic/gin` | `v1.10.0` | HTTP framework in `go/app.go` | `go/go.mod`, `go/app.go` |
| `github.com/appwrite/sdk-for-go/v7` | `v7.0.0` | Appwrite SDK (Go) | `go/go.mod`, `go/app.go` |
| `github.com/go-kratos/blades` | `v0.0.1` | Blades AI agent usage in Go | `go/go.mod`, `go/app.go` |

Note: `bun/internal/storage/appwrite.ts` imports `node-appwrite`, but that package is **not** listed in root `package.json` or `bun.lock` at scan time.

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| Angular CLI / `@angular/build` | Serve, build, SSR | `package.json`, `angular.json` |
| `bun test` | Unit + e2e test runner | `package.json`, `bunfig.toml` |
| ESLint + `angular-eslint` + `typescript-eslint` | Lint TS/HTML | `eslint.config.js`, `package.json` `lint` |
| Tailwind CSS v4 + PostCSS | Styling | `package.json`, `.postcssrc.json`, `ts/apps/host/styles.css` |
| TypeScript `~6.0.3` | Compile | `package.json`, `tsconfig.json` |
| Docker / Compose | Containerized host + Appwrite stack include | `Dockerfile`, `docker-compose.yml`, `appwrite/docker-compose.yml` |

### 4) Key Commands

```bash
bun install
bun run bun:api          # Bun control plane :1991
bun run dev              # Angular host :3000 (proxies /api → 1991)
bun run build            # ng build (Native Federation)
bun test                 # all tests under tests/
bun run test:unit
bun run test:e2e
bun run lint             # ng lint
bun run serve:ssr:app    # Bun SSR entry
cd go && go run ./cmd/server   # Go API :8080 (optional peel)
```

### 5) Environment and Config

- Config sources: `.env.example`, `bun/.env.example`, `go/.env.example`, `appwrite.env`, `proxy.conf.json`, `angular.json`, `federation.config.mjs`, `public/federation.manifest.json`
- Required / documented env vars:
  - Root: `GEMINI_API_KEY`, `APP_URL` (`.env.example`)
  - Bun: `BUN_API_PORT`, `BUN_API_HOST`, `CORS_ORIGIN`, `EMBED_ORIGIN`, `GEMINI_API_KEY`, optional `GO_API_URL` (`bun/.env.example`)
  - Go: `APPWRITE_*`, `PORT` (`go/.env.example`)
  - Bun Appwrite storage adapter also expects `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_BUCKET_ID` (`bun/internal/storage/appwrite.ts`)
- Deployment/runtime constraints: Root `Dockerfile` builds with **npm** and runs `node dist/app/server/server.mjs` on port 3000; Compose service `lexvos-gateway` builds that image and includes Appwrite compose.

### 6) Evidence

- `package.json`
- `bun.lock` / `bunfig.toml`
- `go/go.mod`
- `angular.json`
- `Dockerfile` / `docker-compose.yml`
- `.env.example`, `bun/.env.example`, `go/.env.example`
- `docs/codebase/.codebase-scan.txt`
