import { Injectable, inject } from '@angular/core';
import { NativeFederationService } from './native-federation.service';

const STORAGE_KEY = 'lxv-beep-ui-origin';

/** Matches ERP `.env.example` when the lxvOS host already owns :3000. */
const DEFAULT_ORIGINS = [
  'http://127.0.0.1:9002',
  'http://127.0.0.1:3010',
  'http://localhost:9002',
  'http://localhost:3010',
];

export const BEEP_REMOTE_NAME = 'beep-erp-srp';
export const BEEP_SHELL_MODULE = './shell-surface';

@Injectable({ providedIn: 'root' })
export class BeepRemoteService {
  private readonly federation = inject(NativeFederationService);

  resolveUiOrigin(): string {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)?.trim();
        if (stored) {
          return stored.replace(/\/$/, '');
        }
      } catch {
        // Ignore
      }
    }
    return DEFAULT_ORIGINS[0];
  }

  remoteEntryUrl(origin = this.resolveUiOrigin()): string {
    return `${origin.replace(/\/$/, '')}/remoteEntry.json`;
  }

  /** Keep manifest + in-memory registry aligned with the live BEEP UI port. */
  syncRemoteRegistration(origin = this.resolveUiOrigin()): void {
    const entry = this.remoteEntryUrl(origin);
    this.federation.registerDynamicRemote(
      BEEP_REMOTE_NAME,
      entry,
      BEEP_SHELL_MODULE,
      'B.E.E.P syndicate resource planning (React federation remote)',
    );
  }

  /** Probe common dev ports for `beep-ui` health when origin is unset. */
  async discoverUiOrigin(): Promise<string> {
    const stored =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)?.trim()
        : undefined;
    if (stored) {
      return stored.replace(/\/$/, '');
    }

    for (const origin of DEFAULT_ORIGINS) {
      try {
        const res = await fetch(`${origin}/health`, {
          signal: AbortSignal.timeout(1200),
        });
        const body = await res.text();
        if (res.ok && body.includes('beep-ui')) {
          return origin;
        }
      } catch {
        // try next candidate
      }
    }
    return this.resolveUiOrigin();
  }
}
