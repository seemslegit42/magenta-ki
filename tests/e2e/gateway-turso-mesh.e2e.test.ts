import { describe, it, expect } from 'bun:test';
import { GatewayService } from '../../ts/apps/host/app/services/gateway.service';

describe('E2E: Control Plane Gateway & Turso Edge DB Mesh Flow', () => {
  it('should authenticate user directory sessions and route tenant-isolated edge queries with low latency', () => {
    const gateway = new GatewayService();

    // 1. Appwrite Directory Session Authentication
    const sessionToken = 'appwrite_session_secret_jwt_prod_2026';
    const tenantCtx = gateway.authenticateSession(sessionToken);

    expect(tenantCtx).toBeDefined();
    expect(tenantCtx.tenantId).toBe('default_enterprise_corp');
    expect(tenantCtx.roles).toContain('workspace:admin');
    expect(tenantCtx.tursoConnUrl).toContain('default_enterprise_corp-verdigris.turso.io');

    // 2. Query Routing: Desktop state preferences query
    const desktopStateResult = gateway.queryEdgeDatabase(
      'SELECT config_key, config_val, updated_at FROM desktop_state WHERE user_id = "usr_operator_7842";'
    );

    expect(desktopStateResult.columns).toEqual(['config_key', 'config_val', 'updated_at']);
    expect(desktopStateResult.rows.length).toBeGreaterThanOrEqual(3);

    const configMap = new Map(desktopStateResult.rows.map(r => [r[0], r[1]]));
    expect(configMap.get('theme_cadence')).toBe('syncopated_magenta_v2.4');
    expect(configMap.get('dock_position')).toBe('bottom_offset');

    // 3. Query Routing: Enterprise Cluster Mesh Status Query
    const clusterNodesResult = gateway.queryEdgeDatabase('SELECT id, entity_name, status, created_at FROM cluster_nodes;');
    expect(clusterNodesResult.columns).toContain('entity_name');
    expect(clusterNodesResult.rows.length).toBe(3);

    const operationalNode = clusterNodesResult.rows.find(r => r[1] === 'Alpha Cluster Node');
    expect(operationalNode).toBeDefined();
    expect(operationalNode![2]).toBe('Operational');

    // 4. SLA Verification: Inspect Gateway Audit Log Metrics
    const auditLogs = gateway.logs();
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);

    // Verify all requests logged meet edge proxy latency SLAs (<15ms)
    for (const log of auditLogs) {
      expect(log.status).toBe(200);
      expect(log.latencyMs).toBeLessThanOrEqual(15);
      expect(log.timestamp).toBeDefined();
    }

    const accountAuthLog = auditLogs.find(l => l.path === '/api/v1/account')!;
    expect(accountAuthLog).toBeDefined();
    expect(accountAuthLog.method).toBe('GET');

    const tursoQueryLog = auditLogs.find(l => l.path === '/api/v1/turso/query')!;
    expect(tursoQueryLog).toBeDefined();
    expect(tursoQueryLog.method).toBe('POST');
  });
});
