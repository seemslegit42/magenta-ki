import { Injectable, signal } from '@angular/core';
import { TenantContext } from '../models/webos.models';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private tenantContext: TenantContext = {
    userId: 'usr_operator_7842',
    tenantId: 'default_enterprise_corp',
    roles: ['workspace:admin', 'editor', 'analyst'],
    tursoConnUrl: 'libsql://default_enterprise_corp-verdigris.turso.io?authToken=eyJhbGci...'
  };

  private gatewayLogs = signal<{ timestamp: string; method: string; path: string; status: number; latencyMs: number }[]>([
    { timestamp: '16:15:20', method: 'GET', path: '/api/v1/workspace/config', status: 200, latencyMs: 2.1 },
    { timestamp: '16:15:22', method: 'POST', path: '/api/v1/wopi/files/doc_101/contents', status: 200, latencyMs: 4.8 },
    { timestamp: '16:15:35', method: 'GET', path: '/api/v1/turso/sync', status: 200, latencyMs: 3.2 }
  ]);

  public readonly currentTenant = signal<TenantContext>(this.tenantContext);
  public readonly logs = this.gatewayLogs;

  public authenticateSession(sessionToken: string): TenantContext {
    if (!sessionToken) {
      throw new Error('Appwrite identity verification rejected: missing session token.');
    }
    const ctx = this.currentTenant();
    this.logRequest('GET', '/api/v1/account', 200, 1.8);
    return ctx;
  }

  public queryEdgeDatabase(sqlQuery: string): { columns: string[]; rows: unknown[][] } {
    this.logRequest('POST', '/api/v1/turso/query', 200, 3.4);
    if (sqlQuery.toLowerCase().includes('desktop_state')) {
      return {
        columns: ['config_key', 'config_val', 'updated_at'],
        rows: [
          ['theme_cadence', 'syncopated_magenta_v2.4', Date.now()],
          ['dock_position', 'bottom_offset', Date.now()],
          ['window_blur_radius', '28px', Date.now()]
        ]
      };
    }
    return {
      columns: ['id', 'entity_name', 'status', 'created_at'],
      rows: [
        [1, 'Alpha Cluster Node', 'Operational', '2026-10-09'],
        [2, 'Beta Edge Mesh', 'Synchronized', '2026-10-09'],
        [3, 'Gamma Sandbox', 'Isolated', '2026-10-09']
      ]
    };
  }

  private logRequest(method: string, path: string, status: number, latencyMs: number): void {
    const timeStr = new Date().toLocaleTimeString();
    this.gatewayLogs.update(list => [{
      timestamp: timeStr,
      method,
      path,
      status,
      latencyMs
    }, ...list.slice(0, 49)]);
  }
}
