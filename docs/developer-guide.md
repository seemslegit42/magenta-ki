# Developer Guide

## Architecture Overview
Verdigris Cloud OS is a microkernel-based WebOS. It partitions responsibilities into:
1. **Desktop Kernel (Angular Signals)**: Manages windows, state, reactive signals, and UI.
2. **Gateway (Go & Appwrite IAM)**: Auth, WOPI host, and Turso Edge DB routing.
3. **Appwrite Databases (TablesDB)**: Multi-database management with shared/dedicated infrastructure and server SDK code generation for 11 programming languages.
4. **Persistence (Turso/libSQL)**: Tenant-isolated edge databases and WASM OPFS.

## Appwrite Server SDKs
Supported SDK code generators for programmatic database and table provisioning:
- Node.js (`node-appwrite`)
- Deno (`npm:node-appwrite`)
- PHP (`Appwrite\Services\TablesDB`)
- Python (`appwrite.services.tables_db`)
- Ruby (`Appwrite::TablesDB`)
- C# / .NET (`TablesDB`)
- Dart (`dart_appwrite`)
- Kotlin (`io.appwrite.services.TablesDB`)
- Java (`io.appwrite.services.TablesDB`)
- Swift (`Appwrite.TablesDB`)
- Rust (`appwrite::services::databases::Databases`)

## Adding a New App (Native Federation)
1. **Define Manifest**: Create `assets/apps/<app-id>.json`.
2. **Implement Standalone Component**: Ensure it's a standalone component.
3. **Expose Module**: Configure `federation.config.mjs` to expose the component.
4. **Register in Store**: Add to `AppStoreComponent` catalog.
