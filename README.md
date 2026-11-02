# ΛΞVOS — The Lambda Xi Von Operating System
### **lxvOS** | *The Function. The Unknown. The Machine.*
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*

---

## 🏛️ Architectural Trinity

**ΛΞVOS** (Lambda Xi Von Operating System, or **lxvOS** when restricted to ASCII) is an enterprise-grade cloud operating system and native federation host. It bridges deterministic computation with stochastic intelligence through three foundational pillars:

1. **Lambda (λ) — The Function:** Pure, reactive, stateless computation built on **Angular v21+ Signals** (`signal`, `computed`, `linkedSignal`) and zoneless state transitions. Every UI mutation, window drag event, and process lifecycle event is modeled as a pure mathematical transformation.
2. **Xi (Ξ) — The Unknown:** Stochastic intelligence and emergent agent workflows powered by Google Gemini APIs, decentralized telemetry meters, and the **Ξ (Xi) Economy** (cogniops floor pricing $Ξ_{Floor}$, proof-of-attribution rewards $R_{Xi}$, and elastic feature gating).
3. **Von (V) — The Machine:** The Von Neumann architectural homage. Sandboxed process memory spaces, Copy-on-Write AgentFS virtual filesystems, isolated virtual window stack management, and a robust Express/Node.js gateway control plane.

---

## 🎨 Visual Design System: Digital Wabi Sabi

The entire OS interface is crafted using the **Digital Wabi Sabi** aesthetic:
- **Surface & Glass:** `#0E1015` dark frosted glass backdrop with subtle centered `Λ Ξ V O S` rotating watermark crest and dynamic radial atmospheric glow.
- **Chromatic Bridges:** Imperial Violet (`#6A0DAD`), Roman Aqua (`#20B2AA`), Verdigris Emerald (`#3EB991`), and Hyperspatial Magenta (`#E0218A`, glow: `#FF2A9D`).
- **Typography:** `Comfortaa, cursive` for geometric display headlines & `Lexend, sans-serif` for high-legibility system controls and terminals.

---

## 📚 Complete Documentation Suite

Comprehensive technical and operational manuals are available in the [`/docs/`](/docs) directory:

| Document | Description |
| :--- | :--- |
| **[Architecture & System Design](/docs/architecture.md)** | Deep architectural dive: Trinity pillars, component hierarchy, zoneless signals, Native Federation runtime model, and security mechanics. |
| **[Developer Guide](/docs/developer-guide.md)** | Complete developer guide: coding conventions, authoring new applications, MFE federation, cross-app event bus (`window.__NF_REGISTRY__`), and backend APIs. |
| **[User Manual & App Catalog](/docs/user-guide.md)** | Comprehensive user guide: Desktop navigation, draggable shortcuts, window chrome, context menus, and deep dive into all 9 built-in apps. |
| **[Setup & Deployment Guide](/docs/setup.md)** | Installation, environment configuration, Vitest unit testing, Docker containerization, and Caddy reverse proxy setup. |
| **[API & Contracts Reference](/docs/api-reference.md)** | Full specification for all REST endpoints, Server-Sent Events (SSE) telemetry stream, WOPI protocol, and Angular service interfaces. |
| **[Self-Hosted Appwrite Integration](/docs/appwrite-self-hosted.md)** | Self-hosted Appwrite 2.5.0 cluster setup, MCP stdio server configuration, and server SDK compatibility matrix. |

---

## 📂 Repository Structure

```text
/
├── contracts/               # Single source of truth for cross-language schemas & specs
│   ├── openapi/             # REST & Gateway API specifications (webos.v1.yaml)
│   └── sql/                 # Canonical SQLite DDL & migration state
├── docs/                    # Complete architectural, developer, setup, and user documentation
│   ├── architecture.md      # Microkernel design, Trinity pillars, and signals dataflow
│   ├── developer-guide.md   # Application authoring, MFE orchestration, and testing
│   ├── user-guide.md        # Desktop manipulation and 9-app enterprise catalog
│   ├── setup.md             # Development, Docker, Caddy, and deployment runbooks
│   ├── api-reference.md     # REST, SSE telemetry, and Angular service reference
│   └── appwrite-self-hosted.md # Appwrite 2.5.0 and MCP server configuration
├── src/
│   ├── app/                 # Angular Standalone Components & Signal Services
│   │   ├── components/      # Desktop apps (Appwrite, Federation, AVF, Polar, AgentFS, WOPI, Terminal, Audit)
│   │   ├── models/          # Enterprise TypeScript interfaces & schemas
│   │   └── services/        # Window Manager, Desktop Icons, Billing, RBAC, and Audit services
│   ├── server.ts            # Express Gateway & SSR entry point (AI, SSE, Polar, Ξ Economy)
│   └── main.ts / main.server.ts # Client & Server bootstrap modules (BootstrapContext)
├── tests/
│   ├── e2e/                 # End-to-end orchestrator flows (Window management, AgentFS, Gateway mesh)
│   └── unit/                # Unit test suites (Polar billing, Xi Economy, RBAC, Window Manager)
└── angular.json             # Angular CLI & Native Federation build configuration
```

---

## ⚡ Core Subsystems

### 1. Control Plane & Gateway (`src/server.ts`)
The Node.js/Express gateway running on Vite middleware handles:
- **Server-Side Rendering (SSR)** via Angular Node App Engine with trusted proxy validation (`BootstrapContext`).
- **Real-Time Telemetry Stream (`/api/telemetry/sse`)** broadcasting memory RSS/Heap, CPU, and event rates via Server-Sent Events.
- **Google Gemini AI Inference (`/api/ai/chat`)** with automatic token estimation and cost insight telemetry (`_cost` in decimal cents).
- **Polar Billing & Metering (`/api/polar/*`)** for usage-based billing events, checkout sessions, customer state hydration, and multi-device license validation.
- **The Ξ (Xi) Economy (`/api/xi/*`)** for calculating dynamic floor costs ($Ξ_{Floor}$), burning tokens for CogniOps execution, executing Proof-of-Attribution ($R_{Xi}$), and managing HPVC governance proposals.

### 2. Desktop Operating System & Window Manager (`src/app/services/window-manager.service.ts`)
- Manages multi-window desktop sessions with focus stacking, z-index elevation, bounds clamping, snap positioning, minimization, and maximization.
- Persistent draggable desktop icons grid with localStorage persistence and custom right-click context menu.

### 3. Native Federation v4 Orchestrator (`src/app/services/native-federation.service.ts`)
- Dynamic micro-frontend registration, shared singleton dependency pooling, SRI security hashing, and cross-application event bus on `window.__NF_REGISTRY__`.

### 4. Appwrite TablesDB & SDK Generator (`src/app/services/appwrite-database.service.ts`)
- Dedicated and shared cluster management with instant server SDK code generation for 11 runtimes (Node.js, Deno, PHP, Python, Ruby, C#, Dart, Kotlin, Java, Swift, Rust).

---

## 🛠️ Development & Operations

### Quick Start

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run start

# Run Vitest unit tests
npm run test:unit

# Run end-to-end test suites
bun test

# Validate syntax and strict typing
npm run lint

# Compile and verify production build
npm run build
```

---

*ΛΞVOS Core Engineering | The Future Needs Context | Innovate, Automate, Dominate*
