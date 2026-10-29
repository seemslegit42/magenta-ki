import { Component, ChangeDetectionStrategy, inject, signal, computed, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../../services/window-manager.service';
import { NativeFederationService, RemoteDefinition } from '../../../services/native-federation.service';
import { ProcessDescriptor } from '../../../models/webos.models';
import { AppHubService, AppHubPanel } from '../../../services/app-hub.service';
import { DockRegistryService, DockPinnedApp } from '../../../services/dock-registry.service';

export interface AppLauncherItem {
  id: string;
  name: string;
  category: 'productivity' | 'system' | 'database' | 'security' | 'developer' | 'ai' | 'federated';
  icon: string;
  description: string;
  version: string;
  componentName: string;
  architecture?: string;
  isFederated?: boolean;
  federatedConfig?: unknown;
}

@Component({
  selector: 'app-app-launcher',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full space-y-4 font-body text-on-surface p-1">
      <!-- Catalog Header & Control Plane Telemetry -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-white/10 gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-on-surface flex items-center space-x-2.5">
            <mat-icon class="text-secondary text-2xl">store</mat-icon>
            <span>Application Catalog &amp; MFE Hub</span>
          </h2>
          <p class="text-xs text-on-surface-variant mt-0.5 font-light">
            System-wide catalog to discover, install, and configure native tools and Native Federation micro-frontends onto your Dock taskbar.
          </p>
        </div>

        <!-- Telemetry Badges -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
          <div class="px-3 py-1.5 rounded-full bg-surface-container border border-tertiary/30 text-tertiary flex items-center space-x-1.5 font-mono shadow-xs">
            <mat-icon class="text-sm">push_pin</mat-icon>
            <span>{{ dockRegistry.pinnedCount() }} Pinned to Dock</span>
          </div>
          <div class="px-3 py-1.5 rounded-full bg-surface-container border border-secondary/30 text-secondary flex items-center space-x-1.5 font-mono shadow-xs">
            <mat-icon class="text-sm">hub</mat-icon>
            <span>{{ federationService.remotes().length }} Dynamic Remotes</span>
          </div>
          <div class="px-3 py-1.5 rounded-full bg-surface-container border border-outline/20 text-on-surface-variant flex items-center space-x-1 font-mono shadow-xs">
            <span>{{ allApps().length }} Total Modules</span>
          </div>
        </div>
      </header>

      <!-- Navigation Tabs for Catalog Sections -->
      <nav aria-label="Catalog Navigation" class="flex flex-wrap gap-1.5 text-xs border-b border-outline/12 pb-2" role="tablist">
        <button
          type="button"
          role="tab"
          id="catalog-tab-all"
          aria-controls="catalog-panel-all"
          [attr.aria-selected]="activeTab() === 'catalog'"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/50 flex items-center space-x-1.5 cursor-pointer"
          [class.bg-secondary]="activeTab() === 'catalog'"
          [class.text-surface-lowest]="activeTab() === 'catalog'"
          [class.bg-surface-container]="activeTab() !== 'catalog'"
          [class.text-on-surface-variant]="activeTab() !== 'catalog'"
          (click)="activeTab.set('catalog')">
          <mat-icon class="text-sm">category</mat-icon>
          <span>Available Applications ({{ allApps().length }})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="catalog-tab-remotes"
          aria-controls="catalog-panel-remotes"
          [attr.aria-selected]="activeTab() === 'remotes'"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/50 flex items-center space-x-1.5 cursor-pointer"
          [class.bg-tertiary]="activeTab() === 'remotes'"
          [class.text-surface-lowest]="activeTab() === 'remotes'"
          [class.bg-surface-container]="activeTab() !== 'remotes'"
          [class.text-on-surface-variant]="activeTab() !== 'remotes'"
          (click)="activeTab.set('remotes')">
          <mat-icon class="text-sm">hub</mat-icon>
          <span>Dynamic Micro-Frontends ({{ federationService.remotes().length }})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="catalog-tab-pinned"
          aria-controls="catalog-panel-pinned"
          [attr.aria-selected]="activeTab() === 'pinned'"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-magenta/50 flex items-center space-x-1.5 cursor-pointer"
          [class.bg-magenta]="activeTab() === 'pinned'"
          [class.text-white]="activeTab() === 'pinned'"
          [class.bg-surface-container]="activeTab() !== 'pinned'"
          [class.text-on-surface-variant]="activeTab() !== 'pinned'"
          (click)="activeTab.set('pinned')">
          <mat-icon class="text-sm">push_pin</mat-icon>
          <span>Dock Taskbar Items ({{ dockRegistry.pinnedCount() }})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="catalog-tab-register"
          aria-controls="catalog-panel-register"
          [attr.aria-selected]="activeTab() === 'register'"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/50 flex items-center space-x-1.5 cursor-pointer"
          [class.bg-primary]="activeTab() === 'register'"
          [class.text-white]="activeTab() === 'register'"
          [class.bg-surface-container]="activeTab() !== 'register'"
          [class.text-on-surface-variant]="activeTab() !== 'register'"
          (click)="activeTab.set('register')">
          <mat-icon class="text-sm">add_link</mat-icon>
          <span>Register Remote MFE</span>
        </button>
      </nav>

      <!-- Tab 1: Available Applications & Modules -->
      @if (activeTab() === 'catalog') {
        <div id="catalog-panel-all" role="tabpanel" aria-labelledby="catalog-tab-all" class="flex flex-col flex-1 min-h-0 gap-4">
          <!-- Search & Filter Bar -->
          <section aria-label="Catalog Filters" class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-deep/80 border border-white/10 rounded-xl p-3 shadow-sm">
            <div class="relative flex-1">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">search</mat-icon>
              <input
                type="search"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                placeholder="Search catalog modules, enterprise services, micro-frontends..."
                class="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-lowest border border-white/10 text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all font-body"
              />
            </div>

            <div class="flex items-center flex-wrap gap-1.5 text-xs">
              @for (cat of categories; track cat.id) {
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer focus:outline-none"
                  [class.bg-secondary]="selectedCategory() === cat.id"
                  [class.text-surface-lowest]="selectedCategory() === cat.id"
                  [class.border-secondary]="selectedCategory() === cat.id"
                  [class.font-bold]="selectedCategory() === cat.id"
                  [class.bg-surface-container]="selectedCategory() !== cat.id"
                  [class.text-on-surface-variant]="selectedCategory() !== cat.id"
                  [class.border-white/10]="selectedCategory() !== cat.id"
                  [class.hover:text-on-surface]="selectedCategory() !== cat.id"
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
                <mat-icon class="text-3xl text-on-surface-variant mb-2">search_off</mat-icon>
                <p class="text-sm font-semibold text-on-surface">No matching catalog items found</p>
                <p class="text-xs text-on-surface-variant mt-1">Try another search keyword or switch category filters.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                @for (app of filteredApps(); track app.id) {
                  @let isPinned = dockRegistry.isPinned(app.id);
                  @let isRunning = dockRegistry.isAppRunning(app.id);
                  <article 
                    class="relative flex flex-col justify-between rounded-xl bg-[rgba(18,20,26,0.72)] backdrop-blur-md border p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-md group"
                    [class.border-secondary/40]="isPinned"
                    [class.border-white/10]="!isPinned"
                    [class.hover:border-secondary]="!isPinned">
                    
                    <div>
                      <div class="flex items-start justify-between mb-3">
                        <div class="w-11 h-11 rounded-xl bg-linear-to-br from-surface-container to-surface-deep border border-white/10 flex items-center justify-center text-secondary group-hover:scale-105 group-hover:border-secondary/50 group-hover:shadow-[0_0_12px_rgba(32,178,170,0.3)] transition-all">
                          <mat-icon class="text-xl">{{ app.icon }}</mat-icon>
                        </div>

                        <div class="flex flex-col items-end space-y-1">
                          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/25">
                            {{ app.category }}
                          </span>

                          @if (isPinned) {
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>PINNED TO DOCK</span>
                            </span>
                          }
                          @if (isRunning) {
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 flex items-center space-x-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                              <span>RUNNING</span>
                            </span>
                          }
                        </div>
                      </div>

                      <h3 class="font-display font-semibold text-sm text-on-surface group-hover:text-secondary transition-colors flex items-center space-x-1.5">
                        <span>{{ app.name }}</span>
                        @if (app.isFederated) {
                          <span class="text-[9px] font-mono px-1 rounded bg-primary/30 text-primary-muted border border-primary-muted/30">MFE</span>
                        }
                      </h3>
                      <p class="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed font-light">
                        {{ app.description }}
                      </p>
                      @if (app.architecture) {
                        <p class="text-[10px] font-mono text-tertiary mt-2">Architecture: {{ app.architecture }}</p>
                      }
                    </div>

                    <!-- Footer: Version & Install / Dock Management Actions -->
                    <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <span class="text-[10px] font-mono text-on-surface-variant">{{ app.version }}</span>

                      <div class="flex items-center space-x-1.5">
                        @if (!isPinned) {
                          <!-- Install to Dock Button -->
                          <button
                            type="button"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs bg-secondary text-surface-lowest hover:bg-secondary/90 hover:shadow-[0_0_12px_rgba(32,178,170,0.5)] focus:outline-none"
                            (click)="installToDock(app)"
                            title="Install this application and pin to Dock for quick access">
                            <mat-icon class="text-sm">push_pin</mat-icon>
                            <span>Install to Dock</span>
                          </button>
                        } @else {
                          <!-- Unpin from Dock Button -->
                          <button
                            type="button"
                            class="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer bg-white/5 hover:bg-rose-500/20 text-on-surface-variant hover:text-rose-400 border border-white/10 hover:border-rose-500/40 focus:outline-none"
                            (click)="dockRegistry.unpinApp(app.id)"
                            title="Remove quick-access entry from Dock taskbar">
                            <mat-icon class="text-sm">remove_circle_outline</mat-icon>
                            <span>Unpin</span>
                          </button>

                          <!-- Launch / Focus Button -->
                          <button
                            type="button"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer bg-tertiary text-surface-lowest hover:bg-tertiary/90 shadow-xs focus:outline-none"
                            (click)="launch(app)">
                            <mat-icon class="text-sm">open_in_new</mat-icon>
                            <span>Open</span>
                          </button>
                        }
                      </div>
                    </div>
                  </article>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Tab 2: Dynamic Micro-Frontends (MFEs) -->
      @if (activeTab() === 'remotes') {
        <div id="catalog-panel-remotes" role="tabpanel" aria-labelledby="catalog-tab-remotes" class="flex flex-col flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
          <div class="p-4 rounded-xl bg-surface-container/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-xs font-semibold text-on-surface font-display">Native Federation Runtime Remotes</h4>
              <p class="text-[11px] text-on-surface-variant mt-0.5 font-mono">Dynamic micro-frontends discovered via W3C Import Maps and federation manifest</p>
            </div>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-high border border-outline/20 text-on-surface text-xs font-mono transition-colors flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              (click)="federationService.refreshManifest()">
              <mat-icon class="text-sm text-secondary">refresh</mat-icon>
              <span>Sync Manifest</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (remote of federationService.remotes(); track remote.name) {
              @let isMfePinned = dockRegistry.isPinned('remote-' + remote.name);
              <article class="bg-surface-panel border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-secondary/50 transition-all shadow-md">
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 rounded-xl bg-primary/25 border border-primary/40 flex items-center justify-center text-secondary">
                      <mat-icon class="text-2xl">layers</mat-icon>
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

                  <h3 class="font-display font-semibold text-on-surface text-sm">{{ remote.name }}</h3>
                  <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ remote.description }}</p>
                  
                  <div class="mt-3 p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-secondary truncate" [title]="remote.url">
                    URI: {{ remote.url }}
                  </div>
                </div>

                <div class="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface text-[11px] font-mono border border-white/10 transition-colors flex items-center space-x-1 cursor-pointer"
                    (click)="probeRemote(remote)">
                    <mat-icon class="text-xs text-secondary">network_check</mat-icon>
                    <span>Probe</span>
                  </button>

                  <div class="flex items-center space-x-1.5">
                    @if (!isMfePinned) {
                      <button
                        type="button"
                        class="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-secondary/20 text-secondary border border-secondary/30 text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                        (click)="installRemoteToDock(remote)"
                        title="Pin this micro-frontend to Dock">
                        <mat-icon class="text-xs">push_pin</mat-icon>
                        <span>Pin to Dock</span>
                      </button>
                    } @else {
                      <button
                        type="button"
                        class="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                        (click)="dockRegistry.unpinApp('remote-' + remote.name)">
                        <mat-icon class="text-xs">close</mat-icon>
                        <span>Unpin</span>
                      </button>
                    }

                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-surface-lowest text-xs font-semibold transition-colors flex items-center space-x-1 shadow-md cursor-pointer"
                      (click)="launchRemote(remote)">
                      <mat-icon class="text-xs">open_in_new</mat-icon>
                      <span>Mount MFE</span>
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      }

      <!-- Tab 3: Pinned Dock Items Management -->
      @if (activeTab() === 'pinned') {
        <div id="catalog-panel-pinned" role="tabpanel" aria-labelledby="catalog-tab-pinned" class="flex flex-col flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
          <div class="p-4 rounded-xl bg-surface-container/60 border border-white/10 flex items-center justify-between">
            <div>
              <h4 class="text-xs font-semibold text-on-surface font-display">Active Dock Taskbar Entries</h4>
              <p class="text-[11px] text-on-surface-variant mt-0.5">These applications appear on the bottom taskbar for instant, single-click launching.</p>
            </div>
            <span class="text-xs font-mono px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30">
              {{ dockRegistry.pinnedCount() }} Items
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (item of dockRegistry.pinnedApps(); track item.id) {
              @let running = dockRegistry.isAppRunning(item.id);
              <div class="p-3.5 rounded-xl bg-surface-container/40 border border-white/10 flex items-center justify-between gap-3 hover:border-tertiary/40 transition-all">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-surface-high border border-white/10 flex items-center justify-center text-secondary shrink-0">
                    <mat-icon class="text-lg">{{ item.icon }}</mat-icon>
                  </div>
                  <div class="min-w-0">
                    <h5 class="text-xs font-semibold text-on-surface truncate">{{ item.name }}</h5>
                    <p class="text-[10px] text-on-surface-variant truncate font-mono">ID: {{ item.id }}</p>
                    @if (running) {
                      <span class="text-[9px] text-tertiary font-mono flex items-center space-x-1 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                        <span>Process Active</span>
                      </span>
                    }
                  </div>
                </div>

                <div class="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                    (click)="dockRegistry.unpinApp(item.id)"
                    title="Remove from Dock">
                    <mat-icon class="text-xs">delete</mat-icon>
                    <span>Unpin</span>
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg bg-tertiary hover:bg-tertiary/90 text-surface-lowest text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                    (click)="dockRegistry.launchApp(item)">
                    <mat-icon class="text-xs">play_arrow</mat-icon>
                    <span>Launch</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tab 4: Register Custom Remote MFE -->
      @if (activeTab() === 'register') {
        <div id="catalog-panel-register" role="tabpanel" aria-labelledby="catalog-tab-register" class="bg-surface-panel border border-white/10 rounded-xl p-6 max-w-xl mx-auto space-y-4">
          <div class="border-b border-white/10 pb-3 mb-4">
            <h3 class="font-display font-semibold text-sm text-on-surface">Register Dynamic Micro-Frontend</h3>
            <p class="text-xs text-on-surface-variant mt-0.5">Dynamically add and resolve remote MFE modules without rebuilding the host.</p>
          </div>

          <form (submit)="$event.preventDefault(); submitCustomRemote()" class="space-y-4">
            <div>
              <label for="custom-mfe-name" class="block text-xs font-mono text-on-surface-variant mb-1">Remote Package Name</label>
              <input
                id="custom-mfe-name"
                type="text"
                [value]="regName()"
                (input)="regName.set($any($event.target).value)"
                placeholder="e.g. mfe-crm, billing-portal"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="custom-mfe-url" class="block text-xs font-mono text-on-surface-variant mb-1">Remote Entry URL</label>
              <input
                id="custom-mfe-url"
                type="text"
                [value]="regUrl()"
                (input)="regUrl.set($any($event.target).value)"
                placeholder="e.g. http://localhost:3005/remoteEntry.json"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="custom-mfe-exposed" class="block text-xs font-mono text-on-surface-variant mb-1">Exposed Module Key</label>
              <input
                id="custom-mfe-exposed"
                type="text"
                [value]="regExposed()"
                (input)="regExposed.set($any($event.target).value)"
                placeholder="./Component"
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary font-mono" />
            </div>

            <div>
              <label for="custom-mfe-desc" class="block text-xs font-mono text-on-surface-variant mb-1">Description</label>
              <input
                id="custom-mfe-desc"
                type="text"
                [value]="regDesc()"
                (input)="regDesc.set($any($event.target).value)"
                placeholder="Brief description of the remote application..."
                class="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary" />
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="submit"
                [disabled]="!regName().trim() || !regUrl().trim()"
                class="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 disabled:opacity-40 text-surface-lowest text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer">
                <mat-icon class="text-sm">add_circle</mat-icon>
                <span>Register &amp; Add to Catalog</span>
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Footer Info -->
      <footer class="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2">
        <div class="flex items-center space-x-3">
          <span class="flex items-center space-x-1">
            <mat-icon class="text-sm text-secondary">verified</mat-icon>
            <span>Angular 22 Native Federation Host</span>
          </span>
          <span class="hidden sm:inline-block">•</span>
          <span class="hidden sm:inline-block font-mono">Dock Link: Synchronous</span>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-high text-on-surface text-[11px] font-mono border border-white/10 flex items-center space-x-1 transition-colors cursor-pointer"
            (click)="installAllEssentials()">
            <mat-icon class="text-xs text-tertiary">system_update_alt</mat-icon>
            <span>Install All Core Apps to Dock</span>
          </button>
        </div>
      </footer>
    </div>
  `
})
export class AppLauncherComponent {
  readonly pid = input<string>();

  protected readonly windowManager = inject(WindowManagerService);
  protected readonly federationService = inject(NativeFederationService);
  protected readonly dockRegistry = inject(DockRegistryService);
  private readonly appHub = inject(AppHubService);

  readonly activeTab = signal<'catalog' | 'remotes' | 'pinned' | 'register'>('catalog');
  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('all');

  // Form signals for custom remote registration
  readonly regName = signal('');
  readonly regUrl = signal('');
  readonly regExposed = signal('./Component');
  readonly regDesc = signal('');

  constructor() {
    try {
      effect(() => {
        const panel = this.appHub.requestedPanel();
        if (panel === 'remotes') {
          this.activeTab.set('remotes');
        } else if (panel === 'pinned') {
          this.activeTab.set('pinned');
        } else {
          this.activeTab.set('catalog');
        }
      });
    } catch {
      // Graceful fallback in isolated test harness without ChangeDetectionScheduler
    }
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
      name: 'AI Copilot',
      category: 'ai',
      icon: 'message',
      description: 'Autonomous conversational assistant powered by Blades and Gemini with live streaming typewriter animation.',
      version: 'v1.1.0',
      architecture: 'Gemini 2.5 + Blades Engine',
      componentName: 'ChatWindowComponent'
    },
    {
      id: 'agentic-value-framework',
      name: 'Agentic Value Framework (AVF)',
      category: 'ai',
      icon: 'insights',
      description: 'The autonomous enterprise revenue calculus: goal-oriented UAV tracking, compounding intelligence engine, and ROIC analytics.',
      version: 'v1.0.0',
      architecture: 'CogniOps Value Engine',
      componentName: 'AgenticValueFrameworkComponent'
    },
    {
      id: 'appwrite-databases',
      name: 'Appwrite Databases & SDK',
      category: 'database',
      icon: 'database',
      description: 'Multi-tenant database engine, TablesDB schema inspector, and Server SDK code generator for 11 environments.',
      version: 'v2.4.0',
      architecture: 'TablesDB Service',
      componentName: 'AppwriteDatabasesComponent'
    },
    {
      id: 'security-audit',
      name: 'Audit Trail & RBAC Sentinel',
      category: 'security',
      icon: 'verified_user',
      description: 'Immutable forensic audit trail, multi-role RBAC access matrix, and cryptographic compliance.',
      version: 'v2.4.0',
      architecture: 'Cryptographic Kernel',
      componentName: 'SecurityAuditComponent'
    },
    {
      id: 'agentfs-explorer',
      name: 'AgentFS VFS Explorer',
      category: 'developer',
      icon: 'folder',
      description: 'SQLite/OPFS virtual filesystem inspector, inode mapping, and CoW sandbox execution.',
      version: 'v2.4.0',
      architecture: 'OPFS SQLite VFS',
      componentName: 'AgentFsExplorerComponent'
    },
    {
      id: 'wopi-office',
      name: 'WOPI Office Suite',
      category: 'productivity',
      icon: 'file-text',
      description: 'Collaborative document, spreadsheet, and slide editor with real-time locks and CheckFileInfo protocol.',
      version: 'v2026.4',
      architecture: 'WOPI CheckFileInfo Protocol',
      componentName: 'WopiOfficeComponent'
    },
    {
      id: 'gateway-console',
      name: 'Control Plane & Gateway',
      category: 'system',
      icon: 'dns',
      description: 'Go API gateway orchestrator, Appwrite IAM token verification, and per-tenant libSQL routing.',
      version: 'v1.8.2',
      architecture: 'Go Gateway + Turso Edge Mesh',
      componentName: 'GatewayConsoleComponent'
    },
    {
      id: 'terminal',
      name: 'Terminal & Copilot',
      category: 'ai',
      icon: 'terminal',
      description: 'Interactive CLI shell and Gemini AI assistant for running automated enterprise operations.',
      version: 'v3.0.1',
      architecture: 'Sandboxed Web Worker',
      componentName: 'TerminalComponent'
    },
    {
      id: 'settings',
      name: 'System Settings',
      category: 'system',
      icon: 'settings',
      description: 'Configure preferences, windows, audio, and haptics.',
      version: 'v2.4.0',
      architecture: 'Host Preferences Service',
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
      architecture: 'Native Federation Dynamic MFE',
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

  public toDockPinnedItem(app: AppLauncherItem): DockPinnedApp {
    return {
      id: app.id,
      name: app.name,
      icon: app.icon,
      description: app.description,
      category: app.category,
      componentName: app.componentName,
      isFederated: app.isFederated,
      federatedConfig: app.federatedConfig,
      version: app.version
    };
  }

  public installToDock(app: AppLauncherItem): void {
    this.dockRegistry.installAndPin(this.toDockPinnedItem(app));
  }

  public getActiveProcess(appId: string): ProcessDescriptor | undefined {
    return this.windowManager.processes().find(
      p => p.isOpen && (p.appId === appId || p.pid === appId || p.pid === `proc_${appId}`)
    );
  }

  public getProcessState(appId: string): ProcessDescriptor | undefined {
    return this.getActiveProcess(appId);
  }

  public isProcessMinimized(pid: string): boolean {
    const bounds = this.windowManager.getBounds(pid);
    return bounds ? bounds.isMinimized : false;
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

  public switchHubPanel(panel: AppHubPanel): void {
    this.appHub.requestedPanel.set(panel);
  }

  public installRemoteToDock(remote: RemoteDefinition): void {
    this.dockRegistry.installAndPin({
      id: `remote-${remote.name}`,
      name: remote.name.replace(/^remote-/, '').toUpperCase() + ' (MFE)',
      icon: 'layers',
      description: remote.description,
      category: 'federated',
      componentName: 'RemoteContainerComponent',
      isFederated: true,
      federatedConfig: { url: remote.url, exposedModule: remote.exposedModule },
      version: remote.version || 'v1.0.0'
    });
  }

  public async probeRemote(remote: RemoteDefinition): Promise<void> {
    await this.federationService.probeRemote(remote);
  }

  public launchRemote(remote: RemoteDefinition): void {
    this.federationService.addLog(`[Catalog] Launching micro-frontend '${remote.name}'`);
    this.windowManager.spawnProcess(
      `remote-${remote.name}`,
      `MFE: ${remote.name}`,
      'layers',
      'RemoteContainerComponent',
      'productivity'
    );
  }

  public launch(app: AppLauncherItem): void {
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

  public installAllEssentials(): void {
    for (const app of this.coreApps) {
      this.installToDock(app);
    }
  }

  public submitCustomRemote(): void {
    const name = this.regName().trim();
    const url = this.regUrl().trim();
    const exposed = this.regExposed().trim() || './Component';
    const desc = this.regDesc().trim() || 'Dynamic Remote Micro-Frontend';

    if (!name || !url) return;

    this.federationService.registerDynamicRemote(name, url, exposed, desc);

    // Auto-install to dock as well
    this.dockRegistry.installAndPin({
      id: `remote-${name}`,
      name: name.toUpperCase() + ' (MFE)',
      icon: 'layers',
      description: desc,
      category: 'federated',
      componentName: 'RemoteContainerComponent',
      isFederated: true,
      federatedConfig: { url, exposedModule: exposed },
      version: 'v1.0.0'
    });

    this.regName.set('');
    this.regUrl.set('');
    this.regDesc.set('');
    this.activeTab.set('remotes');
  }
}
