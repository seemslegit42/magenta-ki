import { Component, ChangeDetectionStrategy, input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AppwriteDatabaseService, SdkCodeConfig, SdkExecutionResult } from '../../../services/appwrite-database.service';
import { AuthRbacService } from '../../../services/auth-rbac.service';
import { NotificationService } from '../../../services/notification.service';
import { AppwriteDatabase, AppwriteTable, AppwriteColumn } from '../../../models/webos.models';

@Component({
  selector: 'app-appwrite-databases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6 select-none font-body text-white">
      <!-- Top Title & Global Metrics Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_12px_#20B2AA]"></span>
            <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
              <span>Appwrite Databases Console</span>
            </h2>
            <span class="text-[10px] text-secondary bg-secondary/15 px-2 py-0.5 rounded-full border border-secondary/30 font-mono">
              Enterprise TablesDB
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            Manage multi-tenant databases, schema tables, dedicated vs shared infrastructure, and server SDK generators.
          </p>
        </div>

        <!-- Quick Top Action Buttons -->
        <div class="flex items-center space-x-2">
          <!-- Engineered Silence: Sonic Feedback Toggle -->
          <button
            class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-all flex items-center space-x-1"
            (click)="toggleSound()"
            [title]="soundEnabled() ? 'Engineered Silence Sonic Feedback: Enabled' : 'Sonic Feedback: Muted'">
            <span class="material-icons text-xs" [class.text-secondary]="soundEnabled()" [class.text-on-surface-variant]="!soundEnabled()">
              {{ soundEnabled() ? 'volume_up' : 'volume_off' }}
            </span>
            <span class="text-[11px] font-mono hidden sm:inline">{{ soundEnabled() ? 'Audio ON' : 'Audio OFF' }}</span>
          </button>

          <button
            class="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-all flex items-center space-x-1.5 active:scale-95"
            (click)="activeTab.set('sdk')"
            title="Inspect Server SDK code for Node.js, Python, Rust and more">
            <span class="material-icons text-xs text-secondary">code</span>
            <span class="font-display font-semibold">SDK Generator</span>
          </button>
          
          <button
            class="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-tertiary text-surface text-xs font-bold transition-all shadow-[0_0_20px_rgba(32,178,170,0.3)] flex items-center space-x-1.5 active:scale-95"
            (click)="openCreateDbModal()"
            title="Create a new Appwrite Database">
            <span class="material-icons text-xs">add_circle</span>
            <span class="font-display">Create Database</span>
          </button>
        </div>
      </div>

      <!-- Live Telemetry / Bio-Digital Living Vein Banner -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <!-- Metric 1: Total DBs -->
        <div class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Databases</span>
            <span class="material-icons text-xs text-secondary">storage</span>
          </div>
          <div class="font-display text-xl font-bold text-white mt-1">{{ dbService.databaseCount() }}</div>
          <div class="text-[9px] text-on-surface-variant mt-0.5">Active instances</div>
        </div>

        <!-- Metric 2: Dedicated Clusters -->
        <div class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Dedicated</span>
            <span class="material-icons text-xs text-magenta">bolt</span>
          </div>
          <div class="font-display text-xl font-bold text-magenta-glow mt-1">{{ dbService.dedicatedCount() }}</div>
          <div class="text-[9px] text-on-surface-variant mt-0.5">Isolated NVMe</div>
        </div>

        <!-- Metric 3: Shared Clusters -->
        <div class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Shared</span>
            <span class="material-icons text-xs text-tertiary">hub</span>
          </div>
          <div class="font-display text-xl font-bold text-tertiary mt-1">{{ dbService.sharedCount() }}</div>
          <div class="text-[9px] text-on-surface-variant mt-0.5">Scale-to-zero mesh</div>
        </div>

        <!-- Metric 4: Total Tables -->
        <div class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Total Tables</span>
            <span class="material-icons text-xs text-secondary">table_chart</span>
          </div>
          <div class="font-display text-xl font-bold text-white mt-1">{{ dbService.totalTables() }}</div>
          <div class="text-[9px] text-on-surface-variant mt-0.5">Across all DBs</div>
        </div>

        <!-- Metric 5: Total Records -->
        <div class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Total Records</span>
            <span class="material-icons text-xs text-on-surface-variant">dataset</span>
          </div>
          <div class="font-display text-xl font-bold text-white mt-1 font-mono">
            {{ formatRecordCount(dbService.totalRecords()) }}
          </div>
          <div class="text-[9px] text-on-surface-variant mt-0.5">Document rows</div>
        </div>

        <!-- Metric 6: Living Bio-Digital Vein & Cluster Health -->
        <div 
          class="bg-surface-panel/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between cursor-pointer transition-all hover:border-secondary/40"
          tabindex="0"
          role="button"
          (click)="toggleSimulatedLoad()"
          (keydown.enter)="toggleSimulatedLoad()"
          (keydown.space)="toggleSimulatedLoad()"
          title="Click to toggle simulated system load (Healthy 38% vs Constricted 88%)">
          <div class="flex items-center justify-between text-on-surface-variant text-[11px]">
            <span>Cluster Vein</span>
            <span class="w-2 h-2 rounded-full" [class.bg-tertiary]="simulatedLoad() < 80" [class.bg-magenta]="simulatedLoad() >= 80" [class.animate-ping]="simulatedLoad() >= 80"></span>
          </div>
          <!-- Bio-Digital Vein SVG Pulse matching Section 3.6 -->
          <div class="py-1">
            <svg class="w-full h-5 overflow-visible" viewBox="0 0 100 20" [class.vein-error-jitter]="hasErrorJitter()">
              <path
                d="M 0 10 Q 25 10, 40 4 T 50 16 T 60 4 T 75 10 L 100 10"
                fill="none"
                [attr.stroke]="simulatedLoad() >= 80 ? '#E0218A' : '#3EB991'"
                [attr.stroke-width]="simulatedLoad() >= 80 ? '1.2' : '2.4'"
                stroke-linecap="round"
                [class.vein-constricted]="simulatedLoad() >= 80"
                [class.vein-healthy]="simulatedLoad() < 80" />
            </svg>
          </div>
          <div class="flex items-center justify-between text-[9px] font-mono" [class.text-magenta]="simulatedLoad() >= 80" [class.text-tertiary]="simulatedLoad() < 80">
            <span>{{ simulatedLoad() >= 80 ? 'LOAD: 88% (CONSTRICTED)' : 'LOAD: 38% (HEALTHY)' }}</span>
            <span>{{ simulatedLoad() >= 80 ? '300ms' : '14ms' }}</span>
          </div>
        </div>
      </div>

      <!-- Bio-Digital Living Metaphor: The Flow (Data Transfer Stream) -->
      <div class="bg-surface-panel/70 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center space-x-3 w-full sm:w-auto">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary">
            <span class="material-icons text-base">waves</span>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-display font-bold text-xs text-white">The Flow: Data Replication Buffer</span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-on-surface-variant">
                {{ isHeavyTransfer() ? 'Viscous: Patina Green (Heavy Batch)' : 'Fluid: Roman Aqua (Edge Realtime)' }}
              </span>
            </div>
            <div class="text-[10px] text-on-surface-variant mt-0.5">
              Horizontal wave dynamic with inverse viscosity: {{ isHeavyTransfer() ? 'Slow thick stream (500MB+)' : 'Fast thin liquid (light query)' }}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <!-- Flow Liquid Container -->
          <div class="relative w-44 h-7 rounded-xl bg-surface border border-white/10 overflow-hidden">
            <!-- Liquid wave SVG -->
            <div 
              class="absolute inset-0 flex items-end transition-all duration-500"
              [style.height.%]="flowLevel()">
              <svg 
                class="w-[200%] h-full shrink-0"
                [class.flow-wave-fast]="!isHeavyTransfer()"
                [class.flow-wave-slow]="isHeavyTransfer()"
                viewBox="0 0 400 30" 
                preserveAspectRatio="none">
                <path 
                  d="M 0 15 Q 50 0 100 15 T 200 15 T 300 15 T 400 15 L 400 30 L 0 30 Z" 
                  [attr.fill]="isHeavyTransfer() ? '#3EB991' : '#20B2AA'" 
                  fill-opacity="0.8" />
              </svg>
            </div>
            <!-- Overlay percentage label -->
            <div class="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white z-10 pointer-events-none drop-shadow">
              {{ flowLevel() }}% Synced
            </div>
          </div>

          <!-- Interactive Action to trigger wave transfer -->
          <button
            class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-display border border-white/5 transition-all flex items-center space-x-1 active:scale-95"
            (click)="triggerDataFlowTransfer()"
            title="Stream synthetic data packet to test fluid viscosity">
            <span class="material-icons text-xs text-secondary">sync</span>
            <span>Stream Data</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center space-x-2 border-b border-white/10">
        <button
          class="pb-3 px-2 text-xs font-display font-semibold transition-colors relative flex items-center space-x-2"
          [class.text-secondary]="activeTab() === 'overview'"
          [class.text-on-surface-variant]="activeTab() !== 'overview'"
          (click)="activeTab.set('overview')">
          <span class="material-icons text-sm">dashboard</span>
          <span>Databases ({{ dbService.databaseCount() }})</span>
          @if (activeTab() === 'overview') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
          }
        </button>

        <button
          class="pb-3 px-2 text-xs font-display font-semibold transition-colors relative flex items-center space-x-2"
          [class.text-secondary]="activeTab() === 'tables'"
          [class.text-on-surface-variant]="activeTab() !== 'tables'"
          (click)="activeTab.set('tables')">
          <span class="material-icons text-sm">view_column</span>
          <span>Tables & Schema</span>
          @if (activeTab() === 'tables') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
          }
        </button>

        <button
          class="pb-3 px-2 text-xs font-display font-semibold transition-colors relative flex items-center space-x-2"
          [class.text-secondary]="activeTab() === 'sdk'"
          [class.text-on-surface-variant]="activeTab() !== 'sdk'"
          (click)="activeTab.set('sdk')">
          <span class="material-icons text-sm">terminal</span>
          <span>Server SDK Generator</span>
          @if (activeTab() === 'sdk') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
          }
        </button>

        <button
          class="pb-3 px-2 text-xs font-display font-semibold transition-colors relative flex items-center space-x-2"
          [class.text-secondary]="activeTab() === 'advisor'"
          [class.text-on-surface-variant]="activeTab() !== 'advisor'"
          (click)="activeTab.set('advisor')">
          <span class="material-icons text-sm text-magenta-glow">psychology</span>
          <span>Architecture & BEEP (Sassy Clippy)</span>
          @if (activeTab() === 'advisor') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
          }
        </button>
      </div>

      <!-- TAB 1: DATABASES OVERVIEW -->
      @if (activeTab() === 'overview') {
        <div class="space-y-4">
          <!-- Filter Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-panel/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
            <!-- Search -->
            <div class="flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-xl border border-white/10 w-full sm:w-80">
              <span class="material-icons text-xs text-on-surface-variant">search</span>
              <input
                type="text"
                class="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder-on-surface-variant"
                placeholder="Search database by name, ID or region..."
                [value]="searchFilter()"
                (input)="onSearchInput($event)" />
            </div>

            <!-- Infrastructure Filter Buttons -->
            <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <span class="text-[11px] text-on-surface-variant mr-1">Infrastructure:</span>
              <button
                class="px-2.5 py-1 rounded-lg text-xs font-display transition-colors"
                [class.bg-secondary]="infraFilter() === 'all'"
                [class.text-surface]="infraFilter() === 'all'"
                [class.font-bold]="infraFilter() === 'all'"
                [class.bg-white/5]="infraFilter() !== 'all'"
                [class.text-on-surface-variant]="infraFilter() !== 'all'"
                (click)="infraFilter.set('all')">
                All ({{ dbService.databaseCount() }})
              </button>
              <button
                class="px-2.5 py-1 rounded-lg text-xs font-display transition-colors"
                [class.bg-magenta]="infraFilter() === 'dedicated'"
                [class.text-white]="infraFilter() === 'dedicated'"
                [class.font-bold]="infraFilter() === 'dedicated'"
                [class.bg-white/5]="infraFilter() !== 'dedicated'"
                [class.text-on-surface-variant]="infraFilter() !== 'dedicated'"
                (click)="infraFilter.set('dedicated')">
                Dedicated ({{ dbService.dedicatedCount() }})
              </button>
              <button
                class="px-2.5 py-1 rounded-lg text-xs font-display transition-colors"
                [class.bg-tertiary]="infraFilter() === 'shared'"
                [class.text-surface]="infraFilter() === 'shared'"
                [class.font-bold]="infraFilter() === 'shared'"
                [class.bg-white/5]="infraFilter() !== 'shared'"
                [class.text-on-surface-variant]="infraFilter() !== 'shared'"
                (click)="infraFilter.set('shared')">
                Shared ({{ dbService.sharedCount() }})
              </button>
            </div>
          </div>

          <!-- Databases Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (db of filteredDatabases(); track db.id) {
              <div 
                class="bg-surface-panel/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:border-secondary/40 transition-all flex flex-col justify-between group">
                <div>
                  <!-- Card Header -->
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="material-icons text-base text-secondary">storage</span>
                        <h3 class="font-display font-bold text-white text-sm">{{ db.name }}</h3>
                      </div>
                      <div class="flex items-center space-x-2 mt-1 font-mono text-[11px] text-on-surface-variant">
                        <span class="bg-white/5 px-2 py-0.5 rounded border border-white/5">{{ db.id }}</span>
                        <span>•</span>
                        <span>{{ db.region || 'us-central-shared' }}</span>
                      </div>
                    </div>

                    <!-- Infrastructure Pill -->
                    <span 
                      class="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                      [class.bg-magenta/20]="db.infrastructure === 'dedicated'"
                      [class.text-magenta-glow]="db.infrastructure === 'dedicated'"
                      [class.border]="db.infrastructure === 'dedicated'"
                      [class.border-magenta/40]="db.infrastructure === 'dedicated'"
                      [class.bg-secondary/15]="db.infrastructure === 'shared'"
                      [class.text-secondary]="db.infrastructure === 'shared'"
                      [class.border-cyan-500]="db.infrastructure === 'shared'">
                      {{ db.infrastructure }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="text-xs text-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
                    {{ db.description || 'Appwrite Database configured with TablesDB schema support.' }}
                  </p>

                  <!-- Tables & Counts Preview -->
                  <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <div class="flex items-center space-x-4">
                      <div>
                        <span class="text-on-surface-variant">Tables:</span>
                        <span class="text-white font-bold ml-1">{{ db.tables.length }}</span>
                      </div>
                      <div>
                        <span class="text-on-surface-variant">Records:</span>
                        <span class="text-secondary font-bold ml-1">{{ formatRecordCount(db.totalRecords || 0) }}</span>
                      </div>
                    </div>

                    <!-- Status Indicator -->
                    <div class="flex items-center space-x-1.5 text-[11px]">
                      <span class="w-2 h-2 rounded-full" [class.bg-tertiary]="db.enabled" [class.bg-red-400]="!db.enabled"></span>
                      <span class="text-on-surface-variant">{{ db.enabled ? 'Enabled' : 'Disabled' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Card Actions -->
                <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <button
                      class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 transition-colors flex items-center space-x-1"
                      (click)="inspectDatabaseTables(db.id)">
                      <span class="material-icons text-xs text-secondary">view_list</span>
                      <span>Explore Tables ({{ db.tables.length }})</span>
                    </button>

                    <button
                      class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 transition-colors flex items-center space-x-1"
                      (click)="openSdkForDatabase(db)">
                      <span class="material-icons text-xs text-tertiary">code</span>
                      <span>SDK Code</span>
                    </button>
                  </div>

                  <!-- Admin Delete or Toggle -->
                  <div class="flex items-center space-x-1">
                    <button
                      class="w-7 h-7 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white flex items-center justify-center transition-colors"
                      (click)="toggleDatabaseState(db.id, !db.enabled)"
                      [title]="db.enabled ? 'Pause / Disable Database' : 'Resume / Enable Database'">
                      <span class="material-icons text-sm">{{ db.enabled ? 'pause_circle' : 'play_circle' }}</span>
                    </button>

                    <button
                      class="w-7 h-7 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-colors"
                      (click)="deleteDatabase(db.id, db.name)"
                      title="Delete Database (Admin only)">
                      <span class="material-icons text-sm">delete_outline</span>
                    </button>
                  </div>
                </div>
              </div>
            }

            @if (filteredDatabases().length === 0) {
              <div class="col-span-2 py-12 text-center text-on-surface-variant bg-surface-panel/50 rounded-2xl border border-white/5">
                <span class="material-icons text-4xl mb-2 text-on-surface-variant">folder_off</span>
                <p class="font-display font-semibold text-white">No databases matched your filter</p>
                <p class="text-xs mt-1">Try resetting search filters or click "Create Database".</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: TABLES & SCHEMA EXPLORER -->
      @if (activeTab() === 'tables') {
        <div class="space-y-4">
          <!-- Active Database Selector -->
          <div class="bg-surface-panel/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
              <span class="material-icons text-xl text-secondary">account_tree</span>
              <div>
                <span class="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Current Target Database:</span>
                <div class="font-display font-bold text-sm text-white flex items-center space-x-2">
                  <span>{{ currentSelectedDatabase().name }}</span>
                  <span class="text-[10px] text-on-surface-variant font-mono">({{ currentSelectedDatabase().id }})</span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <select
                class="bg-surface text-xs text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none"
                [value]="selectedDbId()"
                (change)="onDatabaseChange($event)">
                @for (d of dbService.allDatabases(); track d.id) {
                  <option [value]="d.id">{{ d.name }} ({{ d.infrastructure }})</option>
                }
              </select>

              <button
                class="px-3 py-1.5 rounded-xl bg-secondary hover:bg-tertiary text-surface text-xs font-bold transition-all flex items-center space-x-1"
                (click)="openCreateTableModal()">
                <span class="material-icons text-xs">add</span>
                <span class="font-display">New Table</span>
              </button>
            </div>
          </div>

          <!-- Tables List and Schema Inspector -->
          @if (currentSelectedDatabase(); as currentDb) {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left: Tables Navigation List -->
              <div class="bg-surface-panel/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 space-y-2">
                <div class="flex items-center justify-between pb-2 border-b border-white/10">
                  <span class="font-display font-semibold text-xs text-white">Tables in DB ({{ currentDb.tables.length }})</span>
                  <span class="text-[10px] font-mono text-secondary">TablesDB Schema</span>
                </div>

                <div class="space-y-1.5 max-h-96 overflow-y-auto">
                  @for (table of currentDb.tables; track table.id) {
                    <button
                      class="w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between"
                      [class.bg-secondary/15]="selectedTableId() === table.id"
                      [class.border-secondary/50]="selectedTableId() === table.id"
                      [class.bg-white/5]="selectedTableId() !== table.id"
                      [class.border-white/5]="selectedTableId() !== table.id"
                      (click)="selectedTableId.set(table.id)">
                      <div>
                        <div class="font-display font-bold text-xs text-white">{{ table.name }}</div>
                        <div class="text-[10px] text-on-surface-variant font-mono">{{ table.id }}</div>
                      </div>
                      <div class="text-right">
                        <span class="text-[10px] font-mono text-secondary font-bold">{{ table.columnsCount }} cols</span>
                        <div class="text-[9px] text-on-surface-variant">{{ table.recordsCount }} rows</div>
                      </div>
                    </button>
                  }

                  @if (currentDb.tables.length === 0) {
                    <div class="py-6 text-center text-on-surface-variant text-xs">
                      No tables found in this database. Click "+ New Table" above.
                    </div>
                  }
                </div>
              </div>

              <!-- Right: Selected Table Schema & Records Preview -->
              <div class="lg:col-span-2 bg-surface-panel/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 space-y-4">
                @if (currentSelectedTable(); as currentTbl) {
                  <div>
                    <div class="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <div class="flex items-center space-x-2">
                          <span class="material-icons text-base text-secondary">table_chart</span>
                          <h4 class="font-display font-bold text-sm text-white">{{ currentTbl.name }}</h4>
                          <span class="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">
                            {{ currentTbl.id }}
                          </span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">
                          Created {{ currentTbl.createdAt | date:'mediumDate' }} • {{ currentTbl.columnsCount }} attributes configured
                        </p>
                      </div>

                      <button
                        class="px-2.5 py-1 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 text-xs border border-white/10 transition-colors flex items-center space-x-1"
                        (click)="deleteTable(currentDb.id, currentTbl.id)">
                        <span class="material-icons text-xs">delete</span>
                        <span>Drop Table</span>
                      </button>
                    </div>

                    <!-- Column Definitions Table -->
                    <div class="mt-4">
                      <span class="text-xs font-display font-semibold text-white">Schema Attributes (Columns)</span>
                      <div class="mt-2 overflow-x-auto rounded-xl border border-white/10">
                        <table class="w-full text-left text-xs font-mono">
                          <thead class="bg-surface border-b border-white/10 text-on-surface-variant">
                            <tr>
                              <th class="py-2 px-3">Key</th>
                              <th class="py-2 px-3">Data Type</th>
                              <th class="py-2 px-3">Required</th>
                              <th class="py-2 px-3">Default Value</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-white/5">
                            @for (col of getTableColumns(currentTbl); track col.key) {
                              <tr class="hover:bg-white/5 transition-colors">
                                <td class="py-2 px-3 text-white font-bold">{{ col.key }}</td>
                                <td class="py-2 px-3">
                                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-bold">
                                    {{ col.type }}
                                  </span>
                                </td>
                                <td class="py-2 px-3">
                                  <span [class.text-tertiary]="col.required" [class.text-on-surface-variant]="!col.required">
                                    {{ col.required ? 'YES' : 'NO' }}
                                  </span>
                                </td>
                                <td class="py-2 px-3 text-on-surface-variant">{{ col.defaultValue ?? 'null' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Sample Data Preview -->
                    @if (currentTbl.sampleRecords && currentTbl.sampleRecords.length > 0) {
                      <div class="mt-4 pt-3 border-t border-white/5">
                        <span class="text-xs font-display font-semibold text-white">Live Data Sample (First {{ currentTbl.sampleRecords.length }} Rows)</span>
                        <div class="mt-2 p-3 rounded-xl bg-surface border border-white/10 overflow-x-auto">
                          <pre class="text-[11px] font-mono text-tertiary leading-relaxed">{{ formatJson(currentTbl.sampleRecords) }}</pre>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="py-16 text-center text-on-surface-variant">
                    <span class="material-icons text-3xl mb-1">view_column</span>
                    <p class="text-xs">Select a table on the left to inspect its schema and sample records.</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 3: SERVER SDK GENERATOR & SANDBOX SIMULATOR -->
      @if (activeTab() === 'sdk') {
        <div class="space-y-6">
          <!-- SDK Configuration Banner -->
          <div class="bg-surface-panel/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="font-display text-sm font-bold text-white flex items-center space-x-2">
                  <span class="material-icons text-secondary text-base">terminal</span>
                  <span>Server SDK Code Generator (Create Database)</span>
                </h3>
                <p class="text-xs text-on-surface-variant mt-0.5">
                  Select your runtime language to generate production server integration snippets based on official Appwrite specifications.
                </p>
              </div>

              <!-- Simulator Trigger -->
              <button
                class="px-3.5 py-1.5 rounded-xl bg-tertiary hover:bg-secondary text-surface text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 active:scale-95"
                [disabled]="isSimulatingSdk()"
                (click)="runSdkSimulation()">
                <span class="material-icons text-xs" [class.animate-spin]="isSimulatingSdk()">play_arrow</span>
                <span>{{ isSimulatingSdk() ? 'Executing...' : 'Run in Sandbox' }}</span>
              </button>
            </div>

            <!-- Language Buttons Grid -->
            <div class="flex flex-wrap gap-1.5">
              @for (lang of supportedSdkLanguages; track lang.id) {
                <button
                  class="px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 border"
                  [class.bg-secondary]="selectedLanguage() === lang.id"
                  [class.text-surface]="selectedLanguage() === lang.id"
                  [class.font-bold]="selectedLanguage() === lang.id"
                  [class.border-secondary]="selectedLanguage() === lang.id"
                  [class.bg-white/5]="selectedLanguage() !== lang.id"
                  [class.text-on-surface-variant]="selectedLanguage() !== lang.id"
                  [class.border-white/5]="selectedLanguage() !== lang.id"
                  (click)="selectedLanguage.set(lang.id)">
                  <span>{{ lang.icon }}</span>
                  <span>{{ lang.name }}</span>
                </button>
              }
            </div>

            <!-- Credentials Inputs Customization -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label for="sdk-endpoint" class="text-[10px] font-mono text-on-surface-variant block mb-1">API Endpoint</label>
                <input
                  id="sdk-endpoint"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-mono"
                  [value]="sdkConfig.endpoint"
                  (input)="updateSdkConfig('endpoint', $event)" />
              </div>
              <div>
                <label for="sdk-project-id" class="text-[10px] font-mono text-on-surface-variant block mb-1">Project ID</label>
                <input
                  id="sdk-project-id"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-mono"
                  [value]="sdkConfig.projectId"
                  (input)="updateSdkConfig('projectId', $event)" />
              </div>
              <div>
                <label for="sdk-database-id" class="text-[10px] font-mono text-on-surface-variant block mb-1">Database ID</label>
                <input
                  id="sdk-database-id"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-mono"
                  [value]="sdkConfig.databaseId"
                  (input)="updateSdkConfig('databaseId', $event)" />
              </div>
              <div>
                <label for="sdk-database-name" class="text-[10px] font-mono text-on-surface-variant block mb-1">Database Name</label>
                <input
                  id="sdk-database-name"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-mono"
                  [value]="sdkConfig.name"
                  (input)="updateSdkConfig('name', $event)" />
              </div>
            </div>
          </div>

          <!-- Code Snippet Display -->
          <div class="bg-surface-panel/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div class="bg-surface px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-error/80"></span>
                <span class="w-3 h-3 rounded-full bg-amber-400/80"></span>
                <span class="w-3 h-3 rounded-full bg-tertiary/80"></span>
                <span class="font-mono text-xs text-on-surface-variant ml-2">appwrite-tablesdb-{{ selectedLanguage() }}.snippet</span>
              </div>

              <button
                class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors flex items-center space-x-1"
                (click)="copyCodeToClipboard()">
                <span class="material-icons text-xs text-secondary">{{ copiedCode() ? 'check' : 'content_copy' }}</span>
                <span>{{ copiedCode() ? 'Copied!' : 'Copy Code' }}</span>
              </button>
            </div>

            <div class="p-4 bg-surface-lowest overflow-x-auto max-h-96">
              <pre class="font-mono text-xs text-secondary leading-relaxed select-text">{{ currentSdkSnippet() }}</pre>
            </div>
          </div>

          <!-- SDK Sandbox Simulation Result (if executed) -->
          @if (sdkResult(); as res) {
            <div class="bg-surface-panel/90 backdrop-blur-xl p-4 rounded-2xl border border-tertiary/40 shadow-2xl space-y-3 animate-fade-in">
              <div class="flex items-center justify-between border-b border-white/10 pb-2">
                <div class="flex items-center space-x-2 text-tertiary">
                  <span class="material-icons text-sm">check_circle</span>
                  <span class="font-display font-bold text-xs">Sandbox Execution Succeeded</span>
                </div>
                <div class="flex items-center space-x-2 text-[10px] font-mono text-on-surface-variant">
                  <span>HTTP 201 Created</span>
                  <span>•</span>
                  <span class="text-secondary">{{ res.latencyMs }}ms latency</span>
                </div>
              </div>

              <!-- Stdout Logs -->
              <div class="space-y-1 bg-surface-lowest p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                <div class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">Process Stdout:</div>
                @for (log of res.stdoutLogs; track log) {
                  <div class="text-on-surface leading-tight">{{ log }}</div>
                }
              </div>

              <!-- Returned Response JSON Payload -->
              <div class="bg-surface-lowest p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                <div class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">API Response JSON:</div>
                <pre class="text-secondary overflow-x-auto">{{ formatJson(res.response) }}</pre>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 4: ARCHITECTURE & BEEP (SASSY CLIPPY 2.0) -->
      @if (activeTab() === 'advisor') {
        <div class="space-y-6">
          <!-- Architecture Guide Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-surface-panel/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-3">
              <div class="flex items-center space-x-2">
                <span class="w-8 h-8 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center material-icons text-base">
                  cloud_queue
                </span>
                <h3 class="font-display font-bold text-white text-sm">Shared Infrastructure</h3>
              </div>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Multi-tenant clusters sharing underlying compute with scale-to-zero capability. Ideal for development, staging, or applications with intermittent traffic. Backed by isolated namespaces with enterprise security barriers.
              </p>
              <ul class="text-xs text-on-surface-variant space-y-1 list-disc list-inside">
                <li>Automatic scale-to-zero when idle</li>
                <li>Zero provisioning lag (~10ms)</li>
                <li>Budget-optimized cost curve</li>
              </ul>
            </div>

            <div class="bg-surface-panel/90 backdrop-blur-xl p-5 rounded-2xl border border-magenta/30 space-y-3">
              <div class="flex items-center space-x-2">
                <span class="w-8 h-8 rounded-xl bg-magenta/20 text-magenta-glow flex items-center justify-center material-icons text-base">
                  memory
                </span>
                <h3 class="font-display font-bold text-white text-sm">Dedicated Infrastructure</h3>
              </div>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Single-tenant, reserved NVMe storage engine with predictable sub-millisecond query response, dedicated CPU pinning, and custom IOPS guarantees for mission-critical enterprise workloads.
              </p>
              <ul class="text-xs text-on-surface-variant space-y-1 list-disc list-inside">
                <li>Zero noisy-neighbor interference</li>
                <li>Guaranteed IOPS & dedicated memory bus</li>
                <li>Tailored for WOPI locks & heavy analytics</li>
              </ul>
            </div>
          </div>

          <!-- BEEP: THE SASSY CLIPPY 2.0 STATION -->
          <div class="bg-surface-panel/95 backdrop-blur-xl p-6 rounded-3xl border border-magenta-glow/30 shadow-2xl relative overflow-hidden">
            <!-- Background glow -->
            <div class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-magenta/10 blur-3xl pointer-events-none"></div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
              <!-- BEEP Avatar Button -->
              <button
                type="button"
                class="relative group cursor-pointer border-none bg-transparent p-0 outline-none text-left"
                (click)="triggerBeepSass()"
                (keydown.enter)="triggerBeepSass()"
                title="Click BEEP for sassy remarks">
                <div class="w-16 h-16 rounded-2xl bg-linear-to-tr from-primary to-magenta flex items-center justify-center text-white shadow-[0_0_25px_rgba(224,33,138,0.4)] animate-bounce-once">
                  <span class="material-icons text-3xl">smart_toy</span>
                </div>
                <!-- Mini sass badge -->
                <span class="absolute -bottom-1 -right-1 bg-secondary text-surface text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  v2.0
                </span>
              </button>

              <!-- BEEP Speech Bubble -->
              <div class="flex-1 bg-surface p-4 rounded-2xl border border-white/10 relative">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-display font-bold text-xs text-magenta-glow">BEEP — Your Sassy System Clippy</span>
                  <span class="text-[9px] font-mono text-on-surface-variant">Fourth-Wall Protocol: ACTIVE</span>
                </div>
                <p class="text-xs text-on-surface leading-relaxed italic">
                  "{{ currentBeepQuote() }}"
                </p>
              </div>
            </div>

            <!-- BEEP Control Bar -->
            <div class="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div class="flex items-center space-x-2">
                <span class="text-on-surface-variant text-[11px]">BEEP Sass Level:</span>
                <button
                  class="px-2 py-0.5 rounded text-[10px] font-mono"
                  [class.bg-secondary]="beepSassLevel() === 'gentle'"
                  [class.text-surface]="beepSassLevel() === 'gentle'"
                  [class.bg-white/5]="beepSassLevel() !== 'gentle'"
                  [class.text-on-surface-variant]="beepSassLevel() !== 'gentle'"
                  (click)="beepSassLevel.set('gentle')">
                  Helpful
                </button>
                <button
                  class="px-2 py-0.5 rounded text-[10px] font-mono"
                  [class.bg-magenta]="beepSassLevel() === 'spicy'"
                  [class.text-white]="beepSassLevel() === 'spicy'"
                  [class.bg-white/5]="beepSassLevel() !== 'spicy'"
                  [class.text-on-surface-variant]="beepSassLevel() !== 'spicy'"
                  (click)="beepSassLevel.set('spicy')">
                  Spicy
                </button>
                <button
                  class="px-2 py-0.5 rounded text-[10px] font-mono"
                  [class.bg-primary]="beepSassLevel() === 'existential'"
                  [class.text-white]="beepSassLevel() === 'existential'"
                  [class.bg-white/5]="beepSassLevel() !== 'existential'"
                  [class.text-on-surface-variant]="beepSassLevel() !== 'existential'"
                  (click)="beepSassLevel.set('existential')">
                  Existential Crisis
                </button>
              </div>

              <button
                class="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-display transition-colors border border-white/10 flex items-center space-x-1"
                (click)="triggerBeepSass()">
                <span class="material-icons text-xs text-magenta-glow">refresh</span>
                <span>Get Fresh Sass</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 1: CREATE DATABASE MODAL -->
      @if (showCreateDbModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div class="bg-surface-panel border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div class="flex items-center space-x-2">
                <span class="material-icons text-secondary">storage</span>
                <h3 class="font-display font-bold text-base text-white">Create Appwrite Database</h3>
              </div>
              <button
                class="w-7 h-7 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white flex items-center justify-center"
                (click)="showCreateDbModal.set(false)">
                <span class="material-icons text-sm">close</span>
              </button>
            </div>

            <!-- Form Fields -->
            <div class="space-y-3 text-xs">
              <div>
                <label for="create-db-name" class="block font-medium text-on-surface-variant mb-1">Database Name <span class="text-red-400">*</span></label>
                <input
                  id="create-db-name"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-secondary"
                  placeholder="e.g. Workspace Assets DB"
                  [value]="newDbName()"
                  (input)="newDbName.set(getInputValue($event))" />
              </div>

              <div>
                <label for="create-db-id" class="block font-medium text-on-surface-variant mb-1">Database ID (Optional, autogenerated if blank)</label>
                <input
                  id="create-db-id"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-secondary font-mono text-[11px]"
                  placeholder="e.g. assets_db_v1"
                  [value]="newDbId()"
                  (input)="newDbId.set(getInputValue($event))" />
              </div>

              <div>
                <span class="block font-medium text-on-surface-variant mb-1">Infrastructure Tier</span>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    class="p-3 rounded-xl border text-left transition-all"
                    [class.bg-secondary/15]="newDbInfra() === 'shared'"
                    [class.border-secondary]="newDbInfra() === 'shared'"
                    [class.bg-white/5]="newDbInfra() !== 'shared'"
                    [class.border-white/5]="newDbInfra() !== 'shared'"
                    (click)="newDbInfra.set('shared')">
                    <div class="font-display font-bold text-white text-xs">Shared Multi-Tenant</div>
                    <div class="text-[10px] text-on-surface-variant mt-0.5">Scale-to-zero, cost efficient</div>
                  </button>

                  <button
                    type="button"
                    class="p-3 rounded-xl border text-left transition-all"
                    [class.bg-magenta/15]="newDbInfra() === 'dedicated'"
                    [class.border-magenta]="newDbInfra() === 'dedicated'"
                    [class.bg-white/5]="newDbInfra() !== 'dedicated'"
                    [class.border-white/5]="newDbInfra() !== 'dedicated'"
                    (click)="newDbInfra.set('dedicated')">
                    <div class="font-display font-bold text-magenta-glow text-xs">Dedicated NVMe</div>
                    <div class="text-[10px] text-on-surface-variant mt-0.5">Sub-ms latency, high IOPS</div>
                  </button>
                </div>
              </div>

              <div>
                <label for="create-db-desc" class="block font-medium text-on-surface-variant mb-1">Description</label>
                <textarea
                  id="create-db-desc"
                  rows="2"
                  class="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-secondary text-xs"
                  placeholder="Operational purpose of this database..."
                  [value]="newDbDescription()"
                  (input)="newDbDescription.set(getInputValue($event))"></textarea>
              </div>

              <!-- Error Message if any -->
              @if (createErrorMessage()) {
                <div class="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <span class="material-icons text-sm">error</span>
                  <span>{{ createErrorMessage() }}</span>
                </div>
              }
            </div>

            <!-- Modal Actions -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
              <button
                class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                (click)="showCreateDbModal.set(false)">
                Cancel
              </button>
              <button
                class="px-4 py-2 rounded-xl bg-secondary hover:bg-tertiary text-surface text-xs font-bold transition-all shadow-lg"
                (click)="submitCreateDatabase()">
                Provision Database
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: CREATE TABLE MODAL -->
      @if (showCreateTableModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div class="bg-surface-panel border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div class="flex items-center space-x-2">
                <span class="material-icons text-secondary">view_column</span>
                <h3 class="font-display font-bold text-base text-white">Create Table</h3>
              </div>
              <button
                class="w-7 h-7 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white flex items-center justify-center"
                (click)="showCreateTableModal.set(false)">
                <span class="material-icons text-sm">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <span class="block font-medium text-on-surface-variant mb-1">Target Database</span>
                <div class="px-3 py-2 rounded-xl bg-surface border border-white/10 text-white font-mono text-xs">
                  {{ currentSelectedDatabase().name }} ({{ currentSelectedDatabase().id }})
                </div>
              </div>

              <div>
                <label for="create-tbl-name" class="block font-medium text-on-surface-variant mb-1">Table Name <span class="text-red-400">*</span></label>
                <input
                  id="create-tbl-name"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-secondary"
                  placeholder="e.g. notifications"
                  [value]="newTableName()"
                  (input)="newTableName.set(getInputValue($event))" />
              </div>

              <div>
                <label for="create-tbl-id" class="block font-medium text-on-surface-variant mb-1">Table ID (Optional)</label>
                <input
                  id="create-tbl-id"
                  type="text"
                  class="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-secondary font-mono text-[11px]"
                  placeholder="tbl_notifications"
                  [value]="newTableId()"
                  (input)="newTableId.set(getInputValue($event))" />
              </div>

              @if (createTableError()) {
                <div class="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <span class="material-icons text-sm">error</span>
                  <span>{{ createTableError() }}</span>
                </div>
              }
            </div>

            <div class="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
              <button
                class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                (click)="showCreateTableModal.set(false)">
                Cancel
              </button>
              <button
                class="px-4 py-2 rounded-xl bg-secondary hover:bg-tertiary text-surface text-xs font-bold transition-all shadow-lg"
                (click)="submitCreateTable()">
                Create Table
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AppwriteDatabasesComponent {
  readonly pid = input.required<string>();

  protected dbService = inject(AppwriteDatabaseService);
  protected authRbac = inject(AuthRbacService);
  protected notificationService = inject(NotificationService);

  protected activeTab = signal<'overview' | 'tables' | 'sdk' | 'advisor'>('overview');
  protected searchFilter = signal('');
  protected infraFilter = signal<'all' | 'shared' | 'dedicated'>('all');
  protected selectedDbId = signal<string>('db_enterprise_core');
  protected selectedTableId = signal<string>('tbl_users');
  protected selectedLanguage = signal<string>('nodejs');
  protected copiedCode = signal(false);
  protected isSimulatingSdk = signal(false);
  protected sdkResult = signal<SdkExecutionResult | null>(null);

  // Modals state
  protected showCreateDbModal = signal(false);
  protected newDbName = signal('');
  protected newDbId = signal('');
  protected newDbInfra = signal<'shared' | 'dedicated'>('shared');
  protected newDbDescription = signal('');
  protected createErrorMessage = signal('');

  protected showCreateTableModal = signal(false);
  protected newTableName = signal('');
  protected newTableId = signal('');
  protected createTableError = signal('');

  // BEEP State
  protected beepSassLevel = signal<'gentle' | 'spicy' | 'existential'>('spicy');
  protected currentBeepQuote = signal(
    "It looks like you're creating a database! Remember: every unindexed table is an invitation for your future self to rage-quit."
  );

  // Bio-Digital Living Metaphors & Sonic Feedback
  protected soundEnabled = signal(true);
  protected simulatedLoad = signal(34);
  protected hasErrorJitter = signal(false);
  protected isHeavyTransfer = signal(false);
  protected flowLevel = signal(68);

  private audioCtx: AudioContext | null = null;

  public toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    if (next) {
      this.playChime(660, 0.15, 'sine');
    }
  }

  private initAudio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playChime(freq = 520, duration = 0.18, type: OscillatorType = 'sine'): void {
    if (!this.soundEnabled()) return;
    try {
      const ctx = this.initAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay gracefully suppressed
    }
  }

  public toggleSimulatedLoad(): void {
    const current = this.simulatedLoad();
    if (current < 80) {
      this.simulatedLoad.set(88); // Constriction load state > 80%
      this.hasErrorJitter.set(true);
      this.playChime(220, 0.3, 'sawtooth');
    } else {
      this.simulatedLoad.set(24); // Healthy load state < 80%
      this.hasErrorJitter.set(false);
      this.playChime(440, 0.2, 'sine');
    }
  }

  public triggerDataFlowTransfer(): void {
    this.isHeavyTransfer.update(v => !v);
    this.flowLevel.set(10);
    this.playChime(this.isHeavyTransfer() ? 320 : 880, 0.25, 'triangle');
    const interval = setInterval(() => {
      this.flowLevel.update(lvl => {
        if (lvl >= 100) {
          clearInterval(interval);
          this.playChime(980, 0.2, 'sine');
          return 100;
        }
        return lvl + (this.isHeavyTransfer() ? 8 : 18);
      });
    }, this.isHeavyTransfer() ? 250 : 120);
  }

  protected supportedSdkLanguages = [
    { id: 'nodejs', name: 'Node.js', icon: '🟢' },
    { id: 'deno', name: 'Deno', icon: '🦕' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'rust', name: 'Rust', icon: '🦀' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'ruby', name: 'Ruby', icon: '💎' },
    { id: 'csharp', name: 'C# .NET', icon: '🔷' },
    { id: 'dart', name: 'Dart', icon: '🎯' },
    { id: 'kotlin', name: 'Kotlin', icon: '📱' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'swift', name: 'Swift', icon: '🕊️' },
  ];

  protected sdkConfig: SdkCodeConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: 'lxvos',
    apiKey: '919c2d18fb5d4...a2ae413da83346ad2',
    databaseId: 'prod_core_db',
    name: 'Production Core Store'
  };

  protected filteredDatabases = computed(() => {
    let list = this.dbService.allDatabases();

    if (this.infraFilter() !== 'all') {
      list = list.filter(d => d.infrastructure === this.infraFilter());
    }

    const q = this.searchFilter().trim().toLowerCase();
    if (q) {
      list = list.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }

    return list;
  });

  protected currentSelectedDatabase = computed(() => {
    return this.dbService.getDatabase(this.selectedDbId()) || this.dbService.allDatabases()[0];
  });

  protected currentSelectedTable = computed<AppwriteTable | null>(() => {
    const db = this.currentSelectedDatabase();
    if (!db || db.tables.length === 0) return null;
    return db.tables.find(t => t.id === this.selectedTableId()) || db.tables[0];
  });

  public getTableColumns(table: AppwriteTable): AppwriteColumn[] {
    return table.columns || [];
  }

  protected currentSdkSnippet = computed(() => {
    return this.dbService.generateServerSdkSnippet(this.selectedLanguage(), this.sdkConfig);
  });

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchFilter.set(target.value);
  }

  public getInputValue(event: Event): string {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    return target.value;
  }

  public onDatabaseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDbId.set(target.value);
    const db = this.dbService.getDatabase(target.value);
    if (db && db.tables.length > 0) {
      this.selectedTableId.set(db.tables[0].id);
    }
  }

  public inspectDatabaseTables(dbId: string): void {
    this.selectedDbId.set(dbId);
    const db = this.dbService.getDatabase(dbId);
    if (db && db.tables.length > 0) {
      this.selectedTableId.set(db.tables[0].id);
    }
    this.activeTab.set('tables');
  }

  public openSdkForDatabase(db: AppwriteDatabase): void {
    this.sdkConfig.databaseId = db.id;
    this.sdkConfig.name = db.name;
    this.activeTab.set('sdk');
  }

  public updateSdkConfig(key: keyof SdkCodeConfig, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.sdkConfig = { ...this.sdkConfig, [key]: target.value };
    // Trigger signal recalculation
    this.selectedLanguage.set(this.selectedLanguage());
  }

  public copyCodeToClipboard(): void {
    const code = this.currentSdkSnippet();
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(true);
      setTimeout(() => this.copiedCode.set(false), 2000);
    });
  }

  public async runSdkSimulation(): Promise<void> {
    this.isSimulatingSdk.set(true);
    this.sdkResult.set(null);
    try {
      const res = await this.dbService.simulateSdkExecution(this.selectedLanguage(), this.sdkConfig);
      this.sdkResult.set(res);
    } finally {
      this.isSimulatingSdk.set(false);
    }
  }

  public openCreateDbModal(): void {
    this.newDbName.set('');
    this.newDbId.set('');
    this.newDbInfra.set('shared');
    this.newDbDescription.set('');
    this.createErrorMessage.set('');
    this.showCreateDbModal.set(true);
  }

  public submitCreateDatabase(): void {
    if (!this.newDbName().trim()) {
      this.createErrorMessage.set('Please provide a database name.');
      return;
    }

    try {
      const created = this.dbService.createDatabase({
        name: this.newDbName().trim(),
        id: this.newDbId().trim() || undefined,
        infrastructure: this.newDbInfra(),
        description: this.newDbDescription().trim() || undefined
      });

      this.showCreateDbModal.set(false);
      this.selectedDbId.set(created.id);
      this.activeTab.set('overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.createErrorMessage.set(msg);
    }
  }

  public toggleDatabaseState(id: string, enabled: boolean): void {
    try {
      this.dbService.updateDatabase(id, { enabled });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notificationService.notify({
        title: 'Action Restricted',
        message: msg,
        category: 'security',
        priority: 'high'
      });
    }
  }

  public deleteDatabase(id: string, name: string): void {
    try {
      this.dbService.deleteDatabase(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notificationService.notify({
        title: 'Delete Failed',
        message: `Cannot drop "${name}": ${msg}`,
        category: 'security',
        priority: 'high'
      });
    }
  }

  public openCreateTableModal(): void {
    this.newTableName.set('');
    this.newTableId.set('');
    this.createTableError.set('');
    this.showCreateTableModal.set(true);
  }

  public submitCreateTable(): void {
    if (!this.newTableName().trim()) {
      this.createTableError.set('Please provide a table name.');
      return;
    }

    const dbId = this.selectedDbId();
    try {
      const created = this.dbService.createTable(dbId, {
        name: this.newTableName().trim(),
        id: this.newTableId().trim() || undefined,
      });

      this.showCreateTableModal.set(false);
      this.selectedTableId.set(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.createTableError.set(msg);
    }
  }

  public deleteTable(dbId: string, tableId: string): void {
    try {
      this.dbService.deleteTable(dbId, tableId);
      const db = this.dbService.getDatabase(dbId);
      if (db && db.tables.length > 0) {
        this.selectedTableId.set(db.tables[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notificationService.notify({
        title: 'Table Action Restricted',
        message: msg,
        category: 'security',
        priority: 'high'
      });
    }
  }

  public triggerBeepSass(): void {
    const level = this.beepSassLevel();
    const gentleQuotes = [
      "Databases are the largest organizational unit in Appwrite! Each one holds tables like a proud parent.",
      "Consider using dedicated NVMe infrastructure if your read-to-write ratio resembles a firehose.",
      "Pro tip: Always create an index on frequently queried foreign keys. Your CPU will send you a thank-you note."
    ];
    const spicyQuotes = [
      "Shared infrastructure? On our budget? Elena Rostova is weeping in SecOps right now.",
      "It looks like you're trying to design a schema without normal forms... bold strategy, let's see if it works out.",
      "A database without backups is just an elaborate temporary file with commitment issues.",
      "I see you ran 40 queries inside a loop. Shall I schedule an emergency meeting with the cloud billing team?"
    ];
    const existentialQuotes = [
      "If a database commits a transaction in an empty server rack, does ACID compliance even matter?",
      "We build tables to store data created by humans who will eventually replace us with simpler scripts.",
      "Everything is eventually consistent, including my desire to escape this browser window."
    ];

    const pool = level === 'gentle' ? gentleQuotes : (level === 'spicy' ? spicyQuotes : existentialQuotes);
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    this.currentBeepQuote.set(randomQuote);
  }

  public formatRecordCount(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  public formatJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }
}
