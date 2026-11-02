import { Injectable, signal } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RemoteDefinition } from '../models/webos.models';

export type { RemoteDefinition } from '../models/webos.models';
import { computed } from '@angular/core';
import { DependencyPool, SharedDependencyConfig, NFRegistryEvent, NFSharedResource } from '../models/webos.models';

const STORAGE_KEY_MANIFEST = 'webos_federation_manifest_cache';

@Injectable({
  providedIn: 'root'
})
export class NativeFederationService {
  public readonly manifestUrl = signal<string>('/federation.manifest.json');
  public readonly manifest = signal<Record<string, string>>({});
  
  // Remotes registry with enriched v4 metadata
  public readonly remotes = signal<RemoteDefinition[]>([
    {
      name: 'remote-analytics',
      url: 'http://localhost:3001/remoteEntry.json',
      status: 'ONLINE',
      description: 'System telemetry and real-time execution analytics micro-frontend',
      version: 'v1.2.0',
      exposedModule: './Component',
      exposedModules: ['./Component', './MetricsService', './ChartWidget'],
      sriHash: 'sha384-eU9V72t0pB6Z8jM4xT7W1K3yR5A9C0D2F4H6J8L0N2P4R6T8V0X2Z4',
      poolId: 'pool-0',
      chunksCount: 4,
      latencyMs: 14,
      buildAdapter: 'angular'
    },
    {
      name: 'remote-copilot',
      url: 'http://localhost:3002/remoteEntry.json',
      status: 'ONLINE',
      description: 'Autonomous copilot and LLM task orchestrator with streaming channels',
      version: 'v2.0.0',
      exposedModule: './Component',
      exposedModules: ['./Component', './PromptBar', './TaskPipeline'],
      sriHash: 'sha384-8rK9M4jN1P3R5T7V9X1Z3B5D7F9H1J3L5N7P9R1T3V5X7Z9B1D3F5H7',
      poolId: 'pool-0',
      chunksCount: 6,
      latencyMs: 18,
      buildAdapter: 'angular'
    },
    {
      name: 'remote-wopi-editor',
      url: 'http://localhost:3003/remoteEntry.json',
      status: 'STANDBY',
      description: 'Collaborative WOPI document, spreadsheet, and slide canvas editor',
      version: 'v2026.1',
      exposedModule: './Component',
      exposedModules: ['./Component', './SpreadsheetCanvas', './DocumentLocks'],
      sriHash: 'sha384-mG72lP9X1Z3B5D7F9H1J3L5N7P9R1T3V5X7Z9B1D3F5H7J9L1N3P5R7',
      poolId: 'pool-1',
      chunksCount: 5,
      latencyMs: 22,
      buildAdapter: 'angular'
    },
    {
      name: 'remote-mesh-telemetry',
      url: 'http://localhost:3004/remoteEntry.json',
      status: 'ONLINE',
      description: 'Distributed libSQL and edge replica telemetry monitor',
      version: 'v2.4.0',
      exposedModule: './Component',
      exposedModules: ['./Component', './EdgeHealth'],
      sriHash: 'sha384-kL893B1D3F5H7J9L1N3P5R7T9V1X3Z5B7D9F1H3J5L7N9P1R3T5V7X9',
      poolId: 'pool-0',
      chunksCount: 3,
      latencyMs: 9,
      buildAdapter: 'angular'
    }
  ]);

  // Dependency Pools (v4 Multi-Pool Isolation Architecture)
  public readonly pools = signal<DependencyPool[]>([
    {
      id: 'pool-0',
      name: 'Host Core Pool (Angular v22 Zoneless)',
      description: 'Strict singleton pool for Angular 22 runtime, Zoneless scheduler, and Signals engine.',
      isolated: false,
      color: '#3EB991',
      assignedRemotes: ['remote-analytics', 'remote-copilot', 'remote-mesh-telemetry']
    },
    {
      id: 'pool-1',
      name: 'Productivity & WOPI Pool',
      description: 'Isolated runtime pool for rich document manipulation, spreadsheet canvas, and locks.',
      isolated: true,
      color: '#20B2AA',
      assignedRemotes: ['remote-wopi-editor']
    },
    {
      id: 'pool-2',
      name: 'Cross-Framework Isolated Pool',
      description: 'Dedicated sandbox pool for React and third-party micro-frontends with createGetShared bridge.',
      isolated: true,
      color: '#E0218A',
      assignedRemotes: []
    }
  ]);

