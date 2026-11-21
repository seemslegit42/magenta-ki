import { Injectable, signal } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RemoteDefinition } from '../models/webos.models';

export type { RemoteDefinition } from '../models/webos.models';

const STORAGE_KEY_MANIFEST = 'webos_federation_manifest_cache';

@Injectable({
  providedIn: 'root'
})
export class NativeFederationService {
  public readonly manifestUrl = signal<string>('/federation.manifest.json');
  public readonly manifest = signal<Record<string, string>>({});
  public readonly remotes = signal<RemoteDefinition[]>([
    {
      name: 'remote-analytics',
      url: 'http://localhost:3001/remoteEntry.json',
      status: 'STANDBY',
      description: 'System telemetry and analytics micro-frontend',
      version: 'v1.2.0',
      exposedModule: './Component'
    },
    {
      name: 'remote-copilot',
      url: 'http://localhost:3002/remoteEntry.json',
      status: 'STANDBY',
      description: 'Autonomous copilot and task processing module',
      version: 'v2.0.0',
      exposedModule: './Component'
    },
    {
      name: 'remote-wopi-editor',
      url: 'http://localhost:3003/remoteEntry.json',
      status: 'STANDBY',
      description: 'WOPI document and spreadsheet editor module',
      version: 'v2026.1',
      exposedModule: './Component'
    }
  ]);

  public readonly isInitialized = signal<boolean>(true);
  public readonly isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  public readonly loadLog = signal<string[]>(['[Native Federation] Host adapter initialized for Angular ApplicationBuilder']);

  constructor() {
    this.hydrateFromStorage();
    this.refreshManifest();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOffline.set(false);
        this.addLog('[Network] Connection restored. Refreshing federation manifest...');
        this.refreshManifest();
      });
      window.addEventListener('offline', () => {
        this.isOffline.set(true);
        this.addLog('[Network] Switched to offline mode. Using cached federation manifest.');
      });
    }
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(STORAGE_KEY_MANIFEST);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, string>;
        this.manifest.set(parsed);
        this.addLog(`[Offline Cache] Hydrated ${Object.keys(parsed).length} remote route(s) from local cache`);
      }
    } catch {
      // Storage hydration failed silently
    }
  }

  public async refreshManifest(): Promise<Record<string, string>> {
    if (typeof window === 'undefined') return {};
    try {
      const response = await fetch('/federation.manifest.json', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json() as Record<string, string>;
        this.manifest.set(data);
        localStorage.setItem(STORAGE_KEY_MANIFEST, JSON.stringify(data));
        this.addLog(`[Manifest] Loaded federation.manifest.json with ${Object.keys(data).length} remote(s)`);
        
        // Update statuses
        this.remotes.update(items => {
          return items.map(item => ({
            ...item,
            url: data[item.name] || item.url
          }));
        });
        return data;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog(`[Manifest Warning] Could not fetch remote manifest: ${msg}. Retaining local cache.`);
    }
    return this.manifest();
  }

  public addLog(entry: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.loadLog.update(prev => [`[${timestamp}] ${entry}`, ...prev.slice(0, 49)]);
  }

  public async probeRemote(remote: RemoteDefinition): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      this.updateRemoteStatus(remote.name, 'CONNECTING');
      this.addLog(`[Probe] Testing remote entrypoint at ${remote.url}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(remote.url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);
      const probeDetails = res.type ? ` (${res.type})` : '';
      
      this.updateRemoteStatus(remote.name, 'ONLINE', latencyMs);
      this.addLog(`[Probe Success] Remote '${remote.name}' is reachable (${latencyMs}ms)${probeDetails}`);
      return { success: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const msg = err instanceof Error ? err.message : 'Connection timed out';
      this.updateRemoteStatus(remote.name, 'ERROR', latencyMs);
      this.addLog(`[Probe Error] Remote '${remote.name}' failed: ${msg}. Encapsulated fallback enabled.`);
      return { success: false, latencyMs, error: msg };
    }
  }

  public async loadRemoteComponent<T = unknown>(options: {
    remoteName: string;
    exposedModule: string;
    remoteEntry?: string;
  }): Promise<{ component?: T; error?: string }> {
    this.addLog(`[Dynamic Loading] Requesting '${options.exposedModule}' from remote '${options.remoteName}'...`);
    try {
      const mod = await loadRemoteModule<T>({
        remoteName: options.remoteName,
        exposedModule: options.exposedModule,
        remoteEntry: options.remoteEntry
      });
      this.addLog(`[Dynamic Load Success] Remote module '${options.remoteName}' loaded cleanly`);
      return { component: mod };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown load exception';
      this.addLog(`[Dynamic Load Notice] Remote '${options.remoteName}' offline (${msg}). Activating sandbox container.`);
      return { error: msg };
    }
  }

  private updateRemoteStatus(name: string, status: RemoteDefinition['status'], latencyMs?: number): void {
    this.remotes.update(list => list.map(r => {
      if (r.name === name) {
        return {
          ...r,
          status,
          latencyMs: latencyMs ?? r.latencyMs,
          lastChecked: Date.now()
        };
      }
      return r;
    }));
  }

  public registerDynamicRemote(name: string, url: string, exposedModule = './Component', description = 'Dynamic Runtime Micro-Frontend'): void {
    this.remotes.update(list => [
      ...list.filter(r => r.name !== name),
      {
        name,
        url,
        status: 'STANDBY',
        description,
        version: 'dynamic',
        exposedModule,
        lastChecked: Date.now()
      }
    ]);
    this.manifest.update(m => {
      const updated = { ...m, [name]: url };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MANIFEST, JSON.stringify(updated));
      }
      return updated;
    });
    this.addLog(`[Registry] Registered dynamic remote '${name}' -> ${url}`);
  }

  public async testRemoteHealth(url: string): Promise<{ success: boolean; latencyMs: number; status: 'ONLINE' | 'STANDBY' | 'CONNECTING' | 'ERROR'; error?: string }> {
    const res = await this.probeRemote({ name: 'dynamic', url, status: 'CONNECTING', description: '', version: '', exposedModule: '' });
    return {
      success: res.success,
      latencyMs: res.latencyMs,
      status: res.success ? 'ONLINE' : 'ERROR',
      error: res.error
    };
  }

  public registerRemote(remote: Partial<RemoteDefinition> & { remoteName?: string; remoteEntry?: string; remoteEntryUrl?: string }): void {
    const name = remote.remoteName || remote.name || 'dynamic-remote';
    const url = remote.remoteEntry || remote.remoteEntryUrl || remote.url || '';
    this.registerDynamicRemote(name, url, remote.exposedModule || './Component', remote.description || 'Dynamic Remote Micro-Frontend');
  }

  public knownRemotes(): RemoteDefinition[] {
    return this.remotes().map(r => ({
      ...r,
      remoteName: r.remoteName || r.name,
      remoteEntry: r.remoteEntry || r.url,
      remoteEntryUrl: r.remoteEntryUrl || r.url
    }));
  }
}
