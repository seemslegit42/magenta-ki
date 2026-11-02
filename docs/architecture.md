# ΛΞVOS Architecture & System Design
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*  
**Document Revision:** 2.4.0 (Zoneless Microkernel Architecture)

---

## 1. Executive Summary

**ΛΞVOS** (Lambda Xi Von Operating System) is a hyper-modular, browser-synthesized Cloud Operating System and Native Federation host. Designed for high-assurance cognitive computing, enterprise micro-frontend orchestration, and multi-tenant edge database management, ΛΞVOS bridges deterministic client execution with stochastic intelligence.

The architecture is built on the **Architectural Trinity**:
1. **Lambda ($\lambda$) — The Function:** Pure reactive, stateless computation powered by Angular v21+ Signals (`signal`, `computed`, `linkedSignal`). Every UI interaction, process state shift, and window lifecycle event is modeled as a deterministic state transform.
2. **Xi ($\Xi$) — The Unknown:** Stochastic intelligence and autonomous cognitive workflows governed by Google Gemini AI, continuous Server-Sent Events (SSE) telemetry, and the **$\Xi$ Economy** (dynamic $Ξ_{Floor}$ pricing, proof-of-attribution rewards, and tokenized feature gating).
3. **Von ($V$) — The Machine:** The Von Neumann machine model realized inside the browser: isolated process memory spaces, Copy-on-Write (CoW) virtual filesystems (**AgentFS**), window z-index elevation stacks, and an Express SSR/Node.js control plane.

---

## 2. High-Level System Architecture

