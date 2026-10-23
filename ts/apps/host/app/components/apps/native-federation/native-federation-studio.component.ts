import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { form, FormField, pattern, required } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { NativeFederationService } from '../../../services/native-federation.service';
import { WindowManagerService } from '../../../services/window-manager.service';

@Component({
  selector: 'app-native-federation-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, MatIconModule],
  template: `
    <div class="flex flex-col h-full space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display font-bold text-xl text-on-surface">Native Federation Studio</h2>
          <p class="text-xs text-on-surface-variant mt-1">Manage remote micro-frontends, validate W3C import maps, and test runtime endpoints.</p>
        </div>
        <span class="px-3 py-1 bg-secondary-container text-secondary text-xs font-mono rounded-lg border border-secondary">W3C ACTIVE</span>
      </div>

      <form (submit)="$event.preventDefault(); onSubmit()" class="p-4 rounded-xl bg-surface-container border border-outline/12 space-y-4">
        <h3 class="font-display font-semibold text-sm text-on-surface flex items-center space-x-2">
          <mat-icon class="text-xs text-magenta">add_circle</mat-icon>
          <span>Register New Remote Micro-Frontend</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label for="nf-remote-name" class="block text-[11px] font-mono text-on-surface-variant mb-1">REMOTE NAME</label>
            <input
              id="nf-remote-name"
              type="text"
              [formField]="remoteForm.remoteName"
              placeholder="e.g. billing"
              class="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-on-surface focus:outline-none focus:border-magenta"
            />
          </div>
          <div>
            <label for="nf-remote-entry" class="block text-[11px] font-mono text-on-surface-variant mb-1">REMOTE ENTRY URL (.json)</label>
            <input
              id="nf-remote-entry"
              type="text"
              [formField]="remoteForm.remoteEntry"
              placeholder="https://.../remoteEntry.json"
              class="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-on-surface focus:outline-none focus:border-magenta"
            />
          </div>
          <div>
            <label for="nf-exposed-module" class="block text-[11px] font-mono text-on-surface-variant mb-1">EXPOSED MODULE</label>
            <input
              id="nf-exposed-module"
              type="text"
              [formField]="remoteForm.exposedModule"
              placeholder="./Module"
              class="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-on-surface focus:outline-none focus:border-magenta"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            [disabled]="!remoteForm().valid()"
            class="px-5 py-2 bg-magenta hover:bg-magenta-glow disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg transition-all flex items-center space-x-1.5"
          >
            <mat-icon class="text-xs">bolt</mat-icon>
            <span>Register & Test Remote</span>
          </button>
        </div>
      </form>

      <div class="flex-1 flex flex-col space-y-3 overflow-y-auto">
        <h3 class="font-display font-semibold text-sm text-on-surface">Active Remote Registry</h3>

        @for (remote of federationService.knownRemotes(); track (remote.remoteName || remote.name)) {
          <div class="p-4 rounded-xl bg-surface-container border border-white/10 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary-muted">
                <mat-icon>dns</mat-icon>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-display font-semibold text-sm text-on-surface">{{ remote.remoteName || remote.name }}</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono bg-white/5 text-secondary rounded">v{{ remote.version || '1.0.0' }}</span>
                </div>
                <p class="text-xs text-on-surface-variant font-mono truncate max-w-sm mt-0.5">{{ remote.remoteEntry || remote.url }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <div class="text-right">
                <span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-tertiary-container text-tertiary">
                  <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                  <span>{{ remote.latencyMs || 12 }}ms</span>
                </span>
              </div>

              <button
                class="px-3 py-1.5 bg-primary hover:bg-primary text-white text-xs font-medium rounded-lg shadow transition-all flex items-center space-x-1"
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
  `,
})
export class NativeFederationStudioComponent {
  readonly federationService = inject(NativeFederationService);
  readonly windowManager = inject(WindowManagerService);

  readonly remoteModel = signal({
    remoteName: '',
    remoteEntry: '',
    exposedModule: './Module',
  });

  readonly remoteForm = form(this.remoteModel, (p) => {
    required(p.remoteName, { message: 'Name is required' });
    required(p.remoteEntry, { message: 'Entry URL is required' });
    pattern(p.remoteEntry, /^https?:\/\/.+/, { message: 'Must be an http(s) URL' });
    required(p.exposedModule, { message: 'Exposed module is required' });
  });

  async onSubmit() {
    if (!this.remoteForm().valid()) return;
    const val = this.remoteModel();

    const health = await this.federationService.testRemoteHealth(val.remoteEntry);

    this.federationService.registerRemote({
      remoteName: val.remoteName,
      remoteEntry: val.remoteEntry,
      exposedModule: val.exposedModule,
      status: health.status,
      latencyMs: health.latencyMs,
      version: '1.0.0',
    });

    this.remoteModel.set({
      remoteName: '',
      remoteEntry: '',
      exposedModule: './Module',
    });
  }

  launchRemote(remote: { remoteName: string; remoteEntry: string; exposedModule: string }) {
    this.windowManager.spawnProcess(
      `remote-${remote.remoteName}`,
      `Remote: ${remote.remoteName}`,
      'extension',
      'RemoteContainerComponent',
      'ai',
    );
  }
}
