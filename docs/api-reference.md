# ΛΞVOS API & Contracts Reference
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*  
**Specification:** OpenAPI v3.1 / WebOS v1.0  
**Canonical File:** `/contracts/openapi/webos.v1.yaml`

---

## 1. REST & SSE Gateway Endpoints (`/api/*`)

All gateway endpoints are exposed by the Node.js / Express control plane (`src/server.ts`).

### 1.1 Real-Time Telemetry SSE Stream
- **Path:** `GET /api/telemetry/sse`
- **Protocol:** Server-Sent Events (`text/event-stream`)
- **Headers:**
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- **Message Interval:** ~2000ms
- **Payload Schema:**
```json
{
  "timestamp": 1730332800000,
  "memory": {
    "rss": 142.5,
    "heapTotal": 98.2,
    "heapUsed": 64.1,
    "unit": "MB"
  },
  "cpu": {
    "user": 12.4,
    "system": 4.2,
    "percent": 16.6
  },
  "processes": {
    "active": 4,
    "total": 12
  },
  "eventsPerSecond": 42.8
}
```

---

### 1.2 Cognitive AI & Copilot
- **Path:** `POST /api/ai/chat`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "prompt": "Analyze AgentFS inode allocation across tenant cluster",
  "model": "gemini-2.5-flash",
  "history": [
    { "role": "user", "text": "Initialize diagnostic scan" },
    { "role": "model", "text": "Scan initialized. Ready for query." }
  ]
}
```
- **Response (200 OK):**
```json
{
  "response": "Inode allocation is optimal. 42 files active across 3 tenants.",
  "tokens": {
    "prompt": 64,
    "candidates": 148,
    "total": 212
  },
  "cost": {
    "amount": 0.0825,
    "currency": "USD"
  }
}
```

---

### 1.3 The $\Xi$ (Xi) Economy Subsystem

#### Dynamic Floor Pricing
- **Path:** `GET /api/xi/floor`
- **Response (200 OK):**
```json
{
  "floorRate": 0.0042,
  "currency": "XI",
  "epoch": 142,
  "factors": {
    "base": 0.001,
    "cpuMultiplier": 1.25,
    "riskMargin": 0.0005
  }
}
```

#### Burn CogniOps Tokens
- **Path:** `POST /api/xi/burn`
- **Request Body:**
```json
{
  "amount": 10.5,
  "operationId": "cogniops-run-8491",
  "tenantId": "prod-enterprise-01"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "burned": 10.5,
  "remainingBalance": 989.5,
  "transactionHash": "0x7f9a8b1c4e2d3f0a"
}
```

#### Proof-of-Attribution Registration
- **Path:** `POST /api/xi/attribution`
- **Request Body:**
```json
{
  "nodeId": "agent-orchestrator-alpha",
  "attributionScore": 0.94,
  "epoch": 142
}
```
- **Response (200 OK):**
```json
{
  "yieldAmount": 47.8,
  "penaltyDeduction": 0.0,
  "netReward": 47.8,
  "status": "confirmed"
}
```

---

### 1.4 Polar Usage Billing & Metering

#### Ingest Meter Event
- **Path:** `POST /api/polar/events/ingest`
- **Request Body:**
```json
{
  "eventName": "agent_execution",
  "customerId": "cust_10928",
  "value": 1,
  "metadata": {
    "action": "cow_snapshot",
    "inode": 1042
  },
  "_cost": {
    "amount": 0.0015,
    "currency": "USD"
  }
}
```
- **Response (200 OK):**
```json
{
  "status": "ingested",
  "eventId": "evt_90842019"
}
```

#### Customer State & Entitlements
- **Path:** `GET /api/polar/customer-state/:externalId`
- **Response (200 OK):**
```json
{
  "externalId": "cust_10928",
  "tier": "enterprise",
  "status": "active",
  "benefits": [
    "unlimited_agentfs_storage",
    "dedicated_appwrite_cluster",
    "priority_gemini_quota"
  ],
  "activeMeters": {
    "agent_execution": { "current": 1420, "limit": 10000 },
    "storage_mb": { "current": 2560, "limit": 50000 }
  }
}
```

#### License Key Validation
- **Path:** `POST /api/polar/license/validate`
- **Request Body:**
```json
{
  "key": "LX-ENT-8849-2026",
  "deviceId": "dev-macbook-pro-m4"
}
```
- **Response (200 OK):**
```json
{
  "valid": true,
  "organization": "Acme Aerospace",
  "maxActivations": 5,
  "currentActivations": 2,
  "expiresAt": "2027-12-31T23:59:59Z"
}
```

---

### 1.5 WOPI Protocol Endpoints

- **Path:** `GET /api/wopi/files/:fileId` (WOPI `CheckFileInfo`)
- **Headers:** `Authorization: Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "BaseFileName": "quarterly-report.docx",
  "Size": 1048576,
  "OwnerId": "admin@lxv.cloud",
  "Version": "v1.4",
  "SupportsLocks": true,
  "UserCanWrite": true
}
```
- **Path:** `POST /api/wopi/files/:fileId`
  - `X-WOPI-Override: LOCK` -> Acquires exclusive lock lease.
  - `X-WOPI-Override: UNLOCK` -> Releases lock lease.
  - `X-WOPI-Override: REFRESH_LOCK` -> Renews existing lock token.

---

## 2. Core Angular Signals Services

| Service | Injection Token | Primary Signals & Methods |
| :--- | :--- | :--- |
| `WindowManagerService` | `WindowManagerService` | `activeProcesses()`, `focusedProcessId()`, `openApp(id)`, `closeProcess(id)`, `focusProcess(id)`, `snapProcess(id, side)` |
| `DesktopIconsService` | `DesktopIconsService` | `shortcuts()`, `selectedId()`, `moveShortcut(id, x, y)`, `alignToGrid()`, `resetToDefault()` |
| `NativeFederationService`| `NativeFederationService` | `remotes()`, `sharedDeps()`, `events()`, `registerRemote(r)`, `auditIntegrity()`, `dispatchEvent(e)` |
| `PolarBillingService` | `PolarBillingService` | `activeMeters()`, `customerState()`, `ingestEvent(evt)`, `validateLicenseKey(key, dev)` |
| `XiEconomyService` | `XiEconomyService` | `floorPrice()`, `balance()`, `proposals()`, `burnTokens(amt)`, `submitAttribution(score)` |
| `AgentFsService` | `AgentFsService` | `inodes()`, `activeSnapshot()`, `createFile(path, content)`, `createSnapshot(name)`, `rollback(id)` |
| `SecurityAuditService` | `SecurityAuditService` | `auditTrail()`, `recordAction(actor, action, payload)`, `exportJson()`, `exportCsv()` |
| `AuthRbacService` | `AuthRbacService` | `currentUser()`, `hasPermission(cap)`, `switchRole(role)` |
| `NotificationService` | `NotificationService` | `notifications()`, `unreadCount()`, `notify({title, message, type})`, `markAsRead(id)` |
| `TelemetryService` | `TelemetryService` | `metrics()`, `history()`, `connectSseStream()` |