```text
+-----------------------------------------------------------------------------------------+
|                                    CLIENT (BROWSER)                                     |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |                            OS Shell Root (`App` in `src/app/app.ts`)               |  |
|  +-----------------------------------------------------------------------------------+  |
|  | [StatusBar] System clock, active tenant, identity/RBAC switcher, notification bell|  |
|  | [Workspace Stage] Watermark 'Λ Ξ V O S', Frosted glass dark backdrop, Ambient glow|  |
|  | [DesktopIcons] Draggable grid, persistent layout, multi-select, context menus      |  |
|  | [Process Stacking] Multi-window manager (`WindowComponent` instances with Chrome) |  |
|  |   ├─ Appwrite TablesDB      ├─ Native Federation Studio ├─ Agentic Value Framework|  |
|  |   ├─ Polar Usage Billing    ├─ AgentFS Explorer         ├─ WOPI Office Suite       |  |
|  |   ├─ Security Audit & RBAC  ├─ Telemetry Dashboard      ├─ AI Terminal / Console   |  |
|  | [Dock] Running process badges, launch shortcuts, minimize/restore tray             |  |
|  | [Search Spotlight] Global fuzzy search (`Cmd/Ctrl + K`) for apps & commands       |  |
|  | [Beep Assistant] Embedded modal AI copilot with speech synthesis simulation        |  |
|  | [Toast Container] Floating reactive notification toasts                            |  |
|  +-----------------------------------------------------------------------------------+  |
|                                         ▲                                               |
|                    Reactive Signals & Global Event Registry Bus                         |
|                    `window.__NF_REGISTRY__` / Angular Signals                           |
|                                         ▼                                               |
+-----------------------------------------------------------------------------------------+
                                          │
                                HTTP / SSE / REST APIs
                                          │
+-----------------------------------------------------------------------------------------+
|                                GATEWAY CONTROL PLANE                                    |
|                       (Express / Vite Middleware in `src/server.ts`)                    |
|                                                                                         |
|  ├─ Angular Node App Engine SSR (`/`) with BootstrapContext                             |
|  ├─ Telemetry SSE Broadcast Hub (`/api/telemetry/sse`)                                  |
|  ├─ Google Gemini API AI Proxy (`/api/ai/chat`) with Cost Insights calculation           |
|  ├─ Polar Usage Billing & Metering (`/api/polar/*`)                                     |
|  ├─ The Xi Economy Engine (`/api/xi/*`)                                                 |
|  └─ AgentFS & WOPI Document Endpoints (`/api/wopi/*`, `/api/agentfs/*`)                 |
+-----------------------------------------------------------------------------------------+
                                          │
                        Edge Database & IAM Infrastructure
                                          │
+-----------------------------------------------------------------------------------------+
|                      EXTERNAL & EDGE SERVICES INTEGRATION                               |
|                                                                                         |
|  ├─ Appwrite v2.5.0 Self-Hosted Cluster (TablesDB, IAM, MCP Server over stdio)          |
|  ├─ Turso / libSQL Edge Database Mesh & WASM OPFS Persistence                           |
|  └─ Polar.sh Usage-Based Billing & License Verification API                             |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 The Desktop Kernel & Window Manager
- **Service:** `WindowManagerService` (`src/app/services/window-manager.service.ts`)
- **Component Host:** `src/app/app.html` & `WindowComponent` (`src/app/components/window/window.component.ts`)
- **Key Concepts:**
  - **Process Management:** Active processes are held in a reactive signal `activeProcesses: Signal<Process[]>`.
  - **Focus & Z-Index:** Clicking any window elevates its z-index above all other active processes (`focusProcess(id)`).
  - **Geometry & Responsive Snapping:** Windows maintain `(x, y, width, height)` coordinates with bounds clamping to prevent drifting outside the viewport. Supports window snapping (left half, right half, full screen) and minimum size restrictions.
  - **Window Chrome:** Custom frosted titlebars with window controls (Minimize, Maximize/Restore, Close), process icon, and title.

### 3.2 Draggable Desktop Icons System
- **Service:** `DesktopIconsService` (`src/app/services/desktop-icons.service.ts`)
- **Component:** `DesktopIconsComponent` (`src/app/components/desktop-icons/desktop-icons.component.ts`)
- **Key Concepts:**
  - **Grid & Position Persistence:** Icons are positioned on an $88 \times 104\text{ px}$ grid with coordinates stored in `localStorage` (`desktop_icons_layout_v1`).
  - **Direct Drag & Drop:** Custom HTML5 and pointer-based dragging with boundary constraints and collision resolution.
  - **Context Menu:** Right-click context actions including *Open*, *Align to Grid*, *Reset to Default*, *Toggle Position Lock*, and *Properties*.
  - **Launch Action:** Double-click launches or focuses the associated app via `WindowManagerService`.

### 3.3 Native Federation v4 Micro-Frontend (MFE) Orchestrator
- **Service:** `NativeFederationService` (`src/app/services/native-federation.service.ts`)
- **Studio UI:** `NativeFederationStudioComponent` (`src/app/components/apps/native-federation/native-federation-studio.component.ts`)
- **Key Concepts:**
  - **Standards-Based ESM:** Uses browser-native ES Modules and Import Maps—eliminating proprietary Webpack runtime lock-in.
  - **Shared Dependency Pooling:** Automatically shares singleton dependencies (`@angular/core`, `@angular/common`, `@angular/forms/signals`, `tailwindcss`) between host and remotes to prevent duplicate package loads.
  - **Subresource Integrity (SRI):** Enforces cryptographic SHA-384/SHA-512 hashes on all federated remote entry manifests (`remoteEntry.json`).
  - **Cross-MFE Event Bus:** Implements `window.__NF_REGISTRY__` with an in-memory event bus supporting publish/subscribe, replay history, and bidirectional communication between independently deployed micro-frontends.

### 3.4 The $\Xi$ (Xi) Economy & Polar Metering Engine
- **Services:** `XiEconomyService` (`src/app/services/xi-economy.service.ts`) and `PolarBillingService` (`src/app/services/polar-billing.service.ts`)
- **Endpoints:** `/api/xi/*` and `/api/polar/*` (`src/server.ts`)
- **Mathematical Formulations:**
  - **Floor Cost Formula ($Ξ_{Floor}$):**
    $$Ξ_{Floor} = (\text{Base} \times C_{CPU}) + (T_{In} \times W_{Prompt}) + (T_{Out} \times W_{Completion}) + M_{Risk}$$
    Calculates dynamic computational cost for every CogniOps execution based on model complexity and latency.
  - **Proof-of-Attribution ($R_{Xi}$):**
    $$R_{Xi} = \text{AttributionScore} \times \text{EpochYield} \times (1 - \text{Penalty}_{\text{Drift}})$$
    Rewards nodes and autonomous agents for verifiable intellectual and computational throughput.
  - **Polar Cost Insights:** Telemetry events automatically append a `_cost: { amount: number, currency: "USD" }` attribute in decimal cents to billable actions (such as Gemini token calls and AgentFS writes).

### 3.5 Appwrite TablesDB & SDK Code Generation
- **Service:** `AppwriteDatabaseService` (`src/app/services/appwrite-database.service.ts`)
- **Component:** `AppwriteDatabasesComponent` (`src/app/components/apps/appwrite-databases/appwrite-databases.component.ts`)
- **Key Concepts:**
  - **Multi-Tenant Database Manager:** Manages dedicated and shared Appwrite database clusters, schemas, tables, and indices.
  - **Server SDK Code Generator:** Generates idiomatic, copy-pasteable server provisioning snippets for **11 programming languages**:
    - Node.js (`node-appwrite`)
    - Deno (`npm:node-appwrite`)
    - PHP (`Appwrite\Services\TablesDB`)
    - Python (`appwrite.services.tables_db`)
    - Ruby (`Appwrite::TablesDB`)
    - C# / .NET (`Appwrite.Services.TablesDB`)
    - Dart (`dart_appwrite`)
    - Kotlin (`io.appwrite.services.TablesDB`)
    - Java (`io.appwrite.services.TablesDB`)
    - Swift (`Appwrite.TablesDB`)
    - Rust (`appwrite::services::databases::Databases`)

### 3.6 AgentFS & Sandboxed Virtual Filesystem
- **Service:** `AgentFsService` (`src/app/services/agentfs.service.ts`)
- **Component:** `AgentFsExplorerComponent` (`src/app/components/apps/agentfs-explorer/agentfs-explorer.component.ts`)
- **Key Concepts:**
  - **Virtual Inode Tree:** Sandboxed hierarchical file structure (`/sys`, `/bin`, `/home`, `/agents`, `/audit`).
  - **Copy-on-Write (CoW) Snapshots:** File mutations generate immutable version snapshots enabling instantaneous rollback.
  - **Append-Only Tool Audit Ledger:** Monitored tool invocations and file modifications are cryptographically recorded.

### 3.7 WOPI Office Protocol Suite
- **Service:** `WopiService` (`src/app/services/wopi.service.ts`)
- **Component:** `WopiOfficeComponent` (`src/app/components/apps/wopi-office/wopi-office.component.ts`)
- **Key Concepts:**
  - Implements the Web Application Open Platform Interface (WOPI) specification (`CheckFileInfo`, `GetFile`, `PutFile`, `Lock`, `Unlock`, `RefreshLock`).
  - Concurrency control via exclusive lock token leases for collaborative real-time editing of docs, spreadsheets, and slides.

### 3.8 Security, RBAC & Cryptographic Audit Trail
- **Services:** `AuthRbacService` (`src/app/services/auth-rbac.service.ts`) and `SecurityAuditService` (`src/app/services/audit.service.ts`)
- **Component:** `SecurityAuditComponent` (`src/app/components/apps/security-audit/security-audit.component.ts`)
- **Key Concepts:**
  - **Role-Based Access Control (RBAC):** Hierarchical roles: `Admin`, `Developer`, `Auditor`, `Operator`. Fine-grained capability checks (`SYSTEM_HALT`, `SCHEMA_MUTATE`, `EXPORT_TELEMETRY`, `MANAGE_KEYS`).
  - **Tamper-Evident Hash Chaining:** Every audit entry records `previousHash` and computes SHA-256 over its timestamp, actor, action, and payload.
  - **Cryptographic Export:** One-click verified export to JSON and CSV formats with compliance signatures.

---

## 4. UI/UX Design System: Digital Wabi Sabi

The interface adheres strictly to the **Digital Wabi Sabi** aesthetic defined by ΛΞV Inc:
- **Surface Palette:**
  - Background & Base Surface: `#0E1015` (Deepest Obsidian)
  - Surface Containers: `#14161C` (Low), `#1A1C23` (Standard), `#22252F` (High), `#2D303C` (Highest)
  - Outline: `rgba(245, 255, 250, 0.18)`
- **Chromatic Bridges:**
  - Primary (Imperial Violet): `#6A0DAD` (Container: `#3B0764`)
  - Secondary (Roman Aqua): `#20B2AA` (Container: `#115E59`)
  - Tertiary (Verdigris Emerald): `#3EB991` (Container: `#14532D`)
  - Semantic Magenta Glow: `#E0218A` (Glow: `#FF2A9D`, Dim: `#8B1254`)
- **Typography:**
  - Display Font: `Comfortaa, cursive` (Headlines, brand logotype, process titles)
  - Body Font: `Lexend, sans-serif` (Data grids, terminals, labels, inspector panels)
- **Glassmorphism:**
  - `.frosted-glass` with `backdrop-filter: blur(16px)` and subtle borders.
  - Ambient watermarked center logo `Λ Ξ V O S` positioned behind the window manager stack.

---

## 5. Zoneless Angular Architecture

ΛΞVOS runs entirely without `zone.js`:
- `provideZoneChangeDetection` is strictly eliminated.
- Change detection triggers automatically on Signal updates (`signal.set()`, `signal.update()`, and input signals).
- Components utilize `ChangeDetectionStrategy.OnPush` implicitly (default in Angular v22+).
- Two-way bindings use `model()`, derived states use `computed()`, and complex multi-source state synchronizations use `linkedSignal()`.
