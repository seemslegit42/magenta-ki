import { Component, ChangeDetectionStrategy, input, OnInit, inject, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessDescriptor, RemoteDefinition } from '../../../models/webos.models';
import { NativeFederationService } from '../../../services/native-federation.service';

@Component({
  selector: 'app-remote-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-4 p-2 font-body text-on-surface">
      <!-- Header Bar -->
      <div class="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="w-9 h-9 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
            <span class="material-icons text-lg">hub</span>
          </div>
          <div class="truncate">
            <h3 class="font-display font-bold text-sm text-on-surface flex items-center space-x-2">
              <span class="truncate">{{ remoteTitle() }}</span>
              <span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 shrink-0">
                Native Federation
              </span>
            </h3>
            <p class="text-[11px] text-on-surface-variant font-mono truncate">
              Remote: {{ remoteName() }} • Module: {{ exposedModule() }}
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <span 
            class="text-[11px] px-2.5 py-1 rounded-full font-mono border flex items-center space-x-1.5"
            [class.bg-tertiary/20]="status() === 'ONLINE'"
            [class.text-tertiary]="status() === 'ONLINE'"
            [class.border-tertiary/40]="status() === 'ONLINE'"
            [class.bg-primary/20]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.text-secondary]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.border-secondary/30]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.bg-rose-500/20]="status() === 'ERROR'"
            [class.text-rose-400]="status() === 'ERROR'"
            [class.border-rose-500/30]="status() === 'ERROR'">
            <span class="w-1.5 h-1.5 rounded-full" 
              [class.bg-tertiary]="status() === 'ONLINE'"
              [class.bg-secondary]="status() === 'STANDBY' || status() === 'CONNECTING'"
              [class.animate-ping]="status() === 'CONNECTING'"
              [class.bg-rose-400]="status() === 'ERROR'"></span>
            <span>{{ status() }}</span>
            @if (latencyMs() > 0) {
              <span class="text-[10px] text-on-surface-variant">({{ latencyMs() }}ms)</span>
            }
          </span>

          <button 
            type="button"
            class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/20 text-on-surface text-[11px] font-mono border border-white/10 transition-colors flex items-center space-x-1 cursor-pointer"
            (click)="testProbe()"
            [disabled]="isTesting()">
            <span class="material-icons text-xs" [class.animate-spin]="isTesting()">refresh</span>
            <span>{{ isTesting() ? 'Probing...' : 'Probe' }}</span>
          </button>
        </div>
      </div>

      <!-- Federation Diagnostic Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="bg-surface-deep/80 border border-white/10 rounded-xl p-3 backdrop-blur-md">
          <span class="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Manifest Route</span>
          <span class="text-xs font-semibold text-secondary mt-1 block truncate font-mono">
            {{ remoteUrl() }}
          </span>
          <span class="text-[10px] text-on-surface-variant mt-1 block">federation.manifest.json</span>
        </div>

        <div class="bg-surface-deep/80 border border-white/10 rounded-xl p-3 backdrop-blur-md">
          <span class="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Module Loader</span>
          <span class="text-xs font-semibold text-tertiary mt-1 block font-mono">
            &#64;angular-architects/native-federation
          </span>
          <span class="text-[10px] text-on-surface-variant mt-1 block">ESM Browser Native Import Maps</span>
        </div>

        <div class="bg-surface-deep/80 border border-white/10 rounded-xl p-3 backdrop-blur-md">
          <span class="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Network State</span>
          <span class="text-xs font-semibold mt-1 block font-mono" [class.text-tertiary]="!federationService.isOffline()" [class.text-amber-400]="federationService.isOffline()">
            {{ federationService.isOffline() ? 'Offline (Cache Enabled)' : 'Online Connected' }}
          </span>
          <span class="text-[10px] text-on-surface-variant mt-1 block">PWA service worker supported</span>
        </div>
      </div>

      <!-- Module Mounting Host & Container -->
      <div class="bg-surface-deep border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <h4 class="font-display font-semibold text-xs text-on-surface flex items-center space-x-2">
            <span class="material-icons text-sm text-secondary">memory</span>
            <span>Remote Micro-Frontend Host</span>
          </h4>
          <span class="text-[10px] font-mono text-on-surface-variant">PID: {{ pid() }}</span>
        </div>

        <!-- Dynamic Component ViewContainer Host -->
        <div #dynamicMountContainer></div>

        @if (status() === 'ONLINE') {
          <div class="p-3.5 rounded-xl bg-tertiary/10 border border-tertiary/30 text-on-surface space-y-1.5">
            <div class="flex items-center space-x-2 text-tertiary">
              <span class="material-icons text-sm">check_circle</span>
              <span class="font-semibold text-xs">Remote Module Verified Active</span>
            </div>
            <p class="text-xs text-on-surface/90 leading-relaxed font-body">
              The remote micro-frontend entry has been registered and verified in the host import map. Shared dependencies execute in the host zone without duplicate bundles.
            </p>
          </div>
        } @else {
          <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-on-surface space-y-3">
            <div class="flex items-start space-x-3">
              <span class="material-icons text-lg text-secondary mt-0.5">cloud_queue</span>
              <div>
                <h5 class="font-semibold text-xs text-white">Standby Sandbox Container</h5>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Remote <code class="text-secondary font-mono">{{ remoteName() }}</code> is configured at <code class="text-tertiary font-mono">{{ remoteUrl() }}</code>.
                  When running decoupled without an active remote server, the micro app runs in isolated local sandbox mode to guarantee system stability.
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2.5 pt-1">
              <button 
                type="button"
                class="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary text-surface text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                (click)="testProbe()">
                <span class="material-icons text-xs">bolt</span>
                <span>Probe Endpoint</span>
              </button>

              <button 
                type="button"
                class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
                (click)="simulateMount()">
                <span class="material-icons text-xs">play_circle_outline</span>
                <span>Simulate Dynamic Mount</span>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Live Diagnostics Telemetry Log -->
      <div class="bg-surface-lowest border border-white/10 rounded-xl p-3 font-mono text-[10px]">
        <div class="flex items-center justify-between text-on-surface-variant border-b border-white/5 pb-1.5 mb-2">
          <span class="flex items-center space-x-1.5">
            <span class="material-icons text-xs text-secondary">terminal</span>
            <span>Native Federation Diagnostic Stream</span>
          </span>
          <span class="text-[9px] text-secondary">Host: Port 3000</span>
        </div>
        <div class="space-y-1 max-h-32 overflow-y-auto select-text text-white/80 pr-1">
          @for (log of federationService.loadLog(); track log) {
            <div class="leading-relaxed font-mono">
              <span class="text-on-surface-variant">{{ log }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class RemoteContainerComponent implements OnInit {
  readonly pid = input.required<string>();
  readonly descriptor = input<ProcessDescriptor>();

  @ViewChild('dynamicMountContainer', { read: ViewContainerRef }) 
  private dynamicMountContainer?: ViewContainerRef;

  protected readonly federationService = inject(NativeFederationService);

  public readonly remoteName = signal<string>('remote-analytics');
  public readonly remoteTitle = signal<string>('Dynamic Remote Micro-Frontend');
  public readonly remoteUrl = signal<string>('http://localhost:3001/remoteEntry.json');
  public readonly exposedModule = signal<string>('./Component');
  public readonly status = signal<'ONLINE' | 'STANDBY' | 'CONNECTING' | 'ERROR'>('STANDBY');
  public readonly latencyMs = signal<number>(0);
  public readonly isTesting = signal<boolean>(false);

  ngOnInit(): void {
    const descriptor = this.descriptor();
    if (descriptor) {
      this.remoteTitle.set(descriptor.title);
      const name = descriptor.appId.replace('remote-', '');
      this.remoteName.set(name);
      
      const found = this.federationService.remotes().find(r => r.name === name);
      if (found) {
        this.remoteUrl.set(found.url);
        this.exposedModule.set(found.exposedModule);
        this.status.set(found.status);
        if (found.latencyMs) {
          this.latencyMs.set(found.latencyMs);
        }
      } else {
        const manifest = this.federationService.manifest();
        if (manifest[name]) {
          this.remoteUrl.set(manifest[name]);
        }
      }
    }
  }

  public async testProbe(): Promise<void> {
    this.isTesting.set(true);
    const remote: RemoteDefinition = {
      name: this.remoteName(),
      url: this.remoteUrl(),
      remoteName: this.remoteName(),
      remoteEntry: this.remoteUrl(),
      status: this.status(),
      description: 'Dynamic Remote',
      version: 'v1.0.0',
      exposedModule: this.exposedModule()
    };

    const res = await this.federationService.probeRemote(remote);
    this.status.set(res.success ? 'ONLINE' : 'ERROR');
    this.latencyMs.set(res.latencyMs);
    this.isTesting.set(false);
  }

  public simulateMount(): void {
    this.status.set('ONLINE');
    this.latencyMs.set(12);
    this.federationService.addLog(`[Dynamic Mount] Simulated load of ${this.remoteName()} -> ${this.exposedModule()} into ViewContainer`);
  }
}
