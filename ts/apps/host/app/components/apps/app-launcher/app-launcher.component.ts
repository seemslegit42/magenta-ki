import { Component, ChangeDetectionStrategy, inject, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../../services/window-manager.service';
import { NativeFederationService, RemoteDefinition } from '../../../services/native-federation.service';
import { ProcessDescriptor } from '../../../models/webos.models';

export interface AppLauncherItem {
  id: string;
  name: string;
  category: 'productivity' | 'system' | 'database' | 'security' | 'developer' | 'ai' | 'federated';
  icon: string;
  description: string;
  version: string;
  componentName: string;
  isFederated?: boolean;
  federatedConfig?: unknown;
}

@Component({
  selector: 'app-app-launcher',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full space-y-5 font-['Lexend'] text-[#F5FFFA]">
      <!-- Header & Top Command Telemetry -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 class="font-['Comfortaa'] text-2xl font-bold text-[#F5FFFA] flex items-center space-x-2.5">
            <mat-icon class="text-[#3EB991] text-2xl">apps</mat-icon>
            <span>Application Matrix</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1 font-light">
            Sovereign workspace launcher for system kernels, local tools, and Native Federation micro-frontends.
          </p>
        </div>

        <!-- Telemetry Badges -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
          <div class="px-3 py-1.5 rounded-full bg-[#1A1D24] border border-[#20B2AA]/30 text-[#20B2AA] flex items-center space-x-1.5 font-mono">
            <span class="w-2 h-2 rounded-full bg-[#20B2AA] animate-pulse"></span>
            <span>{{ runningProcessesCount() }} Active Windows</span>
          </div>
          <div class="px-3 py-1.5 rounded-full bg-[#1A1D24] border border-[#3EB991]/30 text-[#3EB991] flex items-center space-x-1.5 font-mono">
            <mat-icon class="text-sm text-[#3EB991]">hub</mat-icon>
            <span>{{ federationService.remotes().length }} Remotes</span>
          </div>
          <div class="px-3 py-1.5 rounded-full bg-[#6A0DAD]/25 border border-[#dfb7ff]/30 text-[#dfb7ff] flex items-center space-x-1 font-mono">
            <span>VIP v2.4</span>
          </div>
        </div>
      </header>

      <!-- Filter Bar: Search + Category Pills -->
      <section aria-label="App Filters" class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#12141A]/80 border border-white/10 rounded-xl p-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94A8] text-sm pointer-events-none">search</mat-icon>
          <input
            type="search"
            [formControl]="searchControl"
            placeholder="Search applications, micro-frontends, or services..."
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0D0E12] border border-white/10 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991] focus:ring-1 focus:ring-[#3EB991]/50 transition-all font-['Lexend']"
          />
        </div>

        <!-- Category Selector -->
        <div class="flex items-center flex-wrap gap-1.5 text-xs">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              class="px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer focus:outline-none"
              [class.bg-[#3EB991]]="selectedCategory() === cat.id"
              [class.text-[#0D0E12]]="selectedCategory() === cat.id"
              [class.border-[#3EB991]]="selectedCategory() === cat.id"
              [class.font-bold]="selectedCategory() === cat.id"
              [class.bg-[#1A1D24]]="selectedCategory() !== cat.id"
              [class.text-[#8C94A8]]="selectedCategory() !== cat.id"
              [class.border-white/10]="selectedCategory() !== cat.id"
              [class.hover:text-[#F5FFFA]]="selectedCategory() !== cat.id"
              [class.hover:border-white/20]="selectedCategory() !== cat.id"
              (click)="selectedCategory.set(cat.id)">
              <mat-icon class="text-xs">{{ cat.icon }}</mat-icon>
              <span>{{ cat.label }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Applications Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        @if (filteredApps().length === 0) {
          <div class="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-white/10 p-6 text-center">
            <mat-icon class="text-3xl text-[#8C94A8] mb-2">search_off</mat-icon>
            <p class="text-sm font-semibold text-[#F5FFFA]">No matching applications found</p>
            <p class="text-xs text-[#8C94A8] mt-1">Try refining your search keyword or switching category filters.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            @for (app of filteredApps(); track app.id) {
              @let procState = getProcessState(app.id);
              <article 
                class="relative flex flex-col justify-between rounded-xl bg-[rgba(18,20,26,0.72)] backdrop-blur-md border border-white/10 hover:border-[#3EB991] p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-[#3EB991]/15 group">
                
                <!-- Card Header -->
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1A1D24] to-[#12141A] border border-white/10 flex items-center justify-center text-[#3EB991] group-hover:scale-105 group-hover:border-[#3EB991]/50 group-hover:shadow-[0_0_12px_rgba(62,185,145,0.3)] transition-all">
                      <mat-icon class="text-xl">{{ app.icon }}</mat-icon>
                    </div>

                    <!-- Category & Status Badge -->
                    <div class="flex flex-col items-end space-y-1">
                      <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border"
                        [class.bg-[#3EB991]/10]="app.category === 'productivity'"
                        [class.text-[#3EB991]]="app.category === 'productivity'"
                        [class.border-[#3EB991]/25]="app.category === 'productivity'"
                        [class.bg-[#20B2AA]/10]="app.category === 'database' || app.category === 'system'"
                        [class.text-[#20B2AA]]="app.category === 'database' || app.category === 'system'"
                        [class.border-[#20B2AA]/25]="app.category === 'database' || app.category === 'system'"
                        [class.bg-[#dfb7ff]/10]="app.category === 'security' || app.category === 'ai'"
                        [class.text-[#dfb7ff]]="app.category === 'security' || app.category === 'ai'"
                        [class.border-[#dfb7ff]/25]="app.category === 'security' || app.category === 'ai'"
                        [class.bg-[#E0218A]/10]="app.category === 'federated' || app.category === 'developer'"
                        [class.text-[#FF2A9D]]="app.category === 'federated' || app.category === 'developer'"
                        [class.border-[#E0218A]/25]="app.category === 'federated' || app.category === 'developer'">
                        {{ app.category }}
                      </span>

                      @if (procState) {
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{{ isProcessMinimized(procState.pid) ? 'MINIMIZED' : 'RUNNING' }}</span>
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Title & Description -->
                  <h3 class="font-['Comfortaa'] font-semibold text-sm text-[#F5FFFA] group-hover:text-[#3EB991] transition-colors flex items-center space-x-1.5">
                    <span>{{ app.name }}</span>
                    @if (app.isFederated) {
                      <span class="text-[9px] font-mono px-1 rounded bg-[#6A0DAD]/30 text-[#dfb7ff] border border-[#dfb7ff]/30">MFE</span>
                    }
                  </h3>
                  <p class="text-xs text-[#8C94A8] mt-1.5 line-clamp-2 leading-relaxed font-light">
                    {{ app.description }}
                  </p>
                </div>

                <!-- Footer with Version & Launch Action -->
                <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span class="text-[10px] font-mono text-[#8C94A8]">{{ app.version }}</span>

                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm focus:outline-none"
                    [class.bg-[#3EB991]]="!procState"
                    [class.text-[#0D0E12]]="!procState"
                    [class.hover:bg-[#52caa1]]="!procState"
                    [class.hover:shadow-[0_0_12px_rgba(62,185,145,0.5)]]="!procState"
                    [class.bg-[#20B2AA]/20]="procState"
                    [class.text-[#20B2AA]]="procState"
                    [class.border]="procState"
                    [class.border-[#20B2AA]/50]="procState"
                    [class.hover:bg-[#20B2AA]/30]="procState"
                    (click)="launch(app)">
                    <mat-icon class="text-sm">{{ procState ? 'visibility' : 'launch' }}</mat-icon>
                    <span>{{ procState ? (isProcessMinimized(procState.pid) ? 'Restore' : 'Bring to Front') : 'Launch' }}</span>
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </div>

      <!-- Bottom Quick Launch Toolbar -->
      <footer class="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C94A8] gap-2">
        <div class="flex items-center space-x-3">
          <span class="flex items-center space-x-1">
            <mat-icon class="text-sm text-[#3EB991]">check_circle</mat-icon>
            <span>Angular 22 Native Federation Host</span>
          </span>
          <span class="hidden sm:inline-block">•</span>
          <span class="hidden sm:inline-block font-mono">Port 3000</span>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-2.5 py-1 rounded bg-[#1A1D24] hover:bg-[#22252F] text-[#F5FFFA] text-[11px] font-mono border border-white/10 flex items-center space-x-1 transition-colors"
            (click)="launchAllEssentials()">
            <mat-icon class="text-xs text-[#20B2AA]">rocket_launch</mat-icon>
            <span>Launch Core Suite</span>
          </button>
        </div>
      </footer>
    </div>
  `
})
export class AppLauncherComponent {
  @Input() pid?: string;

  protected readonly windowManager = inject(WindowManagerService);
  protected readonly federationService = inject(NativeFederationService);

  public readonly searchQuery = signal<string>('');
  public readonly searchControl = new FormControl<string>('', { nonNullable: true });
  public readonly selectedCategory = signal<string>('all');

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
  }

  public readonly categories = [
    { id: 'all', label: 'All', icon: 'grid_view' },
    { id: 'productivity', label: 'Productivity', icon: 'work' },
    { id: 'database', label: 'Databases', icon: 'storage' },
    { id: 'security', label: 'Security & RBAC', icon: 'shield' },
    { id: 'ai', label: 'AI & Copilot', icon: 'psychology' },
    { id: 'developer', label: 'Dev Tools', icon: 'code' },
    { id: 'federated', label: 'Federated MFEs', icon: 'hub' },
  ];

  // Base core catalogue
  private readonly coreApps: AppLauncherItem[] = [
    {
      id: 'chat-window',
      name: 'Sovereign AI Copilot',
      category: 'ai',
      icon: 'chat',
      description: 'Autonomous conversational assistant powered by Blades and Gemini with live streaming typewriter animation.',
      version: 'v1.1.0',
      componentName: 'ChatWindowComponent'
    },
    {
      id: 'agentic-value-framework',
      name: 'Agentic Value Framework (AVF)',
      category: 'ai',
      icon: 'insights',
      description: 'The autonomous enterprise revenue calculus: goal-oriented UAV tracking, compounding intelligence engine, and ROIC analytics.',
      version: 'v1.0.0',
      componentName: 'AgenticValueFrameworkComponent'
    },
    {
      id: 'appwrite-databases',
      name: 'Appwrite Databases & SDK',
      category: 'database',
      icon: 'storage',
      description: 'Multi-tenant database engine, TablesDB schema inspector, and Server SDK code generator for 11 environments.',
      version: 'v2.4.0',
      componentName: 'AppwriteDatabasesComponent'
    },
    {
      id: 'security-audit',
      name: 'Audit Trail & RBAC Sentinel',
      category: 'security',
      icon: 'verified_user',
      description: 'Immutable forensic audit trail, multi-role RBAC access matrix, and cryptographic compliance.',
      version: 'v2.4.0',
      componentName: 'SecurityAuditComponent'
    },
    {
      id: 'agentfs-explorer',
      name: 'AgentFS VFS Explorer',
      category: 'developer',
      icon: 'folder_special',
      description: 'SQLite/OPFS virtual filesystem inspector, inode mapping, and CoW sandbox execution.',
      version: 'v2.4.0',
      componentName: 'AgentFsExplorerComponent'
    },
    {
      id: 'wopi-office',
      name: 'WOPI Office Suite',
      category: 'productivity',
      icon: 'description',
      description: 'Collaborative document, spreadsheet, and slide editor with real-time locks and CheckFileInfo protocol.',
      version: 'v2026.4',
      componentName: 'WopiOfficeComponent'
    },
    {
      id: 'gateway-console',
      name: 'Control Plane & Gateway',
      category: 'system',
      icon: 'dns',
      description: 'Go API gateway orchestrator, Appwrite IAM token verification, and per-tenant libSQL routing.',
      version: 'v1.8.2',
      componentName: 'GatewayConsoleComponent'
    },
    {
      id: 'terminal',
      name: 'WebOS AI Copilot & Terminal',
      category: 'ai',
      icon: 'terminal',
      description: 'Interactive CLI shell and Gemini AI assistant for running automated enterprise operations.',
      version: 'v3.0.1',
      componentName: 'TerminalComponent'
    },
    {
      id: 'app-store',
      name: 'Verdigris App Store',
      category: 'system',
      icon: 'storefront',
      description: 'Dynamic micro-frontend marketplace, W3C import map manager, and remote component registration.',
      version: 'v2.4.0',
      componentName: 'AppStoreComponent'
    },
    {
      id: 'native-federation',
      name: 'Native Federation Studio',
      category: 'developer',
      icon: 'hub',
      description: 'Manage remote micro-frontends, probe endpoints, and inspect Angular ApplicationBuilder federation chunks.',
      version: 'v22.2.0',
      componentName: 'RemoteContainerComponent'
    },
    {
      id: 'settings',
      name: 'Verdigris System Settings',
      category: 'system',
      icon: 'settings',
      description: 'Configure syncopated UI rhythm cadence, window boundaries, audio synthesizer, and haptic feedback.',
      version: 'v2.4.0',
      componentName: 'SettingsComponent'
    }
  ];

  // Combined apps including dynamic remotes from NativeFederationService
  public readonly allApps = computed<AppLauncherItem[]>(() => {
    const remotes = this.federationService.remotes();
    const federatedItems: AppLauncherItem[] = remotes.map((rem: RemoteDefinition) => ({
      id: `remote-${rem.name}`,
      name: rem.name.replace(/^remote-/, '').toUpperCase() + ' (Micro-Frontend)',
      category: rem.name.includes('copilot') ? 'ai' : 'federated',
      icon: rem.name.includes('analytics') ? 'insights' : (rem.name.includes('copilot') ? 'psychology' : 'layers'),
      description: rem.description || `Dynamic Native Federation remote micro-frontend served from ${rem.url}`,
      version: rem.version || 'v1.0.0',
      componentName: 'RemoteContainerComponent',
      isFederated: true,
      federatedConfig: { url: rem.url, exposedModule: rem.exposedModule }
    }));

    return [...this.coreApps, ...federatedItems];
  });

  // Filtered applications based on category and search query
  public readonly filteredApps = computed<AppLauncherItem[]>(() => {
    const list = this.allApps();
    const category = this.selectedCategory();
    const search = this.searchQuery().trim().toLowerCase();

    return list.filter(item => {
      const matchCat = category === 'all' || item.category === category;
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
  });

  public readonly runningProcessesCount = computed(() => {
    return this.windowManager.processes().filter(p => p.isOpen).length;
  });

  public getProcessState(appId: string): ProcessDescriptor | undefined {
    return this.windowManager.processes().find(
      p => p.isOpen && (p.appId === appId || p.pid === `proc_${appId}` || p.pid === appId)
    );
  }

  public isProcessMinimized(pid: string): boolean {
    const bounds = this.windowManager.getBounds(pid);
    return bounds ? bounds.isMinimized : false;
  }

  public launch(app: AppLauncherItem): void {
    const existing = this.getProcessState(app.id);
    if (existing) {
      if (this.isProcessMinimized(existing.pid)) {
        this.windowManager.restoreWindow(existing.pid);
      }
      this.windowManager.focusWindow(existing.pid);
      return;
    }

    this.windowManager.openApp({
      id: app.id,
      name: app.name,
      title: app.name,
      icon: app.icon,
      componentName: app.componentName,
      entryComponent: app.componentName,
      category: app.category,
      isFederated: app.isFederated,
      federatedConfig: app.federatedConfig
    });
  }

  public launchAllEssentials(): void {
    const essentials = ['terminal', 'appwrite-databases', 'wopi-office'];
    for (const id of essentials) {
      const found = this.allApps().find(a => a.id === id);
      if (found) {
        this.launch(found);
      }
    }
  }
}
