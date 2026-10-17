# Implementation Plan: Phase 1 (/contracts/)

## Objective
Formalize the neutral data layer and API specification as the single source of truth for the Verdigris Cloud OS, decoupling the Go gateway and Angular host.

## Proposed Actions

### 1. File System Scaffolding
- Create:
  - `/contracts/sql/`
  - `/contracts/openapi/`
  - `/contracts/scripts/`

### 2. Contract Formalization
- Populate `contracts/sql/schema.sql` with full DDL for:
  - System/OS state (`system_preferences`, `active_processes`, `window_states`)
  - RBAC (`user_profiles`, `roles`, `permissions`)
  - Appwrite/Polar persistence (`databases`, `tables`, `license_keys`, `meters`)
  - Xi Economy (`cogs_breakdown`, `ledger`, `proposals`)
- Populate `contracts/openapi/webos.v1.yaml` with REST boundaries for:
  - AI Assistant (`/api/ai/chat`)
  - Polar Billing/Metering (`/api/polar/*`)
  - Xi Economy Engine (`/api/xi/*`)

### 3. Generation Pipeline
- Create `contracts/scripts/codegen-ts.sh` to generate TypeScript types into `src/generated/api.types.ts`.
- Create `contracts/scripts/codegen-go.sh` to generate Go models into `go/pkg/contracts/api.gen.go`.

### 4. Integration
- Run `codegen-ts.sh`.
- Replace legacy static `src/app/models/webos.models.ts` references with imports from `src/generated/api.types.ts`.
- Verify compilation and linting.

## Risks & Mitigation
- **Schema Drift**: Mitigation is enforced via strict generation pipeline (no manual model definitions allowed).
- **Migration Complexity**: Entities are mapped 1:1; database DDL is generated first, then TS interfaces.

Please review this plan. If you approve, I will proceed with creating the directory structure and populating the contract files.
