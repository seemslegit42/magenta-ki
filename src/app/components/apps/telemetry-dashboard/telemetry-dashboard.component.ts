import { Component, inject } from '@angular/core';
import { TelemetryService } from '../../../services/telemetry.service';
import { signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';

interface MeshNode {
  name: string;
  role: string;
  pool: string;
  latency: number;
  status: 'healthy' | 'warning' | 'degraded';
  heapMb: number;
}

@Component({
  selector: 'app-telemetry-dashboard',
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="h-full flex flex-col bg-surface-container font-body-md text-on-surface select-none overflow-y-auto">
      <!-- Top Enterprise Telemetry Bar -->
      <header class="p-4 md:p-5 bg-surface-container-high border-b border-outline/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta shadow-[0_0_15px_rgba(224,33,138,0.25)]">
            <mat-icon class="text-xl">speed</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-headline-sm font-display tracking-tight text-on-surface">ΛΞV Mesh Telemetry</h1>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-surface-container-highest border border-outline/30 text-secondary">
                V4.8-CORE
              </span>
            </div>
            <p class="text-xs text-on-surface-variant font-mono">Real-time anomalous energy vectors & microfrontend heartbeat stream</p>
          </div>
        </div>

        <!-- Live Status Indicators -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dim border border-outline/20 text-xs font-mono">
            <span class="w-2.5 h-2.5 rounded-full"
                  [class]="telemetry.isLiveConnected() ? 'bg-secondary animate-pulse shadow-[0_0_8px_#20B2AA]' : 'bg-tertiary animate-pulse shadow-[0_0_8px_#3EB991]'"></span>
            <span class="text-on-surface-variant">STREAM:</span>
            <span [class]="telemetry.isLiveConnected() ? 'text-secondary font-semibold' : 'text-tertiary font-semibold'">
              {{ telemetry.isLiveConnected() ? 'LIVE SSE' : 'SIM PULSE' }}
            </span>
          </div>

          <button
            (click)="triggerStressPulse()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-dim hover:bg-surface-bright text-xs font-mono border border-outline/30 hover:border-magenta/50 text-magenta transition-all active:scale-95"
            title="Inject simulated load vector">
            <mat-icon class="text-sm">bolt</mat-icon>
            <span>PULSE SPIKE</span>
          </button>
        </div>
      </header>

      <!-- Main Dashboard Grid -->
      <div class="p-4 md:p-6 space-y-6 flex-1">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <!-- CPU Card -->
          <div class="p-4 bg-surface-dim/80 rounded-xl border border-outline/20 relative overflow-hidden group hover:border-secondary/40 transition-all">
            <div class="flex items-center justify-between text-label-sm text-on-surface-variant mb-1 font-mono">
              <span>CPU LOAD</span>
              <mat-icon class="text-base text-secondary">memory</mat-icon>
            </div>
            <div class="text-2xl md:text-3xl font-display font-bold text-on-surface tabular-nums">
              {{ telemetry.metrics().cpu | number:'1.1-1' }}%
            </div>
            <div class="mt-2 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div class="bg-secondary h-full transition-all duration-500 rounded-full"
                   [style.width.%]="telemetry.metrics().cpu"></div>
            </div>
            <div class="mt-1 text-[10px] text-on-surface-variant/70 font-mono">Threshold: 85% nominal</div>
          </div>

          <!-- GPU Card -->
          <div class="p-4 bg-surface-dim/80 rounded-xl border border-outline/20 relative overflow-hidden group hover:border-primary/40 transition-all">
            <div class="flex items-center justify-between text-label-sm text-on-surface-variant mb-1 font-mono">
              <span>GPU ENGINE</span>
              <mat-icon class="text-base text-primary-fixed-dim">developer_board</mat-icon>
            </div>
            <div class="text-2xl md:text-3xl font-display font-bold text-on-surface tabular-nums">
              {{ telemetry.metrics().gpu | number:'1.1-1' }}%
            </div>
            <div class="mt-2 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div class="bg-primary h-full transition-all duration-500 rounded-full"
                   [style.width.%]="telemetry.metrics().gpu"></div>
            </div>
            <div class="mt-1 text-[10px] text-on-surface-variant/70 font-mono">WebGL / Three.js Pipeline</div>
          </div>

          <!-- Memory Card -->
          <div class="p-4 bg-surface-dim/80 rounded-xl border border-outline/20 relative overflow-hidden group hover:border-tertiary/40 transition-all">
            <div class="flex items-center justify-between text-label-sm text-on-surface-variant mb-1 font-mono">
              <span>HEAP ALLOC</span>
              <mat-icon class="text-base text-tertiary">storage</mat-icon>
            </div>
            <div class="text-2xl md:text-3xl font-display font-bold text-on-surface tabular-nums">
              {{ telemetry.metrics().memory | number:'1.1-1' }}%
            </div>
            <div class="mt-2 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div class="bg-tertiary h-full transition-all duration-500 rounded-full"
                   [style.width.%]="telemetry.metrics().memory"></div>
            </div>
            <div class="mt-1 text-[10px] text-on-surface-variant/70 font-mono">Zoneless reactive heap</div>
          </div>

          <!-- IOPS Card -->
          <div class="p-4 bg-surface-dim/80 rounded-xl border border-outline/20 relative overflow-hidden group hover:border-outline/50 transition-all">
            <div class="flex items-center justify-between text-label-sm text-on-surface-variant mb-1 font-mono">
              <span>I/O OPS</span>
              <mat-icon class="text-base text-on-surface-variant">sync_alt</mat-icon>
            </div>
            <div class="text-2xl md:text-3xl font-display font-bold text-on-surface tabular-nums">
              {{ telemetry.metrics().iops }}
            </div>
            <div class="mt-2 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div class="bg-secondary-fixed-dim h-full transition-all duration-500 rounded-full"
                   [style.width.%]="(telemetry.metrics().iops / 2500) * 100"></div>
            </div>
            <div class="mt-1 text-[10px] text-on-surface-variant/70 font-mono">Turso LibSQL replication</div>
          </div>

          <!-- Security Anomalies Card (Chromatic Magenta conduit) -->
          <div class="col-span-2 md:col-span-1 p-4 bg-magenta-dim/15 rounded-xl border border-magenta/40 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(224,33,138,0.25)] transition-all">
            <div class="flex items-center justify-between text-label-sm text-magenta font-mono mb-1">
              <span>ANOMALIES</span>
              <mat-icon class="text-base text-magenta">security</mat-icon>
            </div>
            <div class="text-2xl md:text-3xl font-display font-bold text-magenta-glow tabular-nums">
              {{ telemetry.metrics().security_events }}
            </div>
            <div class="mt-2 w-full bg-magenta-dim/30 h-1.5 rounded-full overflow-hidden">
              <div class="bg-magenta h-full transition-all duration-500 rounded-full"
                   [style.width.%]="telemetry.metrics().security_events > 0 ? 100 : 0"></div>
            </div>
            <div class="mt-1 text-[10px] text-magenta/80 font-mono">
              {{ telemetry.metrics().security_events === 0 ? 'Zero active breaches' : 'Cognitive excitation spike' }}
            </div>
          </div>
        </div>

        <!-- SVG Timeline Graph -->
        <div class="p-4 md:p-5 bg-surface-dim/70 rounded-xl border border-outline/20">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2">
              <mat-icon class="text-secondary text-lg">show_chart</mat-icon>
              <h2 class="text-sm font-semibold text-on-surface font-display tracking-wide">Dynamic Vector Stream (CPU vs Heap Memory)</h2>
            </div>
            <div class="flex items-center gap-4 text-xs font-mono">
              <div class="flex items-center gap-1.5 text-secondary">
                <span class="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                <span>CPU (%)</span>
              </div>
              <div class="flex items-center gap-1.5 text-tertiary">
                <span class="w-2.5 h-2.5 rounded-sm bg-tertiary"></span>
                <span>HEAP (%)</span>
              </div>
              <div class="flex items-center gap-1.5 text-magenta">
                <span class="w-2.5 h-2.5 rounded-sm bg-magenta"></span>
                <span>GPU (%)</span>
              </div>
            </div>
          </div>

          <!-- Dynamic SVG Sparklines -->
          <div class="relative w-full h-36 bg-surface-container-lowest/80 rounded-lg p-2 border border-outline/10 flex items-end overflow-hidden">
            <!-- Grid lines -->
            <div class="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
              <div class="border-b border-on-surface/20 text-[9px] font-mono text-on-surface-variant">100%</div>
              <div class="border-b border-on-surface/20 text-[9px] font-mono text-on-surface-variant">50%</div>
              <div class="border-b border-on-surface/20 text-[9px] font-mono text-on-surface-variant">0%</div>
            </div>

            <!-- SVG Curves -->
            <svg class="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 400 100">
              <!-- CPU Path -->
              <path [attr.d]="cpuPath()" fill="none" stroke="#20B2AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Memory Path -->
              <path [attr.d]="memoryPath()" fill="none" stroke="#3EB991" stroke-width="2.5" stroke-dasharray="3,3" stroke-linecap="round" stroke-linejoin="round" />
              <!-- GPU Path -->
              <path [attr.d]="gpuPath()" fill="none" stroke="#E0218A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-2 px-1">
            <span>T - 30s</span>
            <span>Real-time High Frequency Telemetry (2000ms window)</span>
            <span>Now</span>
          </div>
        </div>

        <!-- Microfrontend Mesh Nodes Status -->
        <div class="p-4 md:p-5 bg-surface-dim/70 rounded-xl border border-outline/20">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <mat-icon class="text-magenta text-lg">hub</mat-icon>
              <h2 class="text-sm font-semibold text-on-surface font-display tracking-wide">Federation Mesh Active Nodes</h2>
            </div>
            <button
              (click)="pingNodes()"
              class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-xs font-mono text-on-surface-variant hover:text-on-surface border border-outline/30 transition-all flex items-center gap-1">
              <mat-icon class="text-xs">refresh</mat-icon>
              <span>PING MESH</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead>
                <tr class="border-b border-outline/20 text-on-surface-variant">
                  <th class="pb-2 font-medium">NODE / REMOTE</th>
                  <th class="pb-2 font-medium">ROLE</th>
                  <th class="pb-2 font-medium">DEPENDENCY POOL</th>
                  <th class="pb-2 font-medium">LATENCY</th>
                  <th class="pb-2 font-medium">HEAP FOOTPRINT</th>
                  <th class="pb-2 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline/10">
                @for (node of meshNodes(); track node.name) {
                  <tr class="hover:bg-surface-container-high/40 transition-colors">
                    <td class="py-2.5 flex items-center gap-2 text-on-surface font-semibold">
                      <span class="w-2 h-2 rounded-full"
                            [class]="node.status === 'healthy' ? 'bg-secondary' : 'bg-tertiary'"></span>
                      <span>{{ node.name }}</span>
                    </td>
                    <td class="py-2.5 text-on-surface-variant">{{ node.role }}</td>
                    <td class="py-2.5">
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-highest border border-outline/20 text-on-surface">
                        {{ node.pool }}
                      </span>
                    </td>
                    <td class="py-2.5 font-bold" [class]="node.latency < 40 ? 'text-secondary' : 'text-on-surface'">
                      {{ node.latency }}ms
                    </td>
                    <td class="py-2.5 text-on-surface-variant">{{ node.heapMb }} MB</td>
                    <td class="py-2.5 text-right">
                      <span class="px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold bg-secondary/15 text-secondary border border-secondary/30">
                        {{ node.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TelemetryDashboardComponent {
  protected readonly telemetry = inject(TelemetryService);

  protected readonly meshNodes = signal<MeshNode[]>([
    { name: 'host-gateway', role: 'Federation Host Orchestrator', pool: 'pool-0 (Core)', latency: 8, status: 'healthy', heapMb: 14.2 },
    { name: 'remote-analytics', role: 'Real-time Telemetry Visualizer', pool: 'pool-0 (Core)', latency: 22, status: 'healthy', heapMb: 8.6 },
    { name: 'remote-copilot', role: 'Cognitive LLM Assistant', pool: 'pool-1 (Productivity)', latency: 34, status: 'healthy', heapMb: 12.1 },
    { name: 'remote-wopi-editor', role: 'Collaborative Document Engine', pool: 'pool-1 (Productivity)', latency: 29, status: 'healthy', heapMb: 19.4 },
    { name: 'turso-edge-mesh', role: 'LibSQL Distributed Replica', pool: 'pool-2 (Isolated)', latency: 45, status: 'healthy', heapMb: 6.8 },
  ]);

  protected readonly cpuPath = computed(() => {
    const hist = this.telemetry.history();
    if (hist.length < 2) return 'M 0,50 L 400,50';
    return this.buildSvgPath(hist.map(p => p.cpu));
  });

  protected readonly memoryPath = computed(() => {
    const hist = this.telemetry.history();
    if (hist.length < 2) return 'M 0,50 L 400,50';
    return this.buildSvgPath(hist.map(p => p.memory));
  });

  protected readonly gpuPath = computed(() => {
    const hist = this.telemetry.history();
    if (hist.length < 2) return 'M 0,50 L 400,50';
    return this.buildSvgPath(hist.map(p => p.gpu));
  });

  private buildSvgPath(values: number[]): string {
    const width = 400;
    const height = 100;
    const step = width / (values.length - 1 || 1);
    return values.map((val, idx) => {
      const x = idx * step;
      const clamped = Math.max(0, Math.min(100, val));
      const y = height - (clamped / 100) * (height - 10) - 5;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  protected triggerStressPulse() {
    const current = this.telemetry.metrics();
    this.telemetry.metrics.set({
      ...current,
      cpu: 89.4,
      gpu: 94.2,
      iops: 2840,
      security_events: current.security_events + 1
    });
  }

  protected pingNodes() {
    this.meshNodes.update(nodes =>
      nodes.map(n => ({
        ...n,
        latency: Math.max(6, Math.floor(n.latency + (Math.random() * 10 - 5)))
      }))
    );
  }
}

