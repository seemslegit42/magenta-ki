# ΛΞVOS User Guide
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*  
**Operational Manual:** v2.4

---

## 1. Desktop Interface & Workspace

ΛΞVOS provides a responsive, high-fidelity Cloud Operating System interface rendered in the **Digital Wabi Sabi** aesthetic.

```text
+-----------------------------------------------------------------------------------------+
| [Status Bar]  09:41 AM  ·  Tenant: prod-enterprise-01  ·  Role: [Admin ▾]  ·  🔔 (3)   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [📂 AgentFS]                                       +--------------------------------+  |
|                                                     |  Appwrite Databases            |  |
|  [🌐 Federation]                                    |  ----------------------------  |  |
|                                                     |  Clusters: Dedicated-01        |  |
|  [🏛️ AVF Gov]                                       |  Collections: [users, agents]  |  |
|                                                     |                                |  |
|  [💳 Polar Bill]                                    +--------------------------------+  |
|                                                                                         |
|                         [ Λ Ξ V O S  Watermark Crest ]                                  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
|                     [ 🔍 Search | 📂 | 🌐 | 🏛️ | 💳 | 📑 | 🛡️ | 📈 | 🤖 ]                 |
|                                     [ Floating Dock ]                                   |
+-----------------------------------------------------------------------------------------+
```

### 1.1 Status Bar (Top Header)
- **Clock & Date:** Real-time synchronized clock displaying current UTC/local time.
- **Tenant Badge:** Current active multi-tenant workspace (e.g., `prod-enterprise-01`).
- **Identity & RBAC Switcher:** Click the user role selector in the status bar to immediately switch between **Admin**, **Developer**, **Auditor**, and **Operator**. Permissions and visible capabilities adapt instantaneously across the OS.
- **Notification Drawer:** Click the bell icon (`🔔`) to open the notification tray displaying system events, task updates, and alerts. Clicking individual notifications marks them as read.

### 1.2 Desktop Icons & Shortcuts
- **Selection:** Single-click selects a shortcut. Clicking empty desktop space clears the selection.
- **Launch Application:** Double-click any shortcut icon to launch or focus its window.
- **Drag & Drop Repositioning:** Click and drag any icon to rearrange your desktop. Positions are automatically snapped to the grid and persisted in browser storage.
- **Context Menu:** Right-click anywhere on an icon or the workspace to access:
  - **Open:** Launches the selected application.
  - **Align to Grid:** Organizes all icons into clean columns and rows.
  - **Reset to Default:** Restores the original factory layout.
  - **Toggle Position Lock:** Prevents accidental dragging.
  - **Properties:** Inspects shortcut metadata, target appId, and storage parameters.

### 1.3 Floating Dock (Bottom Center)
- **Application Launchers:** Quick single-click shortcuts to open core enterprise applications.
- **Active Process Indicators:** Applications currently running in the window stack feature an active indicator dot beneath their icon.
- **Minimize & Restore:** Clicking an already open application's dock icon restores or minimizes its window.
- **Beep Copilot Trigger:** The terminal/AI icon launches the embedded Beep Assistant.

### 1.4 Window Chrome & Manipulation
- **Focus Stacking:** Clicking any part of a window brings it to the top of the z-index stack.
- **Dragging:** Drag a window by clicking and holding its top titlebar.
- **Window Controls:**
  - **Minimize (`—`):** Collapses the window into the dock.
  - **Maximize / Restore (`□`):** Toggles between full-workspace view and custom geometry.
  - **Close (`✕`):** Terminates the process and removes its window.

### 1.5 Global Search Spotlight
- **Keyboard Shortcut:** Press `Cmd + K` (macOS) or `Ctrl + K` (Linux/Windows) from anywhere on the desktop.
- **Capabilities:** Search for installed applications, system utilities, settings, and direct execution commands.

---

## 2. Enterprise Applications Catalog

