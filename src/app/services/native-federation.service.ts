import { Injectable, signal } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RemoteDefinition } from '../models/webos.models';

export type { RemoteDefinition } from '../models/webos.models';

@Injectable({
  providedIn: 'root'
})
export class NativeFederationService {
  public manifestUrl = signal<string>('/federation.manifest.json');
  public manifest = signal<Record<string, string>>({});
  public remotes = signal<RemoteDefinition[]>([
    {
      name: 'remote-analytics',
      url: 'http://localhost:3001/remoteEntry.json',
      status: 'STANDBY',
      description: 'Enterprise telemetry, predictive load telemetry & Verdigris analytics mesh',
      version: 'v2.4.1',
      exposedModule: './Component'
    },
    {
      name: 'remote-copilot',
      url: 'http://localhost:3002/remoteEntry.json',
      status: 'STANDBY',
      description: 'Distributed autonomous Gemini multi-agent reasoning cluster',
      version: 'v3.0.0',
      exposedModule: './Component'
    },
    {
      name: 'remote-wopi-editor',
      url: 'http://localhost:3003/remoteEntry.json',
      status: 'STANDBY',
      description: 'Distributed WOPI collaborative spreadsheet & presentation engine',
      version: 'v2026.4',
      exposedModule: './Component'
    }
  ]);
  public isInitialized = signal<boolean>(true);
  public loadLog = signal<string[]>(['[Native Federation] Host adapter initialized for Angular 22 ApplicationBuilder']);

  constructor() {
    this.refreshManifest();
  }

  public async refreshManifest(): Promise<Record<string, string>> {
    if (typeof window === 'undefined') return {};
    try {
      const response = await fetch('/federation.manifest.json');
      if (response.ok) {
        const data = await response.json() as Record<string, string>;
        this.manifest.set(data);
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
      this.addLog(`[Manifest Warning] Could not fetch manifest: ${msg}`);
    }
    return {};
  }

  public addLog(entry: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.loadLog.update(prev => [`[${timestamp}] ${entry}`, ...prev.slice(0, 49)]);
  }

  public async probeRemote(remote: RemoteDefinition): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      this.updateRemoteStatus(remote.name, 'CONNECTING');
      this.addLog(`[Probe] Pinging remoteEntry.json at ${remote.url}...`);
      
      const res = await fetch(remote.url, { method: 'HEAD', mode: 'no-cors' });
      const latencyMs = Math.round(performance.now() - startTime);
      const probeDetails = res.type ? ` (${res.type})` : '';
      
      this.updateRemoteStatus(remote.name, 'ONLINE', latencyMs);
      this.addLog(`[Probe Success] ${remote.name} reachable (${latencyMs}ms)${probeDetails}`);
      return { success: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const msg = err instanceof Error ? err.message : 'Unreachable';
      this.updateRemoteStatus(remote.name, 'ERROR', latencyMs);
      this.addLog(`[Probe Error] ${remote.name} failed: ${msg} (standby mode active)`);
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
      this.addLog(`[Dynamic Load Success] Remote '${options.remoteName}' loaded successfully`);
      return { component: mod };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown loading failure';
      this.addLog(`[Dynamic Load Notice] Remote '${options.remoteName}' returned: ${msg}. Falling back to encapsulated sandbox.`);
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

  public registerDynamicRemote(name: string, url: string, exposedModule = './Component', description = 'Dynamic Runtime Remote'): void {
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
    this.manifest.update(m => ({ ...m, [name]: url }));
    this.addLog(`[Registry] Registered new dynamic remote '${name}' -> ${url}`);
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
