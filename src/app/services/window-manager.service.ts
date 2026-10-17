import { Injectable, signal, computed } from '@angular/core';
import { WindowBounds, ProcessDescriptor } from '../models/webos.models';

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private windows = signal<Map<string, WindowBounds>>(new Map());
  private _processes = signal<ProcessDescriptor[]>([]);
  public topZIndex = signal<number>(100);

  public openWindows = computed(() => Array.from(this.windows().entries()));
  public processes = this._processes.asReadonly();
  public activeProcesses = this._processes.asReadonly();
  
  public getBounds(pid: string): WindowBounds | undefined {
    return this.windows().get(pid);
  }
  public isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  public isTallScreen = signal<boolean>(typeof window !== 'undefined' ? (window.innerHeight / window.innerWidth > 1.6 || (window.innerWidth < 768 && window.innerHeight > 640)) : false);
  public dockVisible = signal<boolean>(true);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        const mobile = window.innerWidth < 768;
        const tall = (window.innerHeight / window.innerWidth > 1.6) || (mobile && window.innerHeight > 640);
        this.isMobile.set(mobile);
        this.isTallScreen.set(tall);
      });
    }
  }

  public triggerHaptic(duration = 10): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignore haptic failures
      }
    }
  }

  public toggleDock(): void {
    this.dockVisible.update(v => !v);
    this.triggerHaptic(8);
  }

  public getNonMinimizedProcesses(): ProcessDescriptor[] {
    const windowsMap = this.windows();
    return this._processes().filter(p => {
      const b = windowsMap.get(p.pid);
      return b && !b.isMinimized;
    });
  }

  public getWindowPositionInfo(pid: string): { current: number; total: number } {
    const active = this.getNonMinimizedProcesses();
    const idx = active.findIndex(p => p.pid === pid || p.appId === pid || p.pid === `proc_${pid}`);
    return {
      current: idx >= 0 ? idx + 1 : 1,
      total: Math.max(active.length, 1)
    };
  }

  public nextWindow(currentPid?: string): string | null {
    const active = this.getNonMinimizedProcesses();
    if (active.length <= 1) return null;
    let idx = active.findIndex(p => p.pid === currentPid || p.appId === currentPid || p.pid === `proc_${currentPid}`);
    if (idx === -1) idx = 0;
    const nextIdx = (idx + 1) % active.length;
    const target = active[nextIdx];
    this.focusWindow(target.pid);
    this.triggerHaptic(12);
    return currentPid && !currentPid.startsWith('proc_') ? (target.appId || target.pid) : target.pid;
  }

  public prevWindow(currentPid?: string): string | null {
    const active = this.getNonMinimizedProcesses();
    if (active.length <= 1) return null;
    let idx = active.findIndex(p => p.pid === currentPid || p.appId === currentPid || p.pid === `proc_${currentPid}`);
    if (idx === -1) idx = 0;
    const prevIdx = (idx - 1 + active.length) % active.length;
    const target = active[prevIdx];
    this.focusWindow(target.pid);
    this.triggerHaptic(12);
    return currentPid && !currentPid.startsWith('proc_') ? (target.appId || target.pid) : target.pid;
  }

  public openApp(app: {
    id: string;
    name?: string;
    title?: string;
    icon?: string;
    componentName?: string;
    entryComponent?: string;
    category?: 'productivity' | 'system' | 'developer' | 'ai' | 'security' | string;
    isFederated?: boolean;
    federatedConfig?: unknown;
  }): string {
    const title = app.title || app.name || app.id;
    let component = app.entryComponent || app.componentName;
    if (!component) {
      if (app.id === 'app-store') component = 'AppStoreComponent';
      else if (app.id === 'app-launcher') component = 'AppLauncherComponent';
      else if (app.id === 'native-federation') component = 'RemoteContainerComponent';
      else if (app.id === 'wopi-office') component = 'WopiOfficeComponent';
      else if (app.id === 'agentfs' || app.id === 'agentfs-explorer') component = 'AgentFsExplorerComponent';
      else if (app.id === 'terminal') component = 'TerminalComponent';
      else if (app.id === 'settings') component = 'SettingsComponent';
      else if (app.id === 'security-audit') component = 'SecurityAuditComponent';
      else if (app.id === 'appwrite-databases') component = 'AppwriteDatabasesComponent';
      else if (app.id === 'gateway' || app.id === 'gateway-console') component = 'GatewayConsoleComponent';
      else component = 'RemoteContainerComponent';
    }
    return this.spawnProcess(
      app.id,
      title,
      app.icon || 'apps',
      component,
      (app.category as ProcessDescriptor['category']) || 'productivity'
    );
  }

  spawnProcess(
    pid: string,
    title: string,
    icon: string,
    entryComponent: string,
    category: ProcessDescriptor['category'] = 'productivity'
  ): string {
    const procPid = pid.startsWith('proc_') ? pid : `proc_${pid}`;
    // If process already running, focus and unminimize it
    const existing = this._processes().find(p => p.pid === procPid || p.pid === pid || p.appId === pid);
    if (existing) {
      this.restoreWindow(existing.pid);
      this.focusWindow(existing.pid);
      this.triggerHaptic(10);
      return existing.pid;
    }

    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    const width = isMob ? (typeof window !== 'undefined' ? window.innerWidth : 360) : 780;
    const height = isMob ? (typeof window !== 'undefined' ? window.innerHeight - 110 : 420) : 520;
    const xPos = isMob ? 0 : 30 + ((this._processes().length * 32) % 240);
    const yPos = isMob ? 44 : 50 + ((this._processes().length * 28) % 180);

    const newProc: ProcessDescriptor = {
      pid: procPid,
      appId: pid,
      title,
      icon,
      isOpen: true,
      isMinimized: false,
      isMaximized: isMob,
      zIndex: this.topZIndex() + 1,
      position: { x: xPos, y: yPos },
      size: { width, height },
      state: 'RUNNING',
      manifestUrl: '',
      entryComponent,
      category
    };

    this._processes.update(prev => [...prev, newProc]);

    this.windows.update(prev => new Map(prev).set(procPid, { 
      x: xPos, 
      y: yPos, 
      width, 
      height, 
      zIndex: this.topZIndex() + 1, 
      isMaximized: isMob, 
      isMinimized: false 
    }));

    this.focusWindow(procPid);
    this.triggerHaptic(12);
    return procPid;
  }

  terminateProcess(pid: string) {
    this.triggerHaptic(14);
    const resolvedPid = this._processes().find(p => p.pid === pid || p.appId === pid || p.pid === `proc_${pid}`)?.pid || pid;
    this._processes.update(prev => prev.filter(p => p.pid !== resolvedPid && p.pid !== pid));
    this.windows.update(prev => {
      const next = new Map(prev);
      next.delete(resolvedPid);
      next.delete(pid);
      return next;
    });
  }

  focusWindow(pid: string) {
    this.topZIndex.update(z => z + 1);
    this.windows.update(prev => {
      const next = new Map(prev);
      const targetId = next.has(pid) ? pid : (next.has(`proc_${pid}`) ? `proc_${pid}` : pid);
      const bounds = next.get(targetId);
      if (bounds) {
        next.set(targetId, { ...bounds, zIndex: this.topZIndex(), isMinimized: false });
      }
      return next;
    });
  }

  restoreWindow(pid: string) {
    this.windows.update(prev => {
      const next = new Map(prev);
      const targetId = next.has(pid) ? pid : (next.has(`proc_${pid}`) ? `proc_${pid}` : pid);
      const bounds = next.get(targetId);
      if (bounds) next.set(targetId, { ...bounds, isMinimized: false });
      return next;
    });
  }

  minimizeWindow(pid: string) {
    this.triggerHaptic(8);
    this.windows.update(prev => {
      const next = new Map(prev);
      const targetId = next.has(pid) ? pid : (next.has(`proc_${pid}`) ? `proc_${pid}` : pid);
      const bounds = next.get(targetId);
      if (bounds) next.set(targetId, { ...bounds, isMinimized: !bounds.isMinimized });
      return next;
    });
  }

  maximizeWindow(pid: string) {
    this.triggerHaptic(10);
    this.windows.update(prev => {
      const next = new Map(prev);
      const targetId = next.has(pid) ? pid : (next.has(`proc_${pid}`) ? `proc_${pid}` : pid);
      const bounds = next.get(targetId);
      if (bounds) next.set(targetId, { ...bounds, isMaximized: !bounds.isMaximized, isMinimized: false });
      return next;
    });
  }

  updateBounds(pid: string, bounds: Partial<WindowBounds>) {
    this.windows.update(prev => {
      const next = new Map(prev);
      const current = next.get(pid);
      if (current) {
        next.set(pid, { ...current, ...bounds });
      }
      return next;
    });
  }
}
