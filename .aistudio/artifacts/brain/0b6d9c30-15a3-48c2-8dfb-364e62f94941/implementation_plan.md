# Migration Plan: Native Federation Integration

## Goal: Migrate existing application to Native Federation

## Phase 1: Dependency Preparation
- Validate existing `@angular/core` version and install compatible `@angular-architects/native-federation`.
- Ensure `tsconfig.federation.json` is correctly set up for build isolation.

## Phase 2: Architectural Configuration
- Create/Configure `federation.config.mjs` for the host application (defining shared dependencies and scopes).
- Update `angular.json` to replace standard `@angular/build:application` targets with `@angular-architects/native-federation:build`.
- Configure `serve` target to use the federation-aware dev server wrapper.

## Phase 3: Bootstrap & Runtime Initialization
- Refactor `main.ts` to initialize the federation orchestrator using `initFederation`.
- Align existing `AppInitializer` (created in previous turn) to ensure manifest loading is integrated with the `initFederation` workflow.

## Phase 4: Verification & SSR Alignment
- Perform clean build (`ng build`).
- Validate SSR compatibility for federated components.
- Run unit/integration tests to ensure no regressions in runtime behavior.

## Estimated Timeline
- **Setup & Config**: 1-2 hours
- **Bootstrap & Migration**: 1-2 hours
- **Testing & Refinement**: 1 hour
