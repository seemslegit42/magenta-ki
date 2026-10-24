import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { form, FormField, pattern, required } from '@angular/forms/signals';
import { WindowManagerService } from '../../../services/window-manager.service';
import { NativeFederationService, RemoteDefinition } from '../../../services/native-federation.service';

@Component({
  selector: 'app-app-store',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  template: `
    <div class="space-y-6">
      @if (embedded()) {
        <p class="text-[11px] text-on-surface-variant font-mono border border-outline/12 rounded-lg px-3 py-2 bg-surface-container/50">
          Install from the core catalog, manage <strong class="text-secondary font-semibold">Dynamic Remotes</strong> (replaces Federation Studio), or register new MFE endpoints.
        </p>
      } @else {
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div>
            <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
              <span class="material-icons text-magenta">storefront</span>
              <span>Catalog &amp; extensions</span>
            </h2>
            <p class="text-xs text-on-surface-variant mt-1">Discover modules, federation remotes, and registration.</p>
          </div>
        </div>
      }

      <!-- Navigation Tabs -->
      <div class="flex items-center space-x-2 border-b border-white/10 pb-2 text-xs font-mono">
        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-primary]="activeTab() === 'catalog'"
          [class.text-white]="activeTab() === 'catalog'"
          [class.text-on-surface-variant]="activeTab() !== 'catalog'"
          [class.hover:bg-white/5]="activeTab() !== 'catalog'"
          (click)="activeTab.set('catalog')">
          <span class="material-icons text-sm">apps</span>
          <span>Core Catalog ({{ catalog.length }})</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-primary]="activeTab() === 'remotes'"
          [class.text-white]="activeTab() === 'remotes'"
          [class.text-on-surface-variant]="activeTab() !== 'remotes'"
          [class.hover:bg-white/5]="activeTab() !== 'remotes'"
          (click)="activeTab.set('remotes')">
          <span class="material-icons text-sm">hub</span>
          <span>Dynamic Remotes ({{ federationService.remotes().length }})</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-primary]="activeTab() === 'manifest'"
          [class.text-white]="activeTab() === 'manifest'"
          [class.text-on-surface-variant]="activeTab() !== 'manifest'"
          [class.hover:bg-white/5]="activeTab() !== 'manifest'"
          (click)="activeTab.set('manifest')">
          <span class="material-icons text-sm">integration_instructions</span>
          <span>Manifest Pipeline</span>
        </button>

        <button
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          [class.bg-primary]="activeTab() === 'register'"
          [class.text-white]="activeTab() === 'register'"
          [class.text-on-surface-variant]="activeTab() !== 'register'"
          [class.hover:bg-white/5]="activeTab() !== 'register'"
          (click)="activeTab.set('register')">
          <span class="material-icons text-sm">add_link</span>
          <span>Register Remote</span>
        </button>
      </div>

      <!-- Tab 1: Core Catalog -->
      @if (activeTab() === 'catalog') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (app of catalog; track app.id) {
            <div class="bg-surface-panel border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-magenta/50 transition-all group">
              <div>
                <div class="flex items-start justify-between mb-3">
                  <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-magenta-glow group-hover:bg-magenta/20 transition-colors">
                    <span class="material-icons text-2xl">{{ app.icon }}</span>
                  </div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">
                    {{ app.sandboxType }}
                  </span>
                </div>
                <h3 class="font-display font-semibold text-white text-sm">{{ app.name }}</h3>
                <p class="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{{ app.description }}</p>
              </div>

              <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span class="text-[11px] font-mono text-secondary">{{ app.version }}</span>
                <button
                  class="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-magenta text-white text-xs font-medium transition-colors flex items-center space-x-1 shadow-md"
                  (click)="launchApp(app)">
                  <span class="material-icons text-xs">play_arrow</span>
                  <span>Launch</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Tab 2: Dynamic Remote Micro-Frontends -->
      @if (activeTab() === 'remotes') {
        <div class="space-y-4">
          <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <h4 class="text-xs font-semibold text-white font-display">Native Federation Runtime Remotes</h4>
              <p class="text-[11px] text-on-surface-variant mt-0.5 font-mono">Dynamic remote entries registered in public/federation.manifest.json</p>
            </div>
            <button
              class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors flex items-center space-x-1"
              (click)="federationService.refreshManifest()">
              <span class="material-icons text-xs">refresh</span>
              <span>Sync Manifest</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (remote of federationService.remotes(); track remote.name) {
              <div class="bg-surface-panel border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-secondary/50 transition-all">
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 rounded-xl bg-primary/30 border border-primary/50 flex items-center justify-center text-secondary">
                      <span class="material-icons text-2xl">layers</span>
                    </div>
                    <span 
                      class="text-[10px] font-mono px-2 py-0.5 rounded border"
                      [class.bg-tertiary/20]="remote.status === 'ONLINE'"
                      [class.text-tertiary]="remote.status === 'ONLINE'"
                      [class.border-tertiary/40]="remote.status === 'ONLINE'"
                      [class.bg-primary/20]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                      [class.text-secondary]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                      [class.border-secondary/30]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                      [class.bg-rose-500/20]="remote.status === 'ERROR'"
                      [class.text-rose-400]="remote.status === 'ERROR'"
                      [class.border-rose-500/30]="remote.status === 'ERROR'">
                      {{ remote.status }}
                      @if (remote.latencyMs) {
                        <span>({{ remote.latencyMs }}ms)</span>
                      }
                    </span>
                  </div>
                  <h3 class="font-display font-semibold text-white text-sm">{{ remote.name }}</h3>
                  <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ remote.description }}</p>
                  
                  <div class="mt-3 p-2 rounded bg-black/30 border border-white/5 font-mono text-[10px] text-secondary truncate" [title]="remote.url">
                    URI: {{ remote.url }}
                  </div>
                </div>

                <div class="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-mono border border-white/10 transition-colors flex items-center space-x-1"
                    (click)="probeRemote(remote)">
                    <span class="material-icons text-xs">network_check</span>
                    <span>Probe</span>
                  </button>

                  <button
                    class="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-magenta text-white text-xs font-medium transition-colors flex items-center space-x-1 shadow-md"
                    (click)="launchRemote(remote)">
                    <span class="material-icons text-xs">open_in_new</span>
                    <span>Mount MFE</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tab 3: Manifest Pipeline -->
      @if (activeTab() === 'manifest') {
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Left: Manifest JSON -->
            <div class="bg-surface-panel border border-white/10 rounded-xl p-4">
              <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span class="text-xs font-mono font-semibold text-white flex items-center space-x-1.5">
                  <span class="material-icons text-sm text-secondary">description</span>
                  <span>public/federation.manifest.json</span>
                </span>
                <span class="text-[10px] font-mono text-tertiary">Active Manifest</span>
              </div>
              <pre class="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-xs text-on-surface overflow-x-auto leading-relaxed">{{ manifestJson() }}</pre>
            </div>

            <!-- Right: Config & Shared Packages -->
            <div class="bg-surface-panel border border-white/10 rounded-xl p-4 space-y-3">
              <div class="border-b border-white/10 pb-2">
                <span class="text-xs font-mono font-semibold text-white flex items-center space-x-1.5">
                  <span class="material-icons text-sm text-magenta">tune</span>
                  <span>federation.config.mjs Specifications</span>
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between p-2 rounded bg-white/5">
                  <span class="text-on-surface-variant font-mono">Builder Adapter</span>
                  <span class="text-tertiary font-mono font-semibold">&#64;angular-architects/native-federation:build</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-white/5">
                  <span class="text-on-surface-variant font-mono">Shared Core</span>
                  <span class="text-secondary font-mono font-semibold">&#64;angular/core (singleton, strictVersion)</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-white/5">
                  <span class="text-on-surface-variant font-mono">Chunk Strategy</span>
                  <span class="text-white font-mono">denseChunking: true</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-white/5">
                  <span class="text-on-surface-variant font-mono">Import Engine</span>
                  <span class="text-magenta-glow font-mono">W3C Native Import Maps / es-module-shims</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab 4: Register Custom Dynamic Remote -->
      @if (activeTab() === 'register') {
        <div class="bg-surface-panel border border-white/10 rounded-xl p-6 max-w-xl mx-auto">
          <div class="border-b border-white/10 pb-3 mb-4">
            <h3 class="font-display font-semibold text-sm text-white">Register Dynamic Micro-Frontend</h3>
            <p class="text-xs text-on-surface-variant mt-0.5">Dynamically add and resolve remote modules without rebuilding the host.</p>
          </div>

          <form (submit)="$event.preventDefault(); submitNewRemote()" class="space-y-4">
            <div>
              <label for="remote-mfe-name" class="block text-xs font-mono text-on-surface-variant mb-1">Remote Package Name</label>
              <input
                id="remote-mfe-name"
                type="text"
                [formField]="remoteForm.name"
                placeholder="e.g. mfe-crm, billing-portal"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="remote-mfe-url" class="block text-xs font-mono text-on-surface-variant mb-1">Remote Entry URL</label>
              <input
                id="remote-mfe-url"
                type="text"
                [formField]="remoteForm.url"
                placeholder="e.g. http://localhost:3005/remoteEntry.json"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="remote-mfe-exposed" class="block text-xs font-mono text-on-surface-variant mb-1">Exposed Module Key</label>
              <input
                id="remote-mfe-exposed"
                type="text"
                [formField]="remoteForm.exposedModule"
                placeholder="./Component"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="remote-mfe-desc" class="block text-xs font-mono text-on-surface-variant mb-1">Description</label>
              <input
                id="remote-mfe-desc"
                type="text"
                [formField]="remoteForm.description"
                placeholder="Brief description of the remote application..."
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-secondary" />
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="submit"
                [disabled]="!remoteForm().valid()"
                class="px-4 py-2 rounded-lg bg-primary hover:bg-magenta disabled:opacity-40 disabled:hover:bg-primary text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-md">
                <span class="material-icons text-sm">add_circle</span>
                <span>Register Remote MFE</span>
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AppStoreComponent {
  readonly pid = input.required<string>();
  /** When nested inside Applications hub, omit duplicate page chrome. */
  readonly embedded = input(false);
  private windowMgr = inject(WindowManagerService);
  protected federationService = inject(NativeFederationService);

  readonly activeTab = signal<'catalog' | 'remotes' | 'manifest' | 'register'>('catalog');

  readonly remoteModel = signal({
    name: '',
    url: '',
    exposedModule: './Component',
    description: 'Dynamic Remote Micro-Frontend',
  });

  readonly remoteForm = form(this.remoteModel, (p) => {
    required(p.name, { message: 'Name is required' });
    pattern(p.name, /^[a-zA-Z0-9_-]+$/, { message: 'Use letters, numbers, _ or -' });
    required(p.url, { message: 'URL is required' });
    required(p.exposedModule, { message: 'Exposed module is required' });
  });

  readonly manifestJson = signal<string>(JSON.stringify({
    "remote-analytics": "http://localhost:3001/remoteEntry.json",
    "remote-copilot": "http://localhost:3002/remoteEntry.json",
    "remote-wopi-editor": "http://localhost:3003/remoteEntry.json"
  }, null, 2));

  protected catalog = [
    {
      id: 'appwrite-databases',
      name: 'Appwrite Databases & SDK',
      description: 'Enterprise multi-tenant database manager, TablesDB schema inspector, and Server SDK code generator for 11 runtimes.',
      icon: 'storage',
      component: 'AppwriteDatabasesComponent',
      sandboxType: 'TablesDB Service',
      version: 'v2.4.0'
    },
    {
      id: 'security-audit',
      name: 'Audit Trail & RBAC Sentinel',
      description: 'Immutable security audit trail, multi-role RBAC access matrix, and cryptographic compliance.',
      icon: 'verified_user',
      component: 'SecurityAuditComponent',
      sandboxType: 'Security Kernel',
      version: 'v2.4.0'
    },
    {
      id: 'agent-fs',
      name: 'AgentFS VFS Explorer',
      description: 'SQLite/OPFS virtual filesystem inspector, inode mapping, and CoW sandbox execution.',
      icon: 'folder_special',
      component: 'AgentFsExplorerComponent',
      sandboxType: 'Direct ESM Injection',
      version: 'v2.4.0'
    },
    {
      id: 'wopi-office',
      name: 'WOPI Office Suite',
      description: 'Collaborative document, spreadsheet, and slide editor with real-time locks and CheckFileInfo.',
      icon: 'description',
      component: 'WopiOfficeComponent',
      sandboxType: 'OnlyOffice Federation',
      version: 'v2026.4'
    },
    {
      id: 'gateway',
      name: 'Control Plane & Turso DB',
      description: 'Go API gateway orchestrator, Appwrite IAM token verification, and per-tenant libSQL routing.',
      icon: 'dns',
      component: 'GatewayConsoleComponent',
      sandboxType: 'Secure Edge Mesh',
      version: 'v1.8.2'
    },
    {
      id: 'terminal',
      name: 'Terminal & Copilot',
      description: 'Interactive CLI shell and Gemini AI assistant for running automated enterprise scripts.',
      icon: 'terminal',
      component: 'TerminalComponent',
      sandboxType: 'Sandboxed Worker',
      version: 'v3.0.1'
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure preferences, windows, and security.',
      icon: 'settings',
      component: 'SettingsComponent',
      sandboxType: 'Host Kernel',
      version: 'v2.4'
    }
  ];

  public launchApp(app: { id: string; name: string; icon: string; component: string; category?: string }): void {
    this.windowMgr.spawnProcess(app.id, app.name, app.icon, app.component, 'productivity');
  }

  public launchRemote(remote: RemoteDefinition): void {
    this.federationService.addLog(`[AppStore] Spawning micro-frontend process '${remote.name}'`);
    this.windowMgr.spawnProcess(
      `remote-${remote.name}`,
      `MFE: ${remote.name}`,
      'layers',
      'RemoteContainerComponent',
      'productivity'
    );
  }

  public async probeRemote(remote: RemoteDefinition): Promise<void> {
    await this.federationService.probeRemote(remote);
  }

  submitNewRemote(): void {
    if (!this.remoteForm().valid()) return;
    const { name, url, exposedModule, description } = this.remoteModel();
    if (!name || !url) return;
    this.federationService.registerDynamicRemote(
      name,
      url,
      exposedModule || './Component',
      description || '',
    );
    this.remoteModel.set({
      name: '',
      url: '',
      exposedModule: './Component',
      description: 'Dynamic Remote Micro-Frontend',
    });
    this.activeTab.set('remotes');
  }
}

