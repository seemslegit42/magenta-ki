# Manifest: ACP Architecture Specification

## Systems & Subsystems

### 1. Audit Trail Subsystem (`AuditService`)
- **Immutability & Forensic Telemetry:** Append-only recording of user interactions, timestamps, roles, categories (`auth`, `filesystem`, `process`, `system`, `rbac`, `wopi`, `database`), and outcome status (`success` | `failure`).
- **Exporting:** Zero-dependency client-side JSON and CSV export formats.
- **Access Control:** Restricted purge mechanism accessible strictly to Administrators with automatic audit logging of the purge attempt.

### 2. Real-Time Notification Center (`NotificationService`)
- **Reactive Signals:** Category dispatching (`security`, `system`, `task`, `message`, `audit`, `database`), unread counter aggregation, and auto-dismissing toast shelf.
- **Granular User Preferences:** Granular toggle filters for priority levels (`low`, `normal`, `high`, `critical`) and categories.

### 3. Role-Based Access Control (`AuthRbacService`)
- **Roles:**
  - `admin`: Superuser authority (`audit:manage`, `gateway:manage`, `database:manage`, `agentfs:snapshot`, etc.).
  - `content_creator`: Authoring and development authority (`wopi:edit`, `database:create`, `database:read`, `gateway:query`, etc.).
  - `general_user`: View-only bounded persona (`audit:read`, `wopi:read`, `agentfs:read`, `database:read`).
- **Dynamic Context Switching:** Instant profile and role swapping with reactive UI recalculations and denial reasoning inspection.

### 4. Appwrite Database Subsystem (`AppwriteDatabaseService`)
- **Database Hierarchy:** Full multi-database management containing isolated tables and typed schemas (`integer`, `string`, `boolean`, `datetime`, `json`, `float`).
- **Infrastructure Architecture:** Shared infrastructure vs. Dedicated NVMe high-performance infrastructure flags.
- **Server SDK Code Generator:** Generates compliant integration code for 11 environments:
  - Node.js (`npm:node-appwrite`)
  - Deno (`npm:node-appwrite`)
  - PHP (`Appwrite\Services\TablesDB`)
  - Python (`appwrite.services.tables_db`)
  - Ruby (`Appwrite::TablesDB`)
  - C# .NET (`Appwrite.Services.TablesDB`)
  - Dart (`dart_appwrite`)
  - Kotlin (`io.appwrite.services.TablesDB`)
  - Java (`io.appwrite.services.TablesDB`)
  - Swift (`Appwrite.TablesDB`)
  - Rust (`appwrite::services::TablesDB`)
- **Interactive Sandbox & Latency Simulator:** Live code testing and HTTP 201 response verification with mock network latency telemetry.

### 5. Bio-Digital & Visual Standards
- **Typography:** Comfortaa (Headings & Logotypes) + Lexend Deca (Body text & UI labels).
- **Living Metaphors:**
  - *The Vein:* Dynamic SVG system load monitor with constriction (<80% healthy Patina Green, >80% hyperventilation Imperial Purple) and jitter error tracking.
  - *The Flow:* Wave SVG liquid transfer container with inverse file size viscosity (fast Roman Aqua vs. slow Patina Green).
- **Sonic Architecture:** Web Audio synth emitting crystal chimes on hover, success, load shifts, and data streaming.
- **BEEP (Sassy Clippy 2.0):** Interactive assistant with three sass levels (`Helpful`, `Spicy`, `Existential Crisis`).
- **Mandatory Signature:** Permanent micro-scale brand mark:
  - Enterprise: ΛΞV Inc
  - Tagline: The Future Needs Context
  - Motto: Innovate, Automate, Dominate

### 6. Application Matrix & Window Orchestration (`AppLauncherComponent`)
- **Matrix Grid**: Categorized system apps and dynamic Native Federation remotes catalog with responsive Roman Glassmorphic tiles.
- **Process Telemetry**: Live inspection of active, minimized, and dormant PIDs with direct focus/restore integration via `WindowManagerService`.
- **Search & Filter Pipeline**: Sub-millisecond reactive filtering across categories (`productivity`, `database`, `security`, `developer`, `ai`, `federated`) with real-time query signals.
- **Decision Tokens**: VIP Roman Glass (`rgba(18, 20, 26, 0.72)`), Comfortaa header hierarchy, Lexend Deca body telemetry, Patina Green (`#3EB991`) primary conversion trigger.

### 7. Polar Usage-Based Billing & Entitlements Engine (`PolarBillingService`)
- **Meters & Filter Clauses**: Event filtering on condition clauses (`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `does_not_contain`) with `and`/`or` conjunctions and unit multipliers (Scalar, Token, Custom).
- **Cost Insights Engine**: Sub-cent precision event cost tracking with 12-decimal micro-cost recording (`_cost: { amount, currency: 'usd' }`) and automatic LLM inference meter linkage.
- **Entitlements & License Vault**: Cryptographic `POLAR_<UUID>` key issuance, multi-device activation tracking, and customer state resolution (`subscriptions`, `benefits`, `customer_meters`).
- **Gateway Proxy Endpoints**: Express `/api/polar/*` routes for event ingestion, hosted checkout session links, and Standard Webhooks verification.