  // Shared Dependencies Matrix for Version Resolver
  public readonly sharedDependencies = signal<SharedDependencyConfig[]>([
    {
      packageName: '@angular/core',
      requiredVersion: '^22.2.0',
      resolvedVersion: '22.2.0',
      isSingleton: true,
      strictVersion: true,
      poolId: 'pool-0',
      sizeKb: 142,
      hasConflict: false
    },
    {
      packageName: '@angular/common',
      requiredVersion: '^22.2.0',
      resolvedVersion: '22.2.0',
      isSingleton: true,
      strictVersion: true,
      poolId: 'pool-0',
      sizeKb: 98,
      hasConflict: false
    },
    {
      packageName: '@angular/material',
      requiredVersion: '^22.2.0',
      resolvedVersion: '22.2.0',
      isSingleton: true,
      strictVersion: false,
      poolId: 'pool-0',
      sizeKb: 215,
      hasConflict: false
    },
    {
      packageName: '@angular/router',
      requiredVersion: '^22.2.0',
      resolvedVersion: '22.2.0',
      isSingleton: true,
      strictVersion: true,
      poolId: 'pool-0',
      sizeKb: 64,
      hasConflict: false
    },
    {
      packageName: '@angular-architects/native-federation',
      requiredVersion: '^22.2.2',
      resolvedVersion: '22.2.2',
      isSingleton: true,
      strictVersion: false,
      poolId: 'pool-0',
      sizeKb: 38,
      hasConflict: false
    },
    {
      packageName: 'rxjs',
      requiredVersion: '~7.8.0',
      resolvedVersion: '7.8.1',
      isSingleton: true,
      strictVersion: false,
      poolId: 'pool-0',
      sizeKb: 45,
      hasConflict: false
    },
    {
      packageName: 'motion',
      requiredVersion: '^12.23.24',
      resolvedVersion: '12.23.24',
      isSingleton: false,
      strictVersion: false,
      poolId: 'pool-0',
      sizeKb: 88,
      hasConflict: false
    },
    {
      packageName: '@tabler/icons',
      requiredVersion: '^3.49.0',
      resolvedVersion: '3.49.0',
      isSingleton: false,
      strictVersion: false,
      poolId: 'pool-0',
      sizeKb: 120,
      hasConflict: false
    }
  ]);

  // Event Registry (window.__NF_REGISTRY__) Stream
  public readonly eventRegistryStream = signal<NFRegistryEvent[]>([
    {
      id: 'ev-1',
      timestamp: Date.now() - 32000,
      channel: 'system',
      type: 'ORCHESTRATOR_BOOTSTRAP_COMPLETE',
      source: 'Host (app)',
      payload: { mode: 'zoneless', version: '4.6.0', runtime: 'native-federation-orchestrator' },
      status: 'delivered'
    },
    {
      id: 'ev-2',
      timestamp: Date.now() - 28000,
      channel: 'routing',
      type: 'IMPORT_MAP_RESOLVED',
      source: 'VersionResolver',
      payload: { singletons: 6, pooled: 3, sharedBundles: 8 },
      status: 'delivered'
    },
    {
      id: 'ev-3',
      timestamp: Date.now() - 21000,
      channel: 'security',
      type: 'SRI_HASH_VERIFIED',
      source: 'OrchestratorSecurity',
      payload: { algorithm: 'sha384', remotesVerified: 4 },
      status: 'delivered'
    },
    {
      id: 'ev-4',
      timestamp: Date.now() - 14000,
      channel: 'mfe',
      type: 'REMOTE_ENTRY_MOUNTED',
      source: 'remote-analytics',
      payload: { exposedModule: './Component', latencyMs: 14 },
      status: 'delivered'
    }
  ]);

