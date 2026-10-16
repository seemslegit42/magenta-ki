# Changelog

All notable changes to the Verdigris Cloud OS workspace are documented in this file.

## [Unreleased] - 2026-10-15

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
