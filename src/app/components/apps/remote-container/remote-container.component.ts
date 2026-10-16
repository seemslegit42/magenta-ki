import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ProcessDescriptor } from '../../../models/webos.models';
import { NativeFederationService } from '../../../services/native-federation.service';
import { RemoteDefinition } from '../../../models/webos.models';

@Component({
  selector: 'app-remote-container',
  standalone: true,
  template: `
    <div class="space-y-5 p-2 font-body text-[#F5FFFA]">
      <!-- Header Bar -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-[#6A0DAD]/30 border border-[#6A0DAD]/50 flex items-center justify-center text-[#20B2AA]">
            <span class="material-icons text-xl">layers</span>
          </div>
          <div>
            <h3 class="font-display font-bold text-base text-white flex items-center space-x-2">
              <span>{{ remoteTitle() }}</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20B2AA]/20 text-[#20B2AA] border border-[#20B2AA]/30">
                Angular 22 Native Federation
              </span>
            </h3>
            <p class="text-xs text-[#8C94A8] mt-0.5 font-mono">
              Remote: {{ remoteName() }} • Exposed: {{ exposedModule() }}
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span 
            class="text-xs px-2.5 py-1 rounded-full font-mono border flex items-center space-x-1.5"
            [class.bg-[#3EB991]/20]="status() === 'ONLINE'"
            [class.text-[#3EB991]]="status() === 'ONLINE'"
            [class.border-[#3EB991]/40]="status() === 'ONLINE'"
            [class.bg-[#6A0DAD]/20]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.text-[#20B2AA]]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.border-[#20B2AA]/30]="status() === 'STANDBY' || status() === 'CONNECTING'"
            [class.bg-rose-500/20]="status() === 'ERROR'"
            [class.text-rose-400]="status() === 'ERROR'"
            [class.border-rose-500/30]="status() === 'ERROR'">
            <span class="w-2 h-2 rounded-full" 
              [class.bg-[#3EB991]]="status() === 'ONLINE'"
              [class.bg-[#20B2AA]]="status() === 'STANDBY' || status() === 'CONNECTING'"
              [class.animate-ping]="status() === 'CONNECTING'"
              [class.bg-rose-400]="status() === 'ERROR'"></span>
            <span>{{ status() }}</span>
          </span>

          <button 
            class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1"
            (click)="testProbe()"
            [disabled]="isTesting()">
            <span class="material-icons text-xs" [class.animate-spin]="isTesting()">refresh</span>
            <span>{{ isTesting() ? 'Probing...' : 'Probe Remote' }}</span>
          </button>
        </div>
      </div>

      <!-- Federation Runtime Specs Banner -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
          <span class="text-[11px] text-[#8C94A8] font-mono uppercase tracking-wider block">Manifest Route</span>
          <span class="text-xs font-semibold text-white mt-1 block truncate font-mono text-[#20B2AA]">
            {{ remoteUrl() }}
          </span>
          <span class="text-[10px] text-[#8C94A8] mt-1 block">Configured via federation.manifest.json</span>
        </div>

        <div class="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
          <span class="text-[11px] text-[#8C94A8] font-mono uppercase tracking-wider block">ESM Import Engine</span>
          <span class="text-xs font-semibold text-white mt-1 block font-mono text-[#3EB991]">
            W3C Native Import Maps & Polyfill
          </span>
          <span class="text-[10px] text-[#8C94A8] mt-1 block">Orchestrator v4 with es-module-shims</span>
        </div>

        <div class="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
          <span class="text-[11px] text-[#8C94A8] font-mono uppercase tracking-wider block">Shared Singletons</span>
          <span class="text-xs font-semibold text-white mt-1 block font-mono text-[#FF2A9D]">
            &#64;angular/core 22.2.0 (Strict)
          </span>
          <span class="text-[10px] text-[#8C94A8] mt-1 block">includeSecondaries enabled in config</span>
        </div>
      </div>

      <!-- Dynamic Loading Status & Sandbox Visualizer -->
      <div class="bg-[#151922] border border-white/10 rounded-xl p-5">
        <div class="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <h4 class="font-display font-semibold text-sm text-white flex items-center space-x-2">
            <span class="material-icons text-base text-[#20B2AA]">memory</span>
            <span>Dynamic Remote Module State</span>
          </h4>
          <span class="text-[11px] font-mono text-[#8C94A8]">loadRemoteModule() Lifecycle</span>
        </div>

        @if (status() === 'ONLINE') {
          <div class="p-4 rounded-lg bg-[#3EB991]/10 border border-[#3EB991]/30 text-white space-y-2">
            <div class="flex items-center space-x-2 text-[#3EB991]">
              <span class="material-icons text-base">check_circle</span>
              <span class="font-semibold text-xs">Remote Module Loaded Successfully</span>
            </div>
            <p class="text-xs text-[#F5FFFA] leading-relaxed">
              The remote micro-frontend entry has been registered in the host W3C Import Map. All shared dependencies (Angular Core, Common, Router, Material) are bound to the host root injector without version drift.
            </p>
          </div>
        } @else {
          <div class="p-4 rounded-lg bg-white/5 border border-white/10 text-white space-y-3">
            <div class="flex items-start space-x-3">
              <span class="material-icons text-xl text-[#20B2AA] mt-0.5">cloud_queue</span>
              <div>
                <h5 class="font-display font-semibold text-xs text-white">Dynamic Remote Standby Mode</h5>
                <p class="text-xs text-[#8C94A8] mt-1 leading-relaxed">
                  Remote <code class="text-[#20B2AA] font-mono">{{ remoteName() }}</code> is registered in <code class="text-[#3EB991] font-mono">public/federation.manifest.json</code>.
                  In local dev or deployment environments where the remote port is external, Native Federation provides transparent fallback to prevent host crash.
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-3 pt-2">
              <button 
                class="px-4 py-2 rounded-lg bg-[#6A0DAD] hover:bg-[#E0218A] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-md"
                (click)="testProbe()">
                <span class="material-icons text-sm">bolt</span>
                <span>Probe Endpoint ({{ remoteUrl() }})</span>
              </button>

              <button 
                class="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1.5"
                (click)="simulateLoad()">
                <span class="material-icons text-sm">play_circle_outline</span>
                <span>Simulate Dynamic Mount</span>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Live Orchestrator Telemetry Logs -->
      <div class="bg-[#0A0C10] border border-white/10 rounded-xl p-4 font-mono text-[11px]">
        <div class="flex items-center justify-between text-[#8C94A8] border-b border-white/5 pb-2 mb-2">
          <span class="flex items-center space-x-1.5">
            <span class="material-icons text-xs text-[#20B2AA]">terminal</span>
            <span>Native Federation Diagnostic Log</span>
          </span>
          <span class="text-[10px] text-[#20B2AA]">&#64;angular-architects/native-federation v22</span>
        </div>
        <div class="space-y-1 max-h-36 overflow-y-auto select-text text-white/80">
          @for (log of federationService.loadLog(); track log) {
            <div class="leading-relaxed font-mono">
              <span class="text-[#8C94A8]">{{ log }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class RemoteContainerComponent implements OnInit {
  @Input({ required: true }) pid!: string;
  @Input() descriptor?: ProcessDescriptor;

  protected federationService = inject(NativeFederationService);

  public remoteName = signal<string>('remote-analytics');
  public remoteTitle = signal<string>('Dynamic Remote Module');
  public remoteUrl = signal<string>('http://localhost:3001/remoteEntry.json');
  public exposedModule = signal<string>('./Component');
  public status = signal<'ONLINE' | 'STANDBY' | 'CONNECTING' | 'ERROR'>('STANDBY');
  public isTesting = signal<boolean>(false);

  ngOnInit(): void {
    if (this.descriptor) {
      this.remoteTitle.set(this.descriptor.title);
      const name = this.descriptor.appId.replace('remote-', '');
      this.remoteName.set(name);
      
      const found = this.federationService.remotes().find(r => r.name === name);
      if (found) {
        this.remoteUrl.set(found.url);
        this.exposedModule.set(found.exposedModule);
        this.status.set(found.status);
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
      version: 'v22.2',
      exposedModule: this.exposedModule()
    };

    const res = await this.federationService.probeRemote(remote);
    this.status.set(res.success ? 'ONLINE' : 'ERROR');
    this.isTesting.set(false);
  }

  public simulateLoad(): void {
    this.status.set('ONLINE');
    this.federationService.addLog(`[Dynamic Mount] Simulated load of ${this.remoteName()} -> ${this.exposedModule()} via Native Federation adapter`);
  }
}
