# Testing

## Core Sections (Required)

### 1) Runner and layout

| Item | Value | Evidence |
|------|-------|----------|
| Runner | Bun test (`bun:test`) | `package.json` `test` / `test:unit` / `test:e2e`, `bunfig.toml` |
| Root | `tests/` | `bunfig.toml` `[test].root` |
| Preload | `tests/setup.ts` imports `@angular/compiler`, clears mocks `afterEach` | `tests/setup.ts` |
| Unit | `tests/unit/*.test.ts` (12 files at scan) | directory listing |
| E2E | `tests/e2e/*.test.ts` (7 files at scan) | directory listing |

### 2) What “e2e” means here

Files under `tests/e2e/` are **in-process workflow tests** that construct services (e.g. `new WindowManagerService()`) and assert multi-step behavior. They are **not** browser/Playwright/Cypress automation.

Evidence: `tests/e2e/window-management.e2e.test.ts` imports and instantiates host services directly.

### 3) Assertion / mocking

- Assertions: Bun `expect` from `bun:test`.
- Mocks: `mock` from `bun:test`; global `mock.clearAllMocks()` in preload.
- Typical pattern: construct `@Injectable` services with `new Service()` (no TestBed required for many unit tests).

Evidence: `tests/unit/window-manager.service.test.ts`, `tests/setup.ts`.

### 4) Coverage and CI

- No coverage threshold config found in scan / package scripts.
- No `.github/` workflows or other CI configs detected (`docs/codebase/.codebase-scan.txt` CI section).
- README lists `bun test` and `ng build` as gates (process claim, not automated in-repo CI).

### 5) Commands

```bash
bun test
bun run test:unit
bun run test:e2e
bun run test:watch
```

### 6) Test inventory (observed)

Unit targets include: agentfs, app-launcher, appwrite-database, audit, auth-rbac, avf, gateway, notification, polar-billing, window-manager, wopi, xi-economy.

E2E-named suites include: agentfs-workflow, ai-copilot-workflow, appwrite-database-workflow, audit-rbac-notification, gateway-turso-mesh, window-management, wopi-collaboration.

### 7) Evidence

- `package.json`
- `bunfig.toml`
- `tests/setup.ts`
- `tests/unit/window-manager.service.test.ts`
- `tests/e2e/window-management.e2e.test.ts`
- `docs/codebase/.codebase-scan.txt`
