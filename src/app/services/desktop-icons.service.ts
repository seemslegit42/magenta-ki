import { Injectable, signal, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DesktopShortcut } from '../models/webos.models';

const STORAGE_KEY = 'vev_desktop_shortcuts_v1';

const DEFAULT_SHORTCUTS: DesktopShortcut[] = [
  {
    id: 'federation-studio',
    title: 'Federation Studio',
    icon: 'hub',
    entryComponent: 'NativeFederationStudioComponent',
    category: 'developer',
    x: 24,
    y: 24,
    color: '#E0218A'
  },
  {
    id: 'wopi-office',
    title: 'WOPI Office',
    icon: 'description',
    entryComponent: 'WopiOfficeComponent',
    category: 'productivity',
    x: 24,
    y: 132,
    color: '#20B2AA'
  },
  {
    id: 'agentfs-explorer',
    title: 'AgentFS Explorer',
    icon: 'folder_open',
    entryComponent: 'AgentFsExplorerComponent',
    category: 'system',
    x: 24,
    y: 240,
    color: '#3EB991'
  },
  {
    id: 'gateway-console',
    title: 'Gateway Console',
    icon: 'dns',
    entryComponent: 'GatewayConsoleComponent',
    category: 'developer',
    x: 24,
    y: 348,
    color: '#6A0DAD'
  },
  {
    id: 'security-audit',
    title: 'Security & Audit',
    icon: 'verified_user',
    entryComponent: 'SecurityAuditComponent',
    category: 'security',
    x: 132,
    y: 24,
    color: '#FF2A9D'
  },
  {
    id: 'appwrite-db',
    title: 'Appwrite Databases',
    icon: 'dataset',
    entryComponent: 'AppwriteDatabasesComponent',
    category: 'system',
    x: 132,
    y: 132,
    color: '#20B2AA'
  },
  {
    id: 'terminal',
    title: 'WebOS Terminal',
    icon: 'terminal',
    entryComponent: 'TerminalComponent',
    category: 'developer',
    x: 132,
    y: 240,
    color: '#8C94A8'
  },
  {
    id: 'telemetry',
    title: 'Mesh Telemetry',
    icon: 'speed',
    entryComponent: 'TelemetryDashboardComponent',
    category: 'system',
    x: 132,
    y: 348,
    color: '#dfb7ff'
  },
  {
    id: 'recycle-bin',
    title: 'Recycle Bin',
    icon: 'delete_outline',
    entryComponent: 'RecycleBinComponent',
    category: 'system',
    x: 24,
    y: 456,
    color: '#FF4D6D'
  }
];

@Injectable({ providedIn: 'root' })
export class DesktopIconsService {
  private readonly platformId = inject(PLATFORM_ID);
  public readonly shortcuts = signal<DesktopShortcut[]>(DEFAULT_SHORTCUTS);
  public readonly selectedId = signal<string | null>(null);

  constructor() {
    this.loadSavedPositions();
  }

  private loadSavedPositions(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Record<string, { x: number; y: number }> = JSON.parse(saved);
        this.shortcuts.update(current =>
          current.map(sc => {
            const pos = parsed[sc.id];
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
              return { ...sc, x: pos.x, y: pos.y };
            }
            return sc;
          })
        );
      }
    } catch {
      // Fallback to defaults
    }
  }

  public updatePosition(id: string, x: number, y: number): void {
    // Clamping to positive workspace boundaries and 8px snap grid
    const clampedX = Math.max(12, Math.round(x / 8) * 8);
    const clampedY = Math.max(12, Math.round(y / 8) * 8);

    this.shortcuts.update(list =>
      list.map(item => (item.id === id ? { ...item, x: clampedX, y: clampedY } : item))
    );
    this.persistPositions();
  }

  public removeShortcut(id: string): DesktopShortcut | null {
    let removed: DesktopShortcut | null = null;
    this.shortcuts.update(list => {
      const found = list.find(s => s.id === id);
      if (found) {
        removed = { ...found };
        return list.filter(s => s.id !== id);
      }
      return list;
    });
    if (removed) {
      this.persistPositions();
    }
    return removed;
  }

  public addShortcut(shortcut: DesktopShortcut): void {
    this.shortcuts.update(list => {
      if (list.some(s => s.id === shortcut.id)) {
        return list.map(s => s.id === shortcut.id ? shortcut : s);
      }
      return [...list, shortcut];
    });
    this.persistPositions();
  }

  public updateShortcutIcon(id: string, icon: string): void {
    this.shortcuts.update(list =>
      list.map(s => s.id === id ? { ...s, icon } : s)
    );
  }

  public resetGrid(): void {
    this.shortcuts.set(DEFAULT_SHORTCUTS);
    this.persistPositions();
  }

  public select(id: string | null): void {
    this.selectedId.set(id);
  }

  private persistPositions(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;
    try {
      const state = this.shortcuts().reduce<Record<string, { x: number; y: number }>>((acc, cur) => {
        acc[cur.id] = { x: cur.x, y: cur.y };
        return acc;
      }, {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable
    }
  }
}