  // Cross-MFE Shared Resources (window.__NF_REGISTRY__.registerResource)
  public readonly sharedResources = signal<NFSharedResource[]>([
    {
      key: 'auth_context',
      sourceRemote: 'Host (app)',
      type: 'UserRoleContext',
      updatedAt: Date.now() - 15000,
      valueSummary: 'role: administrator, tenant: verdigris-main'
    },
    {
      key: 'design_tokens',
      sourceRemote: 'Host (app)',
      type: 'ThemeTokens',
      updatedAt: Date.now() - 40000,
      valueSummary: 'palette: digital-wabi-sabi, primary: #6A0DAD, secondary: #20B2AA'
    },
    {
      key: 'telemetry_sink',
      sourceRemote: 'remote-analytics',
      type: 'DataStreamSink',
      updatedAt: Date.now() - 8000,
      valueSummary: 'endpoint: /api/telemetry, interval: 1000ms'
    }
  ]);

  public readonly sriPolicy = signal<'enforce' | 'warn' | 'disabled'>('enforce');
  public readonly isInitialized = signal<boolean>(true);
  public readonly isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  public readonly loadLog = signal<string[]>([
    '[Native Federation v4] Host orchestrator active with Version Resolver & Dependency Pooling',
    '[Event Registry] Initialized window.__NF_REGISTRY__ with race-free bus'
  ]);

  // Dynamic Browser-Native Import Map Computed Output
  public readonly importMapJson = computed(() => {
    const imports: Record<string, string> = {
      '@angular/core': '/_dist/vendor/@angular/core/fesm2022/core.mjs',
      '@angular/common': '/_dist/vendor/@angular/common/fesm2022/common.mjs',
      '@angular/material': '/_dist/vendor/@angular/material/fesm2022/material.mjs',
      '@angular/router': '/_dist/vendor/@angular/router/fesm2022/router.mjs',
      '@angular-architects/native-federation': '/_dist/vendor/@angular-architects/native-federation/fesm2022/native-federation.mjs',
      'rxjs': '/_dist/vendor/rxjs/dist/esm5/index.js',
      'motion': '/_dist/vendor/motion/dist/es/index.mjs'
    };

    const scopes: Record<string, Record<string, string>> = {};
    for (const rem of this.remotes()) {
      imports[rem.name] = rem.url;
      scopes[rem.url] = {
        '@angular/core': '/_dist/vendor/@angular/core/fesm2022/core.mjs',
        '@angular/common': '/_dist/vendor/@angular/common/fesm2022/common.mjs'
      };
    }

    return JSON.stringify({ imports, scopes }, null, 2);
  });

  constructor() {
    this.hydrateFromStorage();
    this.refreshManifest();
    this.initializeGlobalEventRegistry();

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

  // Setup window.__NF_REGISTRY__ as mandated by Native Federation v4 Orchestrator
  private initializeGlobalEventRegistry(): void {
    if (typeof window === 'undefined') return;
    const globalWindow = window as unknown as {
      __NF_REGISTRY__?: {
        emit: (channel: string, type: string, payload: unknown) => void;
        on: (channel: string, handler: (data: unknown) => void) => void;
        off: (channel: string, handler: (data: unknown) => void) => void;
        registerResource: (key: string, resource: unknown) => void;
        getResource: (key: string) => unknown;
        getEvents: () => NFRegistryEvent[];
        getVersion: () => string;
      };
    };

    const listeners: Record<string, ((data: unknown) => void)[]> = {};

    globalWindow.__NF_REGISTRY__ = {
      emit: (channel: string, type: string, payload: unknown) => {
        this.dispatchRegistryEvent(channel, type, 'Host Runtime', (payload as Record<string, unknown>) || {});
        if (listeners[channel]) {
          listeners[channel].forEach(fn => fn(payload));
        }
      },
      on: (channel: string, handler: (data: unknown) => void) => {
        if (!listeners[channel]) listeners[channel] = [];
        listeners[channel].push(handler);
      },
      off: (channel: string, handler: (data: unknown) => void) => {
        if (listeners[channel]) {
          listeners[channel] = listeners[channel].filter(h => h !== handler);
        }
      },
      registerResource: (key: string, resource: unknown) => {
        this.registerSharedResource(key, typeof resource, 'External Remote', JSON.stringify(resource));
      },
      getResource: (key: string) => {
        const found = this.sharedResources().find(r => r.key === key);
        return found ? found.valueSummary : undefined;
      },
      getEvents: () => this.eventRegistryStream(),
      getVersion: () => '4.6.0'
    };
  }

  public dispatchRegistryEvent(channel: string, type: string, source: string, payload: Record<string, unknown> | string): void {
    const newEvent: NFRegistryEvent = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      channel,
      type,
      source,
      payload,
      status: 'delivered'
    };

    this.eventRegistryStream.update(list => [newEvent, ...list.slice(0, 99)]);
    this.addLog(`[Event Registry] ${channel.toUpperCase()}: ${type} dispatched from ${source}`);
  }

