# ΛΞVOS Developer Guide
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*  
**Applicable Versions:** Angular v22+, Node.js v22+, Native Federation v4

---

## 1. Development Principles & Code Standards

### 1.1 Zoneless Signals & Reactivity
ΛΞVOS is built entirely without `zone.js`. Every state transformation must be driven by Angular Signals:
- **Local State:** Use `signal<T>(initialValue)`.
- **Derived State:** Use `computed(() => ...)`. Keep pure and free of side effects.
- **Synchronized State:** Use `linkedSignal({ source: ..., computation: ... })`.
- **Two-way Bindings:** Use `model<T>()` instead of paired `input()` and `output()`.
- **Signal Mutations:** Always use `.set(newVal)` or `.update(prev => ...)`—never mutate object properties directly.

### 1.2 Strict Prohibitions
1. **NO `zone.js`:** Never import `zone.js` or call `provideZoneChangeDetection()`.
2. **NO `ngModel` / `FormsModule`:** Always use Signal Forms (`@angular/forms/signals`) or Reactive Forms (`FormGroup`, `FormControl`).
3. **NO `@angular/animations`:** Never import `@angular/animations` or `@angular/platform-browser/animations`. Use Tailwind CSS transitions (`transition-all duration-300`) or the vanilla `motion` library.
4. **NO `@HostBinding` / `@HostListener`:** Use the `host` property inside `@Component({ host: { ... } })`.
5. **NO Regex Literals in HTML:** Template expressions cannot contain regular expressions (e.g. `{{ text.replace(/_/g, ' ') }}` is forbidden). Perform all string formatting in the component's TypeScript.
6. **APPEND-ONLY IMPORTS:** Under no circumstances delete, re-order, or remove existing imports in existing files. All new dependencies must be added as additions at the end of the import block.

---

## 2. Authoring a New Desktop Application

Every application in ΛΞVOS is a standalone Angular component that can be launched as a floating window or embedded inside a remote container.

### Step 1: Create the Component
Create your component under `/src/app/components/apps/<app-id>/<app-id>.component.ts`:

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../../services/window-manager.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-my-tool',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-[#14161C] text-[#F5FFFA] p-4 select-none">
      <header class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div class="flex items-center gap-2">
          <mat-icon class="text-[#20B2AA]">memory</mat-icon>
          <h2 class="text-base font-semibold font-display">My Cognitive Tool</h2>
        </div>
        <button 
          (click)="triggerAction()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6A0DAD] hover:bg-[#8B1254] text-xs font-medium text-white transition-all cursor-pointer shadow-sm">
          <mat-icon class="text-sm">bolt</mat-icon>
          <span>Run Task</span>
        </button>
      </header>

      <main class="flex-1 overflow-y-auto space-y-3">
        <div class="p-3 rounded-xl bg-[#1A1C23] border border-white/5">
          <p class="text-xs text-[#8C94A8]">Task execution count: {{ executionCount() }}</p>
        </div>
      </main>
    </div>
  `
})
export class MyToolComponent {
  private readonly notificationService = inject(NotificationService);
  protected readonly executionCount = signal(0);

  triggerAction(): void {
    this.executionCount.update(c => c + 1);
    this.notificationService.notify({
      title: 'Task Executed',
      message: `My Cognitive Tool executed task #${this.executionCount()}`,
      type: 'info'
    });
  }
}
```

### Step 2: Register in `WindowManagerService`
In `/src/app/services/window-manager.service.ts`:
1. Add your application ID to `AppManifest`:
```typescript
{
  id: 'my-tool',
  title: 'My Tool',
  icon: 'memory',
  component: MyToolComponent,
  defaultWidth: 700,
  defaultHeight: 480,
  minWidth: 400,
  minHeight: 300
}
```
2. Update the dynamic component renderer in `WindowComponent` (`src/app/components/window/window.component.ts`) to resolve `<app-my-tool>` when `proc.appId === 'my-tool'`.

### Step 3: Register Desktop Icon & Dock Launcher
- **Desktop Shortcut:** In `DesktopIconsService` (`src/app/services/desktop-icons.service.ts`), register the default shortcut position:
```typescript
{
  id: 'my-tool',
  appId: 'my-tool',
  title: 'My Tool',
  icon: 'memory',
  x: 20,
  y: 420,
  badge: 0
}
```
- **Dock Launcher:** In `DockComponent` (`src/app/components/dock/dock.component.ts`), add the icon to the quick-launch tray if desired.

---

## 3. Micro-Frontend (MFE) Native Federation v4

ΛΞVOS uses `@angular-architects/native-federation` v4.

### 3.1 Host & Remote Federation Configuration
Each federated micro-frontend contains a `federation.config.mjs`:

```javascript
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'remote-analytics',
  exposes: {
    './Component': './src/app/remote-entry.component.ts',
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    }),
  },
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket'
  ]
});
```

### 3.2 Dynamic Remote Consumption
Remote components are dynamically imported using `loadRemoteModule`:

```typescript
import { loadRemoteModule } from '@angular-architects/native-federation';

