# Changelog

All notable changes to the Verdigris Cloud OS workspace are documented in this file.

## [Unreleased] - 2026-10-16

### Added
- **Polar Usage-Based Billing & Metering Engine**: Complete domain service (`PolarBillingService`) supporting custom and scalar usage meters, condition filtering, and aggregation operators (`count`, `sum`, `avg`, `min`, `max`, `unique`).
- **Cost Insights & Sub-Cent Telemetry**: Event ingestion pipeline capturing `_cost` decimal amounts in cents with 12-decimal micro-cost precision and live session tracking.
- **Hosted Checkout & Customer State API**: Programmatic checkout session generation with ad-hoc pricing support and customer entitlement retrieval (`subscriptions`, `benefits`, `customer_meters`).
- **Gateway Console Metering Hub**: Embedded telemetry management tab in `GatewayConsoleComponent` providing live meter counters, interactive token ingestion simulation, and cryptographic license key validation.
- **Server Gateway Proxy Routes**: Added `/api/polar/events/ingest`, `/api/polar/checkouts`, `/api/polar/customer-state/:id`, and `/api/polar/webhooks` with AI token usage auto-metering on `/api/ai/chat`.
- **Automated Test Suite**: 7 comprehensive unit test specifications in `tests/unit/polar-billing.service.test.ts` (100% passing).

### Fixed
- **Express TS7030 No Implicit Returns**: Fixed route handler returns across all proxy endpoints in `src/server.ts` to satisfy strict compiler flags.
- **Node v22 Engine Compatibility**: Pinned `@softarc/native-federation-orchestrator` to `4.6.0` in `package.json` to resolve `EBADENGINE` warnings.

## [0.1.0] - 2026-10-15

### Added
- **AppLauncherComponent**: Full-featured application matrix grid displaying core enterprise applications and dynamic Native Federation micro-frontends.
- **Window Orchestration Integration**: Bi-directional integration between `AppLauncherComponent` and `WindowManagerService` enabling single-click process launching, focus shifting, and minimized window restoration.
- **Search & Category Telemetry**: Reactive real-time search filtering and category classification (`productivity`, `system`, `database`, `security`, `developer`, `ai`, `federated`).
- **Dock & Statusbar Quick Triggers**: Dedicated 1-click launcher buttons in both the translucent dock navigation bar and top statusbar system menu.
- **Unit Test Suite**: 8 automated unit test specifications in `src/app/components/apps/app-launcher/app-launcher.component.spec.ts`.

### Fixed
- **TypeScript Strict Null & Union Errors**: Resolved TS18048 (`newTable.recordsCount` & `t.recordsCount` null checks) in `AppwriteDatabaseService`.
- **Remote Definition Status Typing**: Eliminated TS2345 type mismatch in `RemoteContainerComponent` by fixing union type widening in `RemoteDefinition.status`.
- **ESLint Compliance**: Associated all form labels with controls in `NativeFederationStudioComponent`, converted non-interactive statusbar elements to accessible buttons, and removed unused variables across storage and models.
- **Build Server Warnings**: Added `src/server.ts` and `app-launcher.component.ts` to `tsconfig.app.json` files array for clean AOT compilation.
