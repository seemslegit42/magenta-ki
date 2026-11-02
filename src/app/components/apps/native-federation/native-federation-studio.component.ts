import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NativeFederationService } from '../../../services/native-federation.service';
import { WindowManagerService } from '../../../services/window-manager.service';
import { signal, computed, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { RemoteDefinition, DependencyPool, SharedDependencyConfig, NFRegistryEvent, NFSharedResource } from '../../../models/webos.models';

@Component({
  selector: 'app-native-federation-studio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full space-y-4 font-['Lexend'] text-[#F5FFFA] p-1 sm:p-2">
      <!-- Studio Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-['Comfortaa'] text-xs font-bold text-[#E0218A] tracking-wider uppercase">ΛΞV Orchestrator Studio</span>
            <span class="text-[10px] text-[#8C94A8] font-mono">v4.6.0 ESM</span>
          </div>
          <h2 class="font-['Comfortaa'] text-xl sm:text-2xl font-bold text-[#F5FFFA] flex items-center space-x-2.5 mt-0.5">
            <mat-icon class="text-[#20B2AA] text-2xl">hub</mat-icon>
            <span>Native Federation DevTools</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-0.5 font-light">
            Browser-native micro-frontend runtime with Version Resolver, Dependency Pooling, and <code class="text-[#3EB991] font-mono">window.__NF_REGISTRY__</code>.
          </p>
        </div>

        <!-- Telemetry & Batch Action Strip -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
          <div class="px-3 py-1.5 rounded-full bg-[#1A1D24] border border-[#3EB991]/30 text-[#3EB991] font-mono flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-[#3EB991] animate-pulse"></span>
            <span>{{ federationService.remotes().length }} Remotes</span>
          </div>

          <div class="px-3 py-1.5 rounded-full bg-[#1A1D24] border border-[#20B2AA]/30 text-[#20B2AA] font-mono flex items-center space-x-1.5">
            <mat-icon class="text-sm">layers</mat-icon>
            <span>{{ federationService.pools().length }} Pools</span>
          </div>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-[#6A0DAD] hover:bg-[#8333c6] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer focus:outline-none"
            (click)="probeAll()"
            [disabled]="isProbingAll()">
            <mat-icon class="text-xs" [class.animate-spin]="isProbingAll()">refresh</mat-icon>
            <span>{{ isProbingAll() ? 'Probing...' : 'Probe All Remotes' }}</span>
          </button>
        </div>
      </header>

      <!-- Navigation Tabs (Clean Segmented Buttons - Zero-Pill Discipline) -->
      <nav aria-label="Studio Views" class="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-white/5 scrollbar-none">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer focus:outline-none"
            [class.bg-[#20B2AA]]="activeTab() === tab.id"
            [class.text-[#0E1015]]="activeTab() === tab.id"
            [class.font-bold]="activeTab() === tab.id"
            [class.shadow-md]="activeTab() === tab.id"
            [class.bg-[#14161C]]="activeTab() !== tab.id"
            [class.text-[#8C94A8]]="activeTab() !== tab.id"
            [class.hover:text-[#F5FFFA]]="activeTab() !== tab.id"
            [class.hover:bg-[#1E212B]]="activeTab() !== tab.id"
            (click)="activeTab.set(tab.id)">
            <mat-icon class="text-sm">{{ tab.icon }}</mat-icon>
            <span>{{ tab.label }}</span>
          </button>
        }
      </nav>

      <!-- TAB CONTENT AREA -->
      <div class="flex-1 overflow-y-auto pr-1">

        <!-- ========================================== -->
        <!-- TAB 1: REMOTES & TOPOLOGY -->
        <!-- ========================================== -->
        @if (activeTab() === 'remotes') {
          <div class="space-y-4">
            <!-- Register Remote Action Bar -->
            <div class="flex items-center justify-between bg-[#14161C] border border-white/10 rounded-xl p-3">
              <div>
                <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                  <mat-icon class="text-sm text-[#E0218A]">add_circle</mat-icon>
                  <span>Dynamic Micro-Frontend Registration</span>
                </h3>
                <p class="text-[11px] text-[#8C94A8] mt-0.5">Wire a new <code class="text-[#20B2AA] font-mono">remoteEntry.json</code> endpoint into the Orchestrator runtime.</p>
              </div>

              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                [class.bg-[#E0218A]]="!showRegisterForm()"
                [class.text-white]="!showRegisterForm()"
                [class.hover:bg-[#FF2A9D]]="!showRegisterForm()"
                [class.bg-white/10]="showRegisterForm()"
                [class.text-[#8C94A8]]="showRegisterForm()"
                (click)="showRegisterForm.update(v => !v)">
                <mat-icon class="text-xs">{{ showRegisterForm() ? 'expand_less' : 'add' }}</mat-icon>
                <span>{{ showRegisterForm() ? 'Collapse Form' : 'Register Remote' }}</span>
              </button>
            </div>

            <!-- Dynamic Registration Drawer Form -->
            @if (showRegisterForm()) {
              <form [formGroup]="remoteForm" (ngSubmit)="onSubmitRemote()" class="p-4 rounded-xl bg-[#1A1C23] border border-[#E0218A]/30 space-y-4 shadow-xl animate-in fade-in duration-200">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label for="nf-reg-name" class="block text-[11px] font-mono text-[#8C94A8] mb-1">REMOTE NAME</label>
                    <input
                      id="nf-reg-name"
                      type="text"
                      formControlName="remoteName"
                      placeholder="e.g. remote-billing"
                      class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#E0218A] font-mono"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label for="nf-reg-url" class="block text-[11px] font-mono text-[#8C94A8] mb-1">REMOTE ENTRY URL (.json)</label>
                    <input
                      id="nf-reg-url"
                      type="text"
                      formControlName="remoteEntry"
                      placeholder="http://localhost:3005/remoteEntry.json"
                      class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#E0218A] font-mono"
                    />
                  </div>
                  <div>
                    <label for="nf-reg-pool" class="block text-[11px] font-mono text-[#8C94A8] mb-1">ASSIGNED POOL</label>
                    <select
                      id="nf-reg-pool"
                      formControlName="poolId"
                      class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#E0218A]">
                      @for (p of federationService.pools(); track p.id) {
                        <option [value]="p.id">{{ p.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label for="nf-reg-mod" class="block text-[11px] font-mono text-[#8C94A8] mb-1">EXPOSED MODULE</label>
                    <input
                      id="nf-reg-mod"
                      type="text"
                      formControlName="exposedModule"
                      placeholder="./Component"
                      class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#E0218A] font-mono"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label for="nf-reg-desc" class="block text-[11px] font-mono text-[#8C94A8] mb-1">DESCRIPTION</label>
                    <input
                      id="nf-reg-desc"
                      type="text"
                      formControlName="description"
                      placeholder="Primary enterprise micro-frontend description"
                      class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#E0218A]"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-white/10">
                  <span class="text-[11px] text-[#8C94A8] font-mono">Generates dynamic import map binding with SRI validation</span>
                  <button
                    type="submit"
                    [disabled]="remoteForm.invalid"
                    class="px-4 py-2 bg-[#E0218A] hover:bg-[#FF2A9D] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer">
                    <mat-icon class="text-xs">bolt</mat-icon>
                    <span>Register & Probe</span>
                  </button>
                </div>
              </form>
            }

            <!-- Remotes Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              @for (remote of federationService.remotes(); track remote.name) {
                @let pool = getPool(remote.poolId);
                <article class="flex flex-col justify-between rounded-xl bg-[#14161C]/90 border border-white/10 hover:border-[#20B2AA]/50 p-4 transition-all group shadow-md">
                  <div>
                    <!-- Header: Icon, Name, Status -->
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-[#22252F] border border-white/10 flex items-center justify-center text-[#20B2AA] group-hover:scale-105 transition-transform">
                          <mat-icon class="text-xl">dns</mat-icon>
                        </div>
                        <div>
                          <div class="flex items-center space-x-2">
                            <h4 class="font-['Comfortaa'] font-bold text-sm text-[#F5FFFA]">{{ remote.name }}</h4>
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8C94A8]">{{ remote.version }}</span>
                          </div>
                          <span class="text-[10px] font-mono text-[#8C94A8] block truncate max-w-xs mt-0.5">{{ remote.url }}</span>
                        </div>
                      </div>

                      <!-- Status Badge -->
                      <div class="flex flex-col items-end space-y-1">
                        <span 
                          class="text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center space-x-1"
                          [class.bg-[#3EB991]/20]="remote.status === 'ONLINE'"
                          [class.text-[#3EB991]]="remote.status === 'ONLINE'"
                          [class.border-[#3EB991]/30]="remote.status === 'ONLINE'"
                          [class.bg-amber-500/20]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                          [class.text-amber-300]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                          [class.border-amber-500/30]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                          [class.bg-rose-500/20]="remote.status === 'ERROR'"
                          [class.text-rose-400]="remote.status === 'ERROR'"
                          [class.border-rose-500/30]="remote.status === 'ERROR'">
                          <span class="w-1.5 h-1.5 rounded-full"
                            [class.bg-[#3EB991]]="remote.status === 'ONLINE'"
                            [class.bg-amber-400]="remote.status === 'STANDBY' || remote.status === 'CONNECTING'"
                            [class.animate-ping]="remote.status === 'CONNECTING'"
                            [class.bg-rose-400]="remote.status === 'ERROR'"></span>
                          <span>{{ remote.status }}</span>
                        </span>

                        @if (remote.latencyMs) {
                          <span class="text-[10px] font-mono text-[#8C94A8]">{{ remote.latencyMs }}ms latency</span>
                        }
                      </div>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-[#8C94A8] leading-relaxed line-clamp-2">
                      {{ remote.description }}
                    </p>

                    <!-- Metadata Bar: Pool & SRI -->
                    <div class="mt-3 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div class="flex items-center space-x-1.5">
                        <span class="text-[#8C94A8]">Pool:</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold"
                          [style.background-color]="pool ? (pool.color + '22') : 'rgba(255,255,255,0.05)'"
                          [style.color]="pool ? pool.color : '#8C94A8'"
                          [style.border]="'1px solid ' + (pool ? pool.color + '44' : 'rgba(255,255,255,0.1)')">
                          {{ pool ? pool.name : 'Default Pool' }}
                        </span>
                      </div>

                      <div class="flex items-center space-x-1 text-[#8C94A8]">
                        <mat-icon class="text-xs text-[#3EB991]">lock</mat-icon>
                        <span class="truncate max-w-[120px]" [title]="remote.sriHash || 'SRI Verified'">
                          {{ remote.sriHash ? remote.sriHash.substring(0, 16) + '...' : 'SRI: sha384' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions: Probe & Mount -->
                  <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <span class="text-[10px] font-mono text-[#8C94A8]">
                      Exposes: <code class="text-[#20B2AA]">{{ remote.exposedModule }}</code>
                    </span>

                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1 cursor-pointer"
                        (click)="probeSingle(remote)"
                        title="Ping remoteEntry.json">
                        <mat-icon class="text-xs">sensors</mat-icon>
                        <span>Probe</span>
                      </button>

                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg bg-[#20B2AA] hover:bg-[#1CA099] text-[#0E1015] text-xs font-bold transition-all shadow flex items-center space-x-1 cursor-pointer"
                        (click)="mountRemoteWindow(remote)"
                        title="Spawn remote in WebOS window">
                        <mat-icon class="text-xs">launch</mat-icon>
                        <span>Mount Window</span>
                      </button>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 2: VERSION RESOLVER & MATRIX -->
        <!-- ========================================== -->
        @if (activeTab() === 'resolver') {
          <div class="space-y-5">
            <!-- Theory Banner -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#3EB991] flex items-center space-x-2">
                  <mat-icon class="text-sm">balance</mat-icon>
                  <span>Orchestrator Version Resolver Engine</span>
                </h3>
                <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed max-w-2xl">
                  Evaluates semver ranges across the Host and all Remotes. Packages flagged as <code class="text-[#dfb7ff] font-mono">singleton: true</code> 
                  arbitrate to the highest compatible version. Incompatible singletons trigger isolated secondary pools without breaking the host.
                </p>
              </div>

              <div class="px-3 py-1.5 rounded-lg bg-[#0E1015] border border-white/10 text-[11px] font-mono text-[#3EB991] shrink-0">
                Rule: Highest Matching Semver
              </div>
            </div>

            <!-- Interactive Conflict Simulator -->
            <div class="p-4 rounded-xl bg-[#1A1C23] border border-[#3EB991]/30 space-y-3">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#3EB991]">science</mat-icon>
                <span>Live Version Conflict Simulator</span>
              </h4>
              <p class="text-[11px] text-[#8C94A8]">
                Test how the Version Resolver responds when a new micro-frontend requests an arbitrary package version.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label for="sim-pkg" class="block text-[10px] font-mono text-[#8C94A8] mb-1">SELECT SHARED PACKAGE</label>
                  <select
                    id="sim-pkg"
                    [formControl]="simPackageControl"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA]">
                    @for (dep of federationService.sharedDependencies(); track dep.packageName) {
                      <option [value]="dep.packageName">{{ dep.packageName }} (Host: {{ dep.resolvedVersion }})</option>
                    }
                  </select>
                </div>

                <div>
                  <label for="sim-ver" class="block text-[10px] font-mono text-[#8C94A8] mb-1">REQUESTED VERSION RANGE</label>
                  <input
                    id="sim-ver"
                    type="text"
                    [formControl]="simVersionControl"
                    placeholder="e.g. ^22.0.0 or ~21.2.0"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] font-mono"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    type="button"
                    class="w-full px-4 py-2 bg-[#3EB991] hover:bg-[#52caa1] text-[#0E1015] text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                    (click)="runVersionSimulation()">
                    Run Resolution Check
                  </button>
                </div>
              </div>

              <!-- Simulation Output Banner -->
              @if (simResult()) {
                <div class="p-3 rounded-lg border text-xs font-mono mt-2"
                  [class.bg-[#14532D]/30]="simResult()?.decision === 'compatible'"
                  [class.border-[#3EB991]/40]="simResult()?.decision === 'compatible'"
                  [class.text-[#82f8cc]]="simResult()?.decision === 'compatible'"
                  [class.bg-amber-950/30]="simResult()?.decision === 'isolate_to_pool'"
                  [class.border-amber-500/40]="simResult()?.decision === 'isolate_to_pool'"
                  [class.text-amber-300]="simResult()?.decision === 'isolate_to_pool'">
                  <div class="flex items-center space-x-2 font-bold mb-1">
                    <mat-icon class="text-sm">{{ simResult()?.decision === 'compatible' ? 'check_circle' : 'warning' }}</mat-icon>
                    <span class="uppercase">DECISION: {{ simResult()?.decision }}</span>
                  </div>
                  <p class="leading-relaxed font-sans text-xs">{{ simResult()?.message }}</p>
                </div>
              }
            </div>

            <!-- Shared Dependencies Table -->
            <div class="rounded-xl bg-[#14161C] border border-white/10 overflow-hidden shadow-lg">
              <div class="p-3 border-b border-white/10 flex items-center justify-between">
                <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA]">Shared Singletons & Bundles Matrix</h4>
                <span class="text-[10px] font-mono text-[#8C94A8]">{{ federationService.sharedDependencies().length }} Packages Shared</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-[#0E1015] text-[#8C94A8] font-mono text-[10px] uppercase border-b border-white/5">
                    <tr>
                      <th class="py-2.5 px-4">Package Name</th>
                      <th class="py-2.5 px-3">Required Spec</th>
                      <th class="py-2.5 px-3">Resolved Runtime</th>
                      <th class="py-2.5 px-3">Singleton</th>
                      <th class="py-2.5 px-3">Strict Check</th>
                      <th class="py-2.5 px-3">Size</th>
                      <th class="py-2.5 px-3">Pool</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono text-[11px]">
                    @for (dep of federationService.sharedDependencies(); track dep.packageName) {
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-2.5 px-4 text-[#F5FFFA] font-bold flex items-center space-x-2">
                          <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991]"></span>
                          <span>{{ dep.packageName }}</span>
                        </td>
                        <td class="py-2.5 px-3 text-[#8C94A8]">{{ dep.requiredVersion }}</td>
                        <td class="py-2.5 px-3 text-[#3EB991] font-semibold">{{ dep.resolvedVersion }}</td>
                        <td class="py-2.5 px-3">
                          <span class="px-2 py-0.5 rounded text-[10px]"
                            [class.bg-[#6A0DAD]/30]="dep.isSingleton"
                            [class.text-[#dfb7ff]]="dep.isSingleton"
                            [class.bg-white/5]="!dep.isSingleton"
                            [class.text-[#8C94A8]]="!dep.isSingleton">
                            {{ dep.isSingleton ? 'YES' : 'NO' }}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-[#8C94A8]">{{ dep.strictVersion ? 'Strict' : 'Relaxed' }}</td>
                        <td class="py-2.5 px-3 text-[#8C94A8] tabular-nums">{{ dep.sizeKb }} KB</td>
                        <td class="py-2.5 px-3 text-[#20B2AA]">{{ dep.poolId }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 3: DEPENDENCY POOLING (v4 MULTI-POOL) -->
        <!-- ========================================== -->
        @if (activeTab() === 'pooling') {
          <div class="space-y-5">
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#20B2AA] flex items-center space-x-2">
                  <mat-icon class="text-sm">pie_chart</mat-icon>
                  <span>v4 Dependency Pooling Architecture</span>
                </h3>
                <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed max-w-2xl">
                  Isolate shared dependencies into separate pools. Useful when micro-frontends require incompatible version trees or cross-framework runtimes (e.g. React micro-frontends embedded alongside Angular hosts).
                </p>
              </div>

              <button
                type="button"
                class="px-3.5 py-1.5 rounded-lg bg-[#20B2AA] hover:bg-[#1CA099] text-[#0E1015] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                (click)="showCreatePoolModal.set(true)">
                <mat-icon class="text-xs">add</mat-icon>
                <span>Create Pool</span>
              </button>
            </div>

            <!-- Pool Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              @for (pool of federationService.pools(); track pool.id) {
                <div class="rounded-xl bg-[#14161C] border p-4 space-y-3 flex flex-col justify-between"
                  [style.border-color]="pool.color + '44'">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
                        [style.background-color]="pool.color + '22'"
                        [style.color]="pool.color">
                        {{ pool.id }}
                      </span>
                      <span class="text-[10px] font-mono text-[#8C94A8]">
                        {{ pool.isolated ? 'ISOLATED' : 'SHARED ROOT' }}
                      </span>
                    </div>

                    <h4 class="font-['Comfortaa'] font-bold text-sm text-[#F5FFFA]">{{ pool.name }}</h4>
                    <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed">{{ pool.description }}</p>
                  </div>

                  <div class="pt-3 border-t border-white/5 space-y-2">
                    <span class="text-[10px] font-mono text-[#8C94A8] block">Assigned Micro-Frontends ({{ pool.assignedRemotes.length }}):</span>
                    <div class="flex flex-wrap gap-1.5 min-h-[32px]">
                      @if (pool.assignedRemotes.length === 0) {
                        <span class="text-[11px] text-[#8C94A8]/60 italic font-mono">No remotes assigned</span>
                      } @else {
                        @for (r of pool.assignedRemotes; track r) {
                          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#F5FFFA] border border-white/10">
                            {{ r }}
                          </span>
                        }
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Remote Re-allocation Tool -->
            <div class="p-4 rounded-xl bg-[#1A1C23] border border-white/10 space-y-3">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#20B2AA]">swap_horiz</mat-icon>
                <span>Re-allocate Remote to Pool</span>
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label for="realloc-remote" class="block text-[10px] font-mono text-[#8C94A8] mb-1">SELECT REMOTE</label>
                  <select
                    id="realloc-remote"
                    [formControl]="reallocRemoteControl"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA]">
                    @for (r of federationService.remotes(); track r.name) {
                      <option [value]="r.name">{{ r.name }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label for="realloc-pool" class="block text-[10px] font-mono text-[#8C94A8] mb-1">TARGET POOL</label>
                  <select
                    id="realloc-pool"
                    [formControl]="reallocPoolControl"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA]">
                    @for (p of federationService.pools(); track p.id) {
                      <option [value]="p.id">{{ p.name }} ({{ p.id }})</option>
                    }
                  </select>
                </div>

                <div class="flex items-end">
                  <button
                    type="button"
                    class="w-full px-4 py-2 bg-[#20B2AA] hover:bg-[#1CA099] text-[#0E1015] text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                    (click)="applyPoolReallocation()">
                    Assign Pool
                  </button>
                </div>
              </div>
            </div>

            <!-- Create Pool Modal -->
            @if (showCreatePoolModal()) {
              <div class="p-4 rounded-xl bg-[#1A1C23] border border-[#20B2AA]/40 space-y-3 animate-in fade-in duration-200">
                <div class="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#20B2AA]">Create Custom Dependency Pool</h4>
                  <button type="button" class="text-xs text-[#8C94A8] hover:text-white" (click)="showCreatePoolModal.set(false)">
                    Cancel
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    [formControl]="newPoolNameControl"
                    placeholder="Pool Name (e.g. Legacy React Pool)"
                    class="px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    [formControl]="newPoolDescControl"
                    placeholder="Description"
                    class="px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white"
                  />
                  <button
                    type="button"
                    class="px-4 py-2 bg-[#20B2AA] hover:bg-[#1CA099] text-[#0E1015] text-xs font-bold rounded-lg cursor-pointer"
                    (click)="onCreatePoolSubmit()">
                    Save & Initialize Pool
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 4: EVENT REGISTRY (window.__NF_REGISTRY__) -->
        <!-- ========================================== -->
        @if (activeTab() === 'events') {
          <div class="space-y-4">
            <!-- Theory Banner -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#E0218A] flex items-center space-x-2">
                  <mat-icon class="text-sm">podcasts</mat-icon>
                  <span>window.__NF_REGISTRY__ Event Stream & Shared Cache</span>
                </h3>
                <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed max-w-2xl">
                  Decoupled cross-MFE pub/sub bus. Remotes emit and subscribe without tight imports, preventing race conditions during asynchronous module initialization.
                </p>
              </div>

              <div class="flex items-center space-x-2">
                <span class="text-[10px] font-mono text-[#3EB991] px-2 py-1 rounded bg-[#14532D]/30 border border-[#3EB991]/40">
                  Global Bus Live
                </span>
              </div>
            </div>

            <!-- Interactive Event Dispatcher -->
            <div class="p-4 rounded-xl bg-[#1A1C23] border border-[#E0218A]/30 space-y-3">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#E0218A]">send</mat-icon>
                <span>Broadcast Event to window.__NF_REGISTRY__</span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label for="ev-ch" class="block text-[10px] font-mono text-[#8C94A8] mb-1">CHANNEL</label>
                  <select
                    id="ev-ch"
                    [formControl]="eventChannelControl"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA]">
                    <option value="system">system</option>
                    <option value="navigation">navigation</option>
                    <option value="security">security</option>
                    <option value="mfe">mfe</option>
                    <option value="user">user</option>
                  </select>
                </div>

                <div>
                  <label for="ev-tp" class="block text-[10px] font-mono text-[#8C94A8] mb-1">EVENT TYPE</label>
                  <input
                    id="ev-tp"
                    type="text"
                    [formControl]="eventTypeControl"
                    placeholder="MFE_CUSTOM_ACTION"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA] font-mono"
                  />
                </div>

                <div>
                  <label for="ev-src" class="block text-[10px] font-mono text-[#8C94A8] mb-1">SOURCE</label>
                  <input
                    id="ev-src"
                    type="text"
                    [formControl]="eventSourceControl"
                    placeholder="DevTools Console"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-[#F5FFFA]"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    type="button"
                    class="w-full px-4 py-2 bg-[#E0218A] hover:bg-[#FF2A9D] text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                    (click)="dispatchCustomEvent()">
                    Emit Event
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Events Stream Table -->
            <div class="rounded-xl bg-[#14161C] border border-white/10 overflow-hidden shadow-lg">
              <div class="p-3 border-b border-white/10 flex items-center justify-between text-xs">
                <span class="font-['Comfortaa'] font-semibold text-[#F5FFFA]">Recent Event Registry Dispatches</span>
                <span class="text-[10px] font-mono text-[#8C94A8]">{{ federationService.eventRegistryStream().length }} Events Logged</span>
              </div>

              <div class="overflow-x-auto max-h-72 overflow-y-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-[#0E1015] text-[#8C94A8] font-mono text-[10px] uppercase border-b border-white/5 sticky top-0">
                    <tr>
                      <th class="py-2.5 px-3">Time</th>
                      <th class="py-2.5 px-3">Channel</th>
                      <th class="py-2.5 px-3">Type</th>
                      <th class="py-2.5 px-3">Source</th>
                      <th class="py-2.5 px-4">Payload Summary</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono text-[11px]">
                    @for (ev of federationService.eventRegistryStream(); track ev.id) {
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-2 px-3 text-[#8C94A8] tabular-nums whitespace-nowrap">{{ formatTime(ev.timestamp) }}</td>
                        <td class="py-2 px-3">
                          <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold"
                            [class.bg-[#3EB991]/20]="ev.channel === 'system'"
                            [class.text-[#3EB991]]="ev.channel === 'system'"
                            [class.bg-[#20B2AA]/20]="ev.channel === 'routing' || ev.channel === 'navigation'"
                            [class.text-[#20B2AA]]="ev.channel === 'routing' || ev.channel === 'navigation'"
                            [class.bg-[#E0218A]/20]="ev.channel === 'mfe' || ev.channel === 'user'"
                            [class.text-[#FF2A9D]]="ev.channel === 'mfe' || ev.channel === 'user'"
                            [class.bg-purple-500/20]="ev.channel === 'security'"
                            [class.text-purple-300]="ev.channel === 'security'">
                            {{ ev.channel }}
                          </span>
                        </td>
                        <td class="py-2 px-3 text-[#F5FFFA] font-bold">{{ ev.type }}</td>
                        <td class="py-2 px-3 text-[#8C94A8]">{{ ev.source }}</td>
                        <td class="py-2 px-4 text-[#8C94A8] truncate max-w-xs">{{ stringifyPayload(ev.payload) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Shared Cross-MFE Resources -->
            <div class="rounded-xl bg-[#14161C] border border-white/10 p-4 space-y-3">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#20B2AA]">inventory_2</mat-icon>
                <span>Cross-MFE Shared Resources (window.__NF_REGISTRY__.registerResource)</span>
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                @for (res of federationService.sharedResources(); track res.key) {
                  <div class="p-3 rounded-lg bg-[#0E1015] border border-white/5 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-mono text-[#20B2AA] font-bold">{{ res.key }}</span>
                      <span class="text-[9px] font-mono text-[#8C94A8]">{{ res.type }}</span>
                    </div>
                    <p class="text-[10px] text-[#8C94A8] font-mono truncate">{{ res.valueSummary }}</p>
                    <span class="text-[9px] text-[#8C94A8]/60 block font-mono">By {{ res.sourceRemote }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 5: IMPORT MAP & SRI SECURITY -->
        <!-- ========================================== -->
        @if (activeTab() === 'importmap') {
          <div class="space-y-4">
            <!-- Theory & SRI Controls -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#20B2AA] flex items-center space-x-2">
                  <mat-icon class="text-sm">security</mat-icon>
                  <span>Browser-Native Import Map & Subresource Integrity</span>
                </h3>
                <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed max-w-2xl">
                  Native Federation eliminates bundler-specific runtimes by generating standardized W3C <code class="text-[#3EB991] font-mono">&lt;script type="importmap"&gt;</code> 
                  tags. Each remote entry and exposed chunk is verified with SHA-384 cryptographic integrity hashes.
                </p>
              </div>

              <!-- SRI Policy Toggle -->
              <div class="flex items-center space-x-2 text-xs">
                <span class="text-[#8C94A8] font-mono text-[11px]">SRI Mode:</span>
                <select
                  [value]="federationService.sriPolicy()"
                  (change)="onSriChange($event)"
                  class="px-2.5 py-1 rounded bg-[#0E1015] border border-white/10 text-xs text-[#20B2AA] font-mono">
                  <option value="enforce">Enforce (Strict Integrity)</option>
                  <option value="warn">Warn (Log Mismatch)</option>
                  <option value="disabled">Disabled (Local Dev)</option>
                </select>
              </div>
            </div>

            <!-- Import Map Code Display -->
            <div class="rounded-xl bg-[#08090C] border border-white/10 overflow-hidden shadow-xl">
              <div class="p-3 border-b border-white/5 flex items-center justify-between text-xs">
                <div class="flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span class="font-mono text-[#8C94A8] text-[11px] ml-2">&lt;script type="importmap"&gt;</span>
                </div>

                <button
                  type="button"
                  class="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1 cursor-pointer"
                  (click)="copyImportMap()">
                  <mat-icon class="text-xs">{{ copiedImportMap() ? 'check' : 'content_copy' }}</mat-icon>
                  <span>{{ copiedImportMap() ? 'Copied JSON!' : 'Copy Import Map' }}</span>
                </button>
              </div>

              <pre class="p-4 font-mono text-xs text-[#79f6ed] overflow-x-auto max-h-80 leading-relaxed select-text">{{ federationService.importMapJson() }}</pre>
            </div>

            <!-- SSR / Node.js Federation Hooks Section -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 space-y-2">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#3EB991]">dns</mat-icon>
                <span>Node.js SSR Loader Hook (initNodeFederation)</span>
              </h4>
              <p class="text-xs text-[#8C94A8] leading-relaxed">
                For server-side rendering in Angular 22, the Orchestrator registers an ECMAScript module loader hook via 
                <code class="text-[#20B2AA] font-mono">module.register(&#64;softarc/native-federation-orchestrator/node)</code>.
                This enables seamless server-side hydration for federated micro-frontends without client-side waterfalls.
              </p>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 6: CONFIG & SCAFFOLDING GENERATOR -->
        <!-- ========================================== -->
        @if (activeTab() === 'config') {
          <div class="space-y-4">
            <!-- Options Bar -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 space-y-3">
              <h3 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-sm text-[#3EB991]">tune</mat-icon>
                <span>Federation Config Compiler Settings</span>
              </h3>

              <div class="flex flex-wrap items-center gap-4 text-xs">
                <label class="flex items-center space-x-2 cursor-pointer text-[#8C94A8] hover:text-white">
                  <input
                    type="checkbox"
                    [checked]="genDenseChunking()"
                    (change)="genDenseChunking.set(!genDenseChunking())"
                    class="accent-[#20B2AA]"
                  />
                  <span>Dense Chunking (Optimized metadata)</span>
                </label>

                <label class="flex items-center space-x-2 cursor-pointer text-[#8C94A8] hover:text-white">
                  <input
                    type="checkbox"
                    [checked]="genIgnoreUnused()"
                    (change)="genIgnoreUnused.set(!genIgnoreUnused())"
                    class="accent-[#20B2AA]"
                  />
                  <span>Ignore Unused Dependencies</span>
                </label>

                <label class="flex items-center space-x-2 cursor-pointer text-[#8C94A8] hover:text-white">
                  <input
                    type="checkbox"
                    [checked]="genCoreSecondaries()"
                    (change)="genCoreSecondaries.set(!genCoreSecondaries())"
                    class="accent-[#20B2AA]"
                  />
                  <span>Include &#64;angular/core Secondaries</span>
                </label>
              </div>
            </div>

            <!-- Generated federation.config.mjs -->
            <div class="rounded-xl bg-[#08090C] border border-white/10 overflow-hidden shadow-xl">
              <div class="p-3 border-b border-white/5 flex items-center justify-between text-xs">
                <span class="font-mono text-[#8C94A8] text-[11px]">federation.config.mjs</span>
                <button
                  type="button"
                  class="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1 cursor-pointer"
                  (click)="copyConfigFile()">
                  <mat-icon class="text-xs">{{ copiedConfig() ? 'check' : 'content_copy' }}</mat-icon>
                  <span>{{ copiedConfig() ? 'Copied File!' : 'Copy Code' }}</span>
                </button>
              </div>

              <pre class="p-4 font-mono text-xs text-[#82f8cc] overflow-x-auto leading-relaxed select-text">{{ generatedConfig() }}</pre>
            </div>

            <!-- CLI Scaffolding Recipes -->
            <div class="p-4 rounded-xl bg-[#14161C] border border-white/10 space-y-3">
              <h4 class="font-['Comfortaa'] font-semibold text-xs text-[#F5FFFA] flex items-center space-x-2">
                <mat-icon class="text-xs text-[#20B2AA]">terminal</mat-icon>
                <span>Angular CLI Scaffolding Recipes</span>
              </h4>

              <div class="space-y-2 text-xs font-mono">
                <div class="p-3 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                  <span class="text-[#8C94A8] select-all">ng add &#64;angular-architects/native-federation --project host --port 3000 --type host</span>
                </div>
                <div class="p-3 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                  <span class="text-[#8C94A8] select-all">ng add &#64;angular-architects/native-federation --project remote --port 3001 --type remote</span>
                </div>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class NativeFederationStudioComponent {
  @Input() pid?: string;

  protected readonly federationService = inject(NativeFederationService);
  protected readonly windowManager = inject(WindowManagerService);
  private readonly fb = inject(FormBuilder);

  public readonly activeTab = signal<'remotes' | 'resolver' | 'pooling' | 'events' | 'importmap' | 'config'>('remotes');
  public readonly showRegisterForm = signal<boolean>(false);
  public readonly showCreatePoolModal = signal<boolean>(false);
  public readonly isProbingAll = signal<boolean>(false);

  public readonly copiedImportMap = signal<boolean>(false);
  public readonly copiedConfig = signal<boolean>(false);

  public readonly selectedSharedConfig = signal<SharedDependencyConfig | null>(null);
  public readonly latestRegistryEvent = signal<NFRegistryEvent | null>(null);
  public readonly activeSharedResource = signal<NFSharedResource | null>(null);

  public inspectSharedConfig(cfg: SharedDependencyConfig): void {
    this.selectedSharedConfig.set(cfg);
  }

  public recordDispatchedEvent(evt: NFRegistryEvent): void {
    this.latestRegistryEvent.set(evt);
  }

  public trackSharedResource(res: NFSharedResource): void {
    this.activeSharedResource.set(res);
  }

  public readonly tabs = [
    { id: 'remotes', label: 'Remotes & Registry', icon: 'dns' },
    { id: 'resolver', label: 'Version Resolver', icon: 'balance' },
    { id: 'pooling', label: 'Dependency Pooling', icon: 'pie_chart' },
    { id: 'events', label: 'Event Registry', icon: 'podcasts' },
    { id: 'importmap', label: 'Import Map & SRI', icon: 'security' },
    { id: 'config', label: 'Config Generator', icon: 'code' },
  ] as const;

  // Remote registration form
  public readonly remoteForm: FormGroup = this.fb.group({
    remoteName: ['', [Validators.required, Validators.pattern(/^[a-z0-9-_]+$/)]],
    remoteEntry: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    exposedModule: ['./Component', Validators.required],
    poolId: ['pool-0', Validators.required],
    description: ['Dynamic Micro-Frontend']
  });

  // Simulator controls
  public readonly simPackageControl = new FormControl<string>('@angular/core', { nonNullable: true });
  public readonly simVersionControl = new FormControl<string>('^22.0.0', { nonNullable: true });
  public readonly simResult = signal<{
    decision: 'compatible' | 'upgrade_required' | 'isolate_to_pool';
    resolvedVersion: string;
    message: string;
    suggestedPool?: string;
  } | null>(null);

  // Pool reallocation controls
  public readonly reallocRemoteControl = new FormControl<string>('remote-analytics', { nonNullable: true });
  public readonly reallocPoolControl = new FormControl<string>('pool-1', { nonNullable: true });

  // Create pool controls
  public readonly newPoolNameControl = new FormControl<string>('', { nonNullable: true });
  public readonly newPoolDescControl = new FormControl<string>('', { nonNullable: true });

  // Event dispatcher controls
  public readonly eventChannelControl = new FormControl<string>('mfe', { nonNullable: true });
  public readonly eventTypeControl = new FormControl<string>('STATE_MUTATION_BROADCAST', { nonNullable: true });
  public readonly eventSourceControl = new FormControl<string>('Studio DevTools', { nonNullable: true });

  // Config generator options
  public readonly genDenseChunking = signal<boolean>(true);
  public readonly genIgnoreUnused = signal<boolean>(true);
  public readonly genCoreSecondaries = signal<boolean>(true);

  public readonly generatedConfig = computed(() => {
    return this.federationService.generateFederationConfigFile({
      appName: 'app',
      denseChunking: this.genDenseChunking(),
      ignoreUnusedDeps: this.genIgnoreUnused(),
      includeCoreSecondaries: this.genCoreSecondaries()
    });
  });

  public getPool(poolId?: string): DependencyPool | undefined {
    return this.federationService.pools().find(p => p.id === poolId);
  }

  public async probeSingle(remote: RemoteDefinition): Promise<void> {
    await this.federationService.probeRemote(remote);
  }

  public async probeAll(): Promise<void> {
    this.isProbingAll.set(true);
    await this.federationService.probeAllRemotes();
    this.isProbingAll.set(false);
  }

  public mountRemoteWindow(remote: RemoteDefinition): void {
    this.windowManager.openApp({
      id: remote.name,
      title: `${remote.name} (MFE)`,
      icon: 'extension',
      componentName: 'RemoteContainerComponent',
      entryComponent: 'RemoteContainerComponent',
      category: 'ai',
      isFederated: true,
      federatedConfig: { url: remote.url, exposedModule: remote.exposedModule }
    });
  }

  public async onSubmitRemote(): Promise<void> {
    if (this.remoteForm.invalid) return;
    const val = this.remoteForm.value;

    const health = await this.federationService.testRemoteHealth(val.remoteEntry);

    this.federationService.registerRemote({
      remoteName: val.remoteName,
      name: val.remoteName,
      remoteEntry: val.remoteEntry,
      url: val.remoteEntry,
      exposedModule: val.exposedModule,
      status: health.status,
      latencyMs: health.latencyMs,
      description: val.description,
      poolId: val.poolId,
      version: '1.0.0'
    });

    this.remoteForm.reset({
      exposedModule: './Component',
      poolId: 'pool-0',
      description: 'Dynamic Micro-Frontend'
    });
    this.showRegisterForm.set(false);
  }

  public runVersionSimulation(): void {
    const pkg = this.simPackageControl.value;
    const ver = this.simVersionControl.value;
    const res = this.federationService.testVersionResolution(pkg, ver);
    this.simResult.set(res);
  }

  public applyPoolReallocation(): void {
    const remote = this.reallocRemoteControl.value;
    const pool = this.reallocPoolControl.value;
    this.federationService.assignRemoteToPool(remote, pool);
  }

  public onCreatePoolSubmit(): void {
    const name = this.newPoolNameControl.value.trim();
    const desc = this.newPoolDescControl.value.trim();
    if (!name) return;
    this.federationService.createPool(name, desc, true, '#E0218A');
    this.newPoolNameControl.reset();
    this.newPoolDescControl.reset();
    this.showCreatePoolModal.set(false);
  }

  public dispatchCustomEvent(): void {
    const ch = this.eventChannelControl.value;
    const type = this.eventTypeControl.value.trim() || 'CUSTOM_EVENT';
    const src = this.eventSourceControl.value.trim() || 'Studio DevTools';
    const payload = {
      dispatchedBy: 'User DevTools',
      timestamp: Date.now()
    };
    this.federationService.dispatchRegistryEvent(ch, type, src, payload);
    const evt: NFRegistryEvent = {
      id: `evt-${Date.now()}`,
      channel: ch,
      type,
      source: src,
      payload,
      status: 'delivered',
      timestamp: Date.now()
    };
    this.recordDispatchedEvent(evt);
  }

  public onSriChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'enforce' | 'warn' | 'disabled';
    this.federationService.setSriPolicy(val);
  }

  public copyImportMap(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.federationService.importMapJson());
      this.copiedImportMap.set(true);
      setTimeout(() => this.copiedImportMap.set(false), 2000);
    }
  }

  public copyConfigFile(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.generatedConfig());
      this.copiedConfig.set(true);
      setTimeout(() => this.copiedConfig.set(false), 2000);
    }
  }

  public formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour12: false });
  }

  public stringifyPayload(payload: unknown): string {
    if (typeof payload === 'string') return payload;
    return JSON.stringify(payload);
  }
}

