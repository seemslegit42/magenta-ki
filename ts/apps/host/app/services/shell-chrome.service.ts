import { Injectable, inject, signal, computed } from '@angular/core';
import { WindowManagerService } from './window-manager.service';

export type AmbientBrandMode = 'adaptive' | 'always-on' | 'always-off';

const STORAGE_KEY = 'lxv-shell-ambient-brand';

@Injectable({ providedIn: 'root' })
export class ShellChromeService {
  private readonly windowManager = inject(WindowManagerService);

  private readonly ambientMode = signal<AmbientBrandMode>(this.readAmbientMode());

  readonly ambientBrandMode = this.ambientMode.asReadonly();

  readonly hasVisibleWindows = computed(() =>
    this.windowManager.activeProcesses().some((p) => p.isOpen && !p.isMinimized),
  );

  readonly ambientBrandVisible = computed(() => {
    const mode = this.ambientMode();
    if (mode === 'always-on') return true;
    if (mode === 'always-off') return false;
    return !this.hasVisibleWindows();
  });

  /** Subtle aurora dimming when the desktop is in use. */
  readonly auroraCalm = computed(() => this.hasVisibleWindows());

  /** Header identity stays visible; adaptive mode only affects the desktop stage watermark. */
  readonly showHeaderWordmark = computed(() => true);

  setAmbientBrandMode(mode: AmbientBrandMode): void {
    this.ambientMode.set(mode);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ignore
      }
    }
  }

  private readAmbientMode(): AmbientBrandMode {
    if (typeof localStorage === 'undefined') return 'adaptive';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'adaptive' || stored === 'always-on' || stored === 'always-off') {
        return stored;
      }
    } catch {
      // Ignore
    }
    return 'adaptive';
  }
}