async function loadAnalytics() {
  const m = await loadRemoteModule({
    remoteEntry: 'https://mfe.lxv.cloud/remoteEntry.json',
    exposedModule: './Component'
  });
  return m.RemoteEntryComponent;
}
```

### 3.3 Cross-MFE Event Bus (`window.__NF_REGISTRY__`)
All micro-frontends share a global, replay-capable event bus initialized on `window.__NF_REGISTRY__`:

```typescript
// Subscribe to cross-MFE events
const sub = window.__NF_REGISTRY__.events.subscribe((event: NFRegistryEvent) => {
  console.log(`[Cross-MFE] Received ${event.type} from ${event.source}:`, event.payload);
});

// Dispatch an event
window.__NF_REGISTRY__.dispatchEvent({
  id: crypto.randomUUID(),
  source: 'my-tool',
  target: '*',
  type: 'DATA_INGESTED',
  timestamp: Date.now(),
  status: 'delivered',
  payload: { records: 42, latencyMs: 12.4 }
});
```

---

## 4. Backend Gateway Architecture (`src/server.ts`)

The backend is an Express server running as Vite middleware in development and as a standalone Node.js production service.

### 4.1 Server-Sent Events (SSE) Telemetry (`/api/telemetry/sse`)
Clients subscribe to continuous system metric updates via an event stream:
- **Connection:** `GET /api/telemetry/sse`
- **Output:** Streams JSON messages every 2 seconds with CPU load, memory RSS/Heap, active processes, and event throughput.

```typescript
// Client-side consumption in TelemetryService
const eventSource = new EventSource('/api/telemetry/sse');
eventSource.onmessage = (event) => {
  const metric = JSON.parse(event.data);
  this.metricsSignal.set(metric);
};
```

### 4.2 Gemini AI Copilot Endpoint (`/api/ai/chat`)
- **Method:** `POST /api/ai/chat`
- **Payload:** `{ prompt: string, model?: string, history?: Message[] }`
- **Response:**
```json
{
  "response": "Autonomous command plan verified.",
  "tokens": { "prompt": 45, "candidates": 120, "total": 165 },
  "cost": {
    "amount": 0.0825,
    "currency": "USD"
  }
}
```

### 4.3 Polar Usage-Based Billing (`/api/polar/*`)
- `POST /api/polar/events/ingest`: Ingests metered telemetry events with cost attributes.
- `GET /api/polar/customer-state/:externalId`: Hydrates subscriptions, granted benefits, and active meters.
- `POST /api/polar/license/validate`: Validates multi-device activation keys.

### 4.4 The $\Xi$ (Xi) Economy Engine (`/api/xi/*`)
- `GET /api/xi/floor`: Fetches the current $Ξ_{Floor}$ rate for compute tokens.
- `POST /api/xi/burn`: Burns Xi tokens to authorize a high-order CogniOps task.
- `POST /api/xi/attribution`: Registers and calculates Proof-of-Attribution yields ($R_{Xi}$).
- `GET /api/xi/proposals`: Lists active Hybrid Pricing & Value Committee (HPVC) proposals.

---

## 5. Testing & Verification

### 5.1 Unit Tests (Vitest)
Unit tests reside in `/tests/unit/*.test.ts`:
```bash
npm run test:unit
```
To run tests with watch mode:
```bash
npx vitest run
```

### 5.2 End-to-End Tests (Bun Test Runner)
E2E workflow test scripts reside in `/tests/e2e/*.e2e.test.ts`:
```bash
bun test
```

### 5.3 Linting & Build Verification
Always verify clean linting and AOT compilation prior to completing features:
```bash
npm run lint
npm run build
```
