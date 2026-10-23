# Conventions

## Core Sections (Required)

### 1) Naming

| Kind | Convention | Evidence |
|------|------------|----------|
| Angular component files | `*.component.ts` kebab-case directory/file | `window.component.ts`, `app-launcher` |
| Angular services | `*.service.ts` kebab-case | `window-manager.service.ts` |
| Component selectors | `app-<kebab>` elements | `eslint.config.js`, `selector: 'app-root'` |
| Directive selectors | `app` + camelCase attribute | `eslint.config.js` |
| Bun handlers | lowercase module names `ai.ts`, `polar.ts`, `xi.ts` | `bun/internal/handlers/` |
| Go packages | `handlers`, `middleware`, `services` under `internal/` | `go/internal/` |
| CSS/class usage | Tailwind utility classes in templates; some hex colors inline | e.g. agentfs-explorer template |

### 2) TypeScript / Angular style

- Strict TypeScript enabled with extra flags: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns` (`tsconfig.json`).
- Standalone components (`standalone: true` on `App`).
- Zoneless change detection explicit (`provideZonelessChangeDetection()`).
- DI via `inject()` and `providedIn: 'root'` services.
- Signals preferred for mutable UI/domain state (`signal`, `computed`, `asReadonly`).

### 3) Lint / format

- ESLint flat config: recommended + stylistic TS + Angular TS/template (+ a11y for HTML) (`eslint.config.js`).
- Lint entry: `ng lint` over `ts/apps/host/**/*.{ts,html}` (`angular.json`, `package.json`).
- No Prettier / Biome config found in scan.
- `[ASK USER]` Whether Biome or another formatter is required for this repo vs workspace-wide preference.

### 4) Error handling

- Bun API: structured `apiError(status, code, message, details?)` → `{ error: { code, message, details? } }` (`bun/internal/http/errors.ts`; README contract note).
- Go Auth middleware: does not reject missing tokens; defaults to simulated operator (`go/internal/middleware/auth.go`).
- Angular services: mix of thrown `Error` (e.g. `GatewayService.authenticateSession`) and in-memory/audit paths — no single shared client error type observed.

### 5) Imports

- Host: relative imports (`./services/...`, `../models/webos.models`).
- Bun: relative from `internal/` (`../config`, `../http/errors`).
- Go: module path `go-appwrite/main/...` (`go/go.mod`, imports in `cmd/server/main.go`).
- No root `paths` aliases in `tsconfig.json`.

### 6) Logging

- Bun: `console.log` on listen (`bun/cmd/server/index.ts`).
- Go: `log.Printf` / `log.Fatalf` (`go/cmd/server/main.go`).
- Federation: `consoleLogger` at `warn` (`ts/apps/host/main.ts`).
- No structured logging library (Zap, Pino, etc.) in manifests.

### 7) Evidence

- `tsconfig.json`
- `eslint.config.js`
- `ts/apps/host/app/app.config.ts`
- `ts/apps/host/app/services/window-manager.service.ts`
- `bun/internal/http/errors.ts`
- `go/internal/middleware/auth.go`
