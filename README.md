# ΛΞVOS — The Lambda Xi Von Operating System
### **lxvOS** | *The Function. The Unknown. The Machine.*

---

## 🏛️ Architectural Trinity

**ΛΞVOS** (Lambda Xi Von Operating System, or **lxvOS** when restricted to ASCII) is an enterprise-grade cloud operating system and native federation host. It bridges deterministic computation with stochastic intelligence through three foundational pillars:

1. **Lambda (λ) — The Function:** Pure, reactive, stateless computation built on Angular v21+ Signals and immutable state transitions. Every UI mutation and process lifecycle event is modeled as a pure mathematical transformation.
2. **Xi (Ξ) — The Unknown:** Stochastic intelligence and emergent agent workflows powered by Google Gemini APIs, decentralized telemetry meters, and the **Ξ (Xi) Economy** (cogniops pricing, proof-of-attribution rewards, and elastic feature gating).
3. **Von (V) — The Machine:** The Von Neumann architectural homage. Sandboxed process memory spaces, Copy-on-Write AgentFS virtual filesystems, isolated virtual window stack management, and a robust Express/Node.js gateway control plane.

---

## 📂 Repository Structure

```text
/
├── contracts/               # Single source of truth for cross-language schemas & specs
│   ├── openapi/             # REST & Gateway API specifications (webos.v1.yaml)
│   └── sql/                 # Canonical SQLite DDL & migration state
├── data/                    # Local runtime state, scratchpads, and SQLite DB files (gitignored)
├── src/
│   ├── app/                 # Angular Standalone Components & Signal Services
│   │   ├── components/      # Desktop apps (App Store, AgentFS, WOPI Office, Terminal, Gateway, Security)
│   │   ├── models/          # Enterprise TypeScript interfaces & schemas
│   │   └── services/        # Window Manager, Gateway, Billing, RBAC, and Audit services
│   ├── server.ts            # Express Gateway & SSR entry point (AI, Polar billing, Ξ Economy API)
│   └── main.ts / main.server.ts # Client & Server bootstrap modules
├── tests/
│   ├── e2e/                 # End-to-end orchestrator flows (Window management, AgentFS, Gateway mesh)
│   └── unit/                # Unit test suites (Polar billing, Xi Economy, RBAC, Window Manager)
└── angular.json             # Angular CLI & Native Federation build configuration
```

---

## ⚡ Core Subsystems

### 1. Control Plane & Gateway (`src/server.ts`)
The Node.js/Express gateway running on Vite middleware handles:
- **Server-Side Rendering (SSR)** via Angular Node App Engine with trusted proxy validation (`trustProxyHeaders: true`, `allowedHosts: ['*']`).
- **Google Gemini AI Inference** (`/api/ai/chat`) with automatic token estimation and cost insight telemetry (`_cost` in decimal cents).
- **Polar Billing & Metering** (`/api/polar/*`) for usage-based billing events, checkout sessions, customer state hydration, and webhook signature verification.
- **The Ξ (Xi) Economy** (`/api/xi/*`) for calculating dynamic floor costs ($Ξ_{Floor}$), burning tokens for CogniOps execution, executing Proof-of-Attribution ($R_{Xi}$), and managing Hybrid Pricing & Value Committee (HPVC) governance proposals.

### 2. Desktop Operating System & Window Manager (`src/app/services/window-manager.service.ts`)
- Manages multi-window desktop sessions with focus stacking, z-index elevation, snap positioning, minimization, and maximization.
- Supports responsive layouts (mobile/desktop breakpoints) and haptic feedback triggers.

### 3. AgentFS & Virtual File System (`src/app/services/agentfs.service.ts`)
- Sandboxed virtual inode hierarchy with Copy-on-Write (CoW) snapshot identifiers and append-only audit logging for monitored tool executions.

---

## 🛠️ Development & Operations

### Prerequisites & Runtime
- **Node.js**: v22+ (Strict type checking & ESM support)
- **Package Manager**: `npm` / `bun`

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run start

# Run unit and end-to-end test suites
bun test

# Run Vitest unit tests
npm run test:unit

# Compile and verify production build
npm run build
```

---

## 📐 API & Contract Standards

All API boundaries are formally defined in `contracts/openapi/webos.v1.yaml`. Neither the Go/Rust microservices nor the Angular host define ad-hoc endpoints; all payload contracts are strictly governed by the canonical specification.

---

*ΛΞVOS Core Engineering | The Future Needs Context | Innovate, Automate, Dominate*