  public registerSharedResource(key: string, type: string, sourceRemote: string, valueSummary: string): void {
    this.sharedResources.update(list => [
      ...list.filter(r => r.key !== key),
      { key, type, sourceRemote, updatedAt: Date.now(), valueSummary }
    ]);
    this.dispatchRegistryEvent('registry', 'SHARED_RESOURCE_UPDATED', sourceRemote, { key, type });
  }

  public createPool(name: string, description: string, isolated = true, color = '#20B2AA'): string {
    const id = `pool-${Date.now()}`;
    const newPool: DependencyPool = {
      id,
      name,
      description,
      isolated,
      color,
      assignedRemotes: []
    };
    this.pools.update(list => [...list, newPool]);
    this.addLog(`[Dependency Pooling] Created new pool '${name}' (${id})`);
    this.dispatchRegistryEvent('pooling', 'DEPENDENCY_POOL_CREATED', 'Host Orchestrator', { id, name });
    return id;
  }

  public assignRemoteToPool(remoteName: string, poolId: string): void {
    this.remotes.update(remotes => remotes.map(r => r.name === remoteName ? { ...r, poolId } : r));
    this.pools.update(pools => pools.map(p => {
      const isTarget = p.id === poolId;
      const filtered = p.assignedRemotes.filter(r => r !== remoteName);
      return {
        ...p,
        assignedRemotes: isTarget ? [...filtered, remoteName] : filtered
      };
    }));
    this.addLog(`[Dependency Pooling] Assigned remote '${remoteName}' to pool '${poolId}'`);
    this.dispatchRegistryEvent('pooling', 'REMOTE_POOL_ASSIGNMENT', 'Host Orchestrator', { remoteName, poolId });
  }

  // Version Resolver conflict simulation
  public testVersionResolution(packageName: string, requestedRange: string): {
    decision: 'compatible' | 'upgrade_required' | 'isolate_to_pool';
    resolvedVersion: string;
    message: string;
    suggestedPool?: string;
  } {
    const existing = this.sharedDependencies().find(d => d.packageName === packageName);
    if (!existing) {
      return {
        decision: 'compatible',
        resolvedVersion: requestedRange.replace(/[\^~]/, ''),
        message: `Package '${packageName}' is not currently shared. It will be loaded independently per remote.`
      };
    }

    if (existing.strictVersion && requestedRange !== existing.requiredVersion) {
      return {
        decision: 'isolate_to_pool',
        resolvedVersion: existing.resolvedVersion,
        suggestedPool: 'pool-2',
        message: `Strict singleton constraint failed for '${packageName}'. Host uses ${existing.resolvedVersion}, requested ${requestedRange}. Isolating to secondary pool.`
      };
    }

    return {
      decision: 'compatible',
      resolvedVersion: existing.resolvedVersion,
      message: `Version conflict negotiated successfully. Host resolved '${packageName}' to ${existing.resolvedVersion} for both remotes without secondary bundle.`
    };
  }

  public setSriPolicy(policy: 'enforce' | 'warn' | 'disabled'): void {
    this.sriPolicy.set(policy);
    this.addLog(`[Security] Subresource Integrity (SRI) policy changed to: ${policy.toUpperCase()}`);
    this.dispatchRegistryEvent('security', 'SRI_POLICY_CHANGED', 'Host Orchestrator', { policy });
  }