### 2.1 Appwrite Databases (TablesDB)
- **Purpose:** Multi-tenant relational/document edge database management and code generation.
- **Features:**
  - **Cluster Management:** Toggle between *Dedicated Infrastructure* and *Shared Multi-Tenant* clusters.
  - **Schema & Tables Explorer:** Inspect database tables, column types (String, Integer, Float, Boolean, Relationship), indexes, and permissions.
  - **Server SDK Code Generator:** Select any table and generate complete, copy-pasteable server provisioning code in **11 languages** (Node.js, Deno, PHP, Python, Ruby, C#, Dart, Kotlin, Java, Swift, Rust).

### 2.2 Native Federation Studio
- **Purpose:** Micro-frontend (MFE) orchestration, dependency integrity validation, and cross-application messaging.
- **Features:**
  - **Remote Registries:** Inspect active remote applications, manifests (`remoteEntry.json`), and URLs.
  - **Shared Dependency Pooling:** Monitor singleton package shares (`@angular/core`, `rxjs`, `tailwindcss`) and version negotiation.
  - **Subresource Integrity (SRI) Audit:** Real-time hash verification preventing supply-chain script tampering.
  - **Cross-MFE Event Bus:** Live inspector showing all cross-application events dispatched on `window.__NF_REGISTRY__` with an interactive event dispatcher to broadcast custom payloads.

### 2.3 Agentic Value Framework (AVF)
- **Purpose:** Autonomous governance, value flow metrics, and agentic incentive structures.
- **Features:**
  - **Value Alignment Scores:** Monitor agent compliance and autonomous value generation.
  - **Proposal Voting:** Participate in Hybrid Pricing & Value Committee (HPVC) governance votes.
  - **Attribution Ledgers:** Review verified computational contributions and yield distributions.

### 2.4 Polar Usage-Based Billing & Metering
- **Purpose:** Enterprise SaaS billing, consumption telemetry, and customer entitlement management.
- **Features:**
  - **Real-Time Usage Meters:** Monitor consumption aggregations (e.g., `api_calls`, `storage_gb`, `compute_seconds`).
  - **Cost Insights:** Inspect unit economics with decimal-cent accuracy (`_cost`).
  - **License Management:** Validate and activate multi-device license keys.
  - **Customer Portal:** Launch customer checkout sessions and review active tiers.

### 2.5 AgentFS Virtual File System Explorer
- **Purpose:** Sandboxed virtual inode browser and Copy-on-Write (CoW) snapshot manager.
- **Features:**
  - **Directory Navigation:** Browse `/sys`, `/bin`, `/home`, `/agents`, and `/audit` folders.
  - **Snapshot Versioning:** View CoW version snapshots and revert to clean states.
  - **File Viewer & Editor:** Open and edit text, markdown, and JSON files in an integrated editor with instant saving.

### 2.6 WOPI Office Suite
- **Purpose:** Collaborative document viewing and editing via the WOPI protocol.
- **Features:**
  - **Document Types:** Rich editing for documents (`.docx`), spreadsheets (`.xlsx`), and presentations (`.pptx`).
  - **Concurrency Locks:** Live lock token inspection preventing conflicting write collisions during multi-agent collaboration.

### 2.7 Security Audit & RBAC Governance
- **Purpose:** Real-time immutable compliance ledger and access privilege administration.
- **Features:**
  - **Tamper-Evident Ledger:** Chronological record of system operations with cryptographic hash chaining.
  - **Cryptographic Export:** Export audit entries directly to formatted JSON or CSV with verification checksums.
  - **Role Matrix:** Inspect and audit granted permissions across Admin, Developer, Auditor, and Operator personas.

### 2.8 Telemetry & Diagnostics Dashboard
- **Purpose:** Live system observability stream powered by Server-Sent Events (SSE).
- **Features:**
  - **System Gauges:** Real-time Memory RSS, Heap Allocation, CPU utilization, and Network event rates.
  - **Historical Graphs:** Live-updating performance sparklines and latency percentiles.
  - **Event Frequency:** Real-time tracking of message dispatch rates across the OS kernel.

### 2.9 AI Terminal & Beep Assistant
- **Purpose:** Autonomous command execution, natural language diagnostics, and Gemini copilot.
- **Features:**
  - **Shell Emulator:** Run diagnostic commands (`sysinfo`, `agentfs list`, `nf status`, `polar meters`, `clear`).
  - **Gemini Copilot:** Query the system in natural language to perform complex multi-step OS workflows.

### 2.10 Recycle Bin & Trash Purge
- **Purpose:** Centralized, recoverable file and desktop shortcut recycling system.
- **Features:**
  - **Drag-to-Trash:** Drag any desktop icon onto the Recycle Bin to delete it from the desktop canvas with tactile haptic feedback.
  - **File Explorer Integration:** Select any file in AgentFS or WOPI and click *Move to Trash* to safely remove it from active storage.
  - **Dynamic Bin State:** The Recycle Bin icon dynamically toggles between empty (`delete_outline`) and full (`delete`), displaying a live badge with the number of deleted items.
  - **Selective & Global Restoration:** Restore individual shortcuts or files back to their exact original locations, or click *Restore All* to recover the entire bin in one click.
  - **Permanent Deletion & Purge:** Delete individual items forever or click *Empty Recycle Bin* to permanently purge all data with confirmation guards and compliance audit logging.
