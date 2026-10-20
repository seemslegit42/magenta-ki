# Verdigris Cloud OS - Engineering Roadmap & TODO

## Active Tasks
- [x] Integrate Native Federation with Angular 22 ApplicationBuilder
- [x] Configure asynchronous `AppInitializer` for `federation.manifest.json` pre-bootstrap hydration
- [x] Fix dev server startup arguments and configuration in `package.json`
- [x] Fix TypeScript strict typing violations and Angular AOT compiler errors
- [x] Implement `AppLauncherComponent` grid with category filtering and `WindowManagerService` integration
- [x] Pass all unit tests (14/14 green) and ESLint checks (0 errors)

- [x] Refactor `go/app.go` with Gin web framework and Appwrite Go SDK best practices (multi-tenancy, team isolation, TablesDB CRUD, Blades AI agent)
- [ ] Implement drag-and-drop custom desktop icon rearrangement
- [ ] Expand WOPI protocol mock server with real-time WebDAV file locks
- [ ] Add offline PWA service worker caching for Native Federation manifests
- [ ] Connect Turso edge database replicas to live gateway proxy
- [x] Create placeholder docker-compose.yml for Appwrite self-hosting (on standby)
- [x] Integrate Polar Usage-Based Billing & Metering Engine (`PolarBillingService`)
- [x] Implement Polar event ingestion pipeline with Cost Insights (`_cost`) and sub-cent precision
- [x] Add Polar meters management, filter clauses, and aggregation calculation engine
- [x] Provide Polar hosted checkout session generation and license key validation
- [x] Wire Express gateway proxy endpoints (`/api/polar/*`) and Gemini AI token metering
- [x] Pass unit test suite for Polar Billing Service (7/7 green, 61/61 project total)
- [x] Implement The Ξ (Xi) Economy & CogniOps Foundation (`XiEconomyService`)
- [x] Define weighted CogniOps unit cost floor: Ξ_Floor = ∑(ω_i · C_i) with contractual CAD/USD peg
- [x] Implement Hybrid Tiered SaaS upgrade threshold formula: U_upgrade = Q_lower + (X_higher - X_lower)/(R_lower - R_higher)
- [x] Implement Proof-of-Attribution (PoA) reward formula: R_Ξ = M_Ξ · N_k · (F_k)^α · E_data (Strategic COGS investment)
- [x] Build closed-loop Ξ lifecycle (Minting channels vs Burning for CogniOps and Elastic Access)
- [x] Formulate Hybrid Pricing & Value Committee (HPVC) governance model and proposal voting
- [x] Implement Sankey economic flow diagram data structure for CFO and telemetry visualization
- [x] Integrate Ξ Economy Cockpit into `GatewayConsoleComponent` (zero new front-end files)
- [x] Pass unit test suite for XiEconomyService (7/7 green, 68/68 bun unit tests, 14/14 vitest tests)
- [x] Complete Phase 1: Establish Neutral `/contracts/` Subtree (Zero Schema Drift)
  - [x] Canonical SQLite / libSQL DDL (`contracts/sql/schema.sql`) covering System, Processes, Windows, RBAC, Appwrite, Polar & Xi Economy
  - [x] Canonical sqlc queries (`contracts/sql/queries/system.sql`)
  - [x] Canonical OpenAPI 3.1 REST/RPC specification (`contracts/openapi/webos.v1.yaml`)
  - [x] Generation pipelines (`contracts/scripts/codegen-ts.sh`, `contracts/scripts/codegen-go.sh`)
  - [x] Auto-generated TypeScript contract definitions (`src/generated/api.types.ts`) re-exported via `webos.models.ts`
- [ ] Phase 2: Scaffold `/go/gateway/` reverse proxy and peel off `/api/*` endpoints
- [ ] Phase 3: Decouple `/ts/apps/host` to pure Angular Native Federation Host
- [ ] Phase 4: Root Evacuation & Lefthook Execution Scoping