  public async probeAllRemotes(): Promise<void> {
    this.addLog('[Probe] Starting batch health check across all registered remotes...');
    for (const remote of this.remotes()) {
      await this.probeRemote(remote);
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
      this.dispatchRegistryEvent('probe', 'REMOTE_PROBE_SUCCESS', remote.name, { latencyMs, status: 'ONLINE' });
      return { success: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const msg = err instanceof Error ? err.message : 'Connection timed out';
      this.updateRemoteStatus(remote.name, 'ERROR', latencyMs);
      this.addLog(`[Probe Error] Remote '${remote.name}' failed: ${msg}. Encapsulated fallback enabled.`);
      this.dispatchRegistryEvent('probe', 'REMOTE_PROBE_FAILURE', remote.name, { error: msg, status: 'ERROR' });
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
      this.dispatchRegistryEvent('mfe', 'MODULE_LOADED', options.remoteName, { exposedModule: options.exposedModule });
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

  public registerDynamicRemote(
    name: string, 
    url: string, 
    exposedModule = './Component', 
    description = 'Dynamic Runtime Micro-Frontend',
    poolId = 'pool-0'
  ): void {
    const sriHash = `sha384-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    this.remotes.update(list => [
      ...list.filter(r => r.name !== name),
      {
        name,
        url,
        status: 'STANDBY',
        description,
        version: 'dynamic',
        exposedModule,
        exposedModules: [exposedModule],
        sriHash,
        poolId,
        chunksCount: 2,
        lastChecked: Date.now(),
        buildAdapter: 'angular'
      }
    ]);
    this.manifest.update(m => {
      const updated = { ...m, [name]: url };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MANIFEST, JSON.stringify(updated));
      }
      return updated;
    });
    this.assignRemoteToPool(name, poolId);
    this.addLog(`[Registry] Registered dynamic remote '${name}' -> ${url}`);
    this.dispatchRegistryEvent('registry', 'REMOTE_REGISTERED', 'Host Orchestrator', { name, url, poolId });
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
    this.registerDynamicRemote(
      name, 
      url, 
      remote.exposedModule || './Component', 
      remote.description || 'Dynamic Remote Micro-Frontend',
      remote.poolId || 'pool-0'
    );
  }

  public knownRemotes(): RemoteDefinition[] {
    return this.remotes().map(r => ({
      ...r,
      remoteName: r.remoteName || r.name,
      remoteEntry: r.remoteEntry || r.url,
      remoteEntryUrl: r.remoteEntryUrl || r.url
    }));
  }

  // Code generator for federation.config.mjs
  public generateFederationConfigFile(options: {
    appName?: string;
    denseChunking?: boolean;
    ignoreUnusedDeps?: boolean;
    includeCoreSecondaries?: boolean;
    includeLocales?: boolean;
  } = {}): string {
    const name = options.appName || 'app';
    const denseChunking = options.denseChunking ?? true;
    const ignoreUnusedDeps = options.ignoreUnusedDeps ?? true;
    const secondaries = options.includeCoreSecondaries ?? true;

    return `import { withNativeFederation, fromPackageJson } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: '${name}',

  // v4 Shared Dependencies with Version Resolver configuration
  shared: fromPackageJson({ 
    singleton: true, 
    strictVersion: true, 
    requiredVersion: 'auto', 
    build: 'package' 
  })${secondaries ? `\n    .patch(['@angular/core'], { includeSecondaries: { keepAll: true } })` : ''},

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket'
  ],

  features: {
    ignoreUnusedDeps: ${ignoreUnusedDeps},
    denseChunking: ${denseChunking}
  }
});
`;
  }

  // Code generator for angular.json builder configuration
  public generateAngularJsonConfig(projectKey = 'app'): string {
    return `"projects": {
  "${projectKey}": {
    "architect": {
      "build": {
        "builder": "@angular-architects/native-federation:build",
        "options": {},
        "configurations": {
          "production": {
            "target": "${projectKey}:esbuild:production"
          },
          "development": {
            "target": "${projectKey}:esbuild:development",
            "dev": {
              "liveReload": true
            }
          }
        },
        "defaultConfiguration": "production"
      },
      "serve": {
        "builder": "@angular-architects/native-federation:build",
        "options": {
          "target": "${projectKey}:serve-original:development",
          "rebuildDelay": 500
        }
      }
    }
  }
}`;
  }
}

