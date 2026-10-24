import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ShellThemePreference = 'light' | 'dark' | 'system';
export type ResolvedShellTheme = 'light' | 'dark';

const STORAGE_KEY = 'lxv-shell-theme';

@Injectable({ providedIn: 'root' })
export class ShellThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly preference = signal<ShellThemePreference>(this.readPreference());
  private readonly systemPrefersDark = signal(true);

  readonly themePreference = this.preference.asReadonly();

  readonly resolvedTheme = computed<ResolvedShellTheme>(() => {
    const pref = this.preference();
    if (pref === 'light') return 'light';
    if (pref === 'dark') return 'dark';
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  constructor() {
    if (this.isBrowser) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(mq.matches);
      mq.addEventListener('change', (e) => {
        this.systemPrefersDark.set(e.matches);
      });
      effect(() => {
        this.applyToDocument(this.resolvedTheme());
      });
    }
  }

  setThemePreference(pref: ShellThemePreference): void {
    this.preference.set(pref);
    if (this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        // Ignore quota / private mode
      }
    }
  }

  private readPreference(): ShellThemePreference {
    if (!this.isBrowser) return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignore
    }
    return 'system';
  }

  private applyToDocument(theme: ResolvedShellTheme): void {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    root.dataset['theme'] = theme;
    root.style.colorScheme = theme;
  }
}
