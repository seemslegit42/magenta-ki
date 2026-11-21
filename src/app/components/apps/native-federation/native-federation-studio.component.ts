import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NativeFederationService } from '../../../services/native-federation.service';
import { WindowManagerService } from '../../../services/window-manager.service';

@Component({
  selector: 'app-native-federation-studio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display font-bold text-xl text-[#F5FFFA]">Native Federation Studio</h2>
          <p class="text-xs text-[#8C94A8] mt-1">Manage remote micro-frontends, validate W3C import maps, and test runtime endpoints.</p>
        </div>
        <span class="px-3 py-1 bg-[#115E59] text-[#79f6ed] text-xs font-mono rounded-lg border border-[#20B2AA]">W3C ACTIVE</span>
      </div>

      <!-- Add Remote Form -->
      <form [formGroup]="remoteForm" (ngSubmit)="onSubmit()" class="p-4 rounded-xl bg-[#1A1C23] border border-[rgba(245,255,250,0.12)] space-y-4">
        <h3 class="font-display font-semibold text-sm text-[#F5FFFA] flex items-center space-x-2">
          <mat-icon class="text-xs text-[#E0218A]">add_circle</mat-icon>
          <span>Register New Remote Micro-Frontend</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label for="nf-remote-name" class="block text-[11px] font-mono text-[#8C94A8] mb-1">REMOTE NAME</label>
            <input
              id="nf-remote-name"
              type="text"
              formControlName="remoteName"
              placeholder="e.g. billing"
              class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#E0218A]"
            />
          </div>
          <div>
            <label for="nf-remote-entry" class="block text-[11px] font-mono text-[#8C94A8] mb-1">REMOTE ENTRY URL (.json)</label>
            <input
              id="nf-remote-entry"
              type="text"
              formControlName="remoteEntry"
              placeholder="https://.../remoteEntry.json"
              class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#E0218A]"
            />
          </div>
          <div>
            <label for="nf-exposed-module" class="block text-[11px] font-mono text-[#8C94A8] mb-1">EXPOSED MODULE</label>
            <input
              id="nf-exposed-module"
              type="text"
              formControlName="exposedModule"
              placeholder="./Module"
              class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#E0218A]"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            [disabled]="remoteForm.invalid"
            class="px-5 py-2 bg-[#E0218A] hover:bg-[#FF2A9D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg transition-all flex items-center space-x-1.5"
          >
            <mat-icon class="text-xs">bolt</mat-icon>
            <span>Register & Test Remote</span>
          </button>
        </div>
      </form>

      <!-- Remotes List -->
      <div class="flex-1 flex flex-col space-y-3 overflow-y-auto">
        <h3 class="font-display font-semibold text-sm text-[#F5FFFA]">Active Remote Registry</h3>
        
        @for (remote of federationService.knownRemotes(); track (remote.remoteName || remote.name)) {
          <div class="p-4 rounded-xl bg-[#1A1C23] border border-white/10 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-[#3B0764] flex items-center justify-center text-[#dfb7ff]">
                <mat-icon>dns</mat-icon>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-display font-semibold text-sm text-[#F5FFFA]">{{ remote.remoteName || remote.name }}</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-white/5 text-[#20B2AA] rounded">v{{ remote.version || '1.0.0' }}</span>
                </div>
                <p class="text-xs text-[#8C94A8] font-mono truncate max-w-sm mt-0.5">{{ remote.remoteEntry || remote.url }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <div class="text-right">
                <span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#14532D] text-[#82f8cc]">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-ping"></span>
                  <span>{{ remote.latencyMs || 12 }}ms</span>
                </span>
              </div>

              <button
                class="px-3 py-1.5 bg-[#6A0DAD] hover:bg-[#8333c6] text-white text-xs font-medium rounded-lg shadow transition-all flex items-center space-x-1"
                (click)="launchRemote({
                  remoteName: remote.remoteName || remote.name,
                  remoteEntry: remote.remoteEntry || remote.url || '',
                  exposedModule: remote.exposedModule || './Component'
                })"
              >
                <mat-icon class="text-xs">launch</mat-icon>
                <span>Mount Window</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class NativeFederationStudioComponent {
  readonly federationService = inject(NativeFederationService);
  readonly windowManager = inject(WindowManagerService);
  private fb = inject(FormBuilder);

  readonly remoteForm: FormGroup = this.fb.group({
    remoteName: ['', Validators.required],
    remoteEntry: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    exposedModule: ['./Module', Validators.required]
  });

  async onSubmit() {
    if (this.remoteForm.invalid) return;
    const val = this.remoteForm.value;
    
    const health = await this.federationService.testRemoteHealth(val.remoteEntry);
    
    this.federationService.registerRemote({
      remoteName: val.remoteName,
      remoteEntry: val.remoteEntry,
      exposedModule: val.exposedModule,
      status: health.status,
      latencyMs: health.latencyMs,
      version: '1.0.0'
    });

    this.remoteForm.reset({ exposedModule: './Module' });
  }

  launchRemote(remote: { remoteName: string; remoteEntry: string; exposedModule: string }) {
    this.windowManager.spawnProcess(
      `remote-${remote.remoteName}`,
      `Remote: ${remote.remoteName}`,
      'extension',
      'RemoteContainerComponent',
      'ai'
    );
  }
}
