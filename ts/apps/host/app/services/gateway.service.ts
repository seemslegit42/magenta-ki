import { Injectable, signal } from '@angular/core';
import { TenantContext } from '../models/webos.models';

export interface DbQueryResult {
  columns: string[];
  rows: unknown[][];
  rowsAffected?: number;
}

export interface DbHealth {
  mode: 'local' | 'embedded-replica';
  url: string;
  syncConfigured: boolean;
}

@Injectable({ providedIn: 'root' })
export class GatewayService {
  /**
   * Prefix for Bun control-plane URLs.
   * Empty in the browser (Angular proxy). Tests may set via `setApiBase`.
   */
  private apiBase = '';

  private tenantContext: TenantContext = {
    userId: 'usr_operator_7842',
    tenantId: 'default_enterprise_corp',
    roles: ['workspace:admin', 'editor', 'analyst'],
    tursoConnUrl: 'file:./data/lxvos-shell.db',
  };

  private gatewayLogs = signal<
    { timestamp: string; method: string; path: string; status: number; latencyMs: number }[]
  >([]);

  public readonly currentTenant = signal<TenantContext>(this.tenantContext);
  public readonly logs = this.gatewayLogs;

  /** Test-only: point fetch at an absolute origin. */
  public setApiBase(base: string): void {
    this.apiBase = base.replace(/\/$/, '');
  }

  public authenticateSession(sessionToken: string): TenantContext {
    if (!sessionToken) {
      throw new Error('Session token required.');
    }
    const ctx = this.currentTenant();
    this.logRequest('GET', '/api/db/health', 200, 0);
    return ctx;
  }

  public async refreshDbHealth(): Promise<DbHealth> {
    const started = performance.now();
    const res = await fetch(`${this.apiBase}/api/db/health`);
    const latencyMs = performance.now() - started;
    this.logRequest('GET', '/api/db/health', res.status, latencyMs);
    if (!res.ok) {
      throw new Error(`DB health failed: ${res.status}`);
    }
    const health = (await res.json()) as DbHealth;
    this.tenantContext = {
      ...this.tenantContext,
      tursoConnUrl: health.url,
    };
    this.currentTenant.set(this.tenantContext);
    return health;
  }

  public async queryEdgeDatabase(
    sqlQuery: string,
    args: unknown[] = [],
  ): Promise<DbQueryResult> {
    const started = performance.now();
    const res = await fetch(`${this.apiBase}/api/db/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sqlQuery, args }),
    });
    const latencyMs = performance.now() - started;
    this.logRequest('POST', '/api/db/query', res.status, latencyMs);
    if (!res.ok) {
      let message = `Query failed: ${res.status}`;
      try {
        const errBody = (await res.json()) as { error?: { message?: string } };
        if (errBody.error?.message) message = errBody.error.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return (await res.json()) as DbQueryResult;
  }

  public async syncDatabase(): Promise<{ synced: boolean; reason?: string }> {
    const started = performance.now();
    const res = await fetch(`${this.apiBase}/api/db/sync`, { method: 'POST' });
    const latencyMs = performance.now() - started;
    this.logRequest('POST', '/api/db/sync', res.status, latencyMs);
    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }
    return (await res.json()) as { synced: boolean; reason?: string };
  }

  private logRequest(
    method: string,
    path: string,
    status: number,
    latencyMs: number,
  ): void {
    const timeStr = new Date().toLocaleTimeString();
    this.gatewayLogs.update((list) => [
      {
        timestamp: timeStr,
        method,
        path,
        status,
        latencyMs: Math.round(latencyMs * 1000) / 1000,
      },
      ...list.slice(0, 49),
    ]);
  }
}
