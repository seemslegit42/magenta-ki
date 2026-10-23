import { describe, it, expect, afterEach, mock } from 'bun:test';
import { GatewayService } from '../../ts/apps/host/app/services/gateway.service';

describe('E2E: Control Plane Gateway & Turso Edge DB Mesh Flow', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  it('should authenticate, refresh health, and route parameterized Turso queries', async () => {
    const gateway = new GatewayService();
    gateway.setApiBase('http://test.local');

    const sessionToken = 'session_token_local_dev';
    const tenantCtx = gateway.authenticateSession(sessionToken);

    expect(tenantCtx).toBeDefined();
    expect(tenantCtx.tenantId).toBe('default_enterprise_corp');
    expect(tenantCtx.roles).toContain('workspace:admin');
    expect(tenantCtx.tursoConnUrl).toContain('lxvos-shell.db');

    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/db/health')) {
        return Response.json({
          mode: 'local',
          url: 'file:./data/lxvos-shell.db',
          syncConfigured: false,
        });
      }
      if (url.endsWith('/api/db/query') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { sql: string };
        if (body.sql.includes('system_preferences')) {
          return Response.json({
            columns: ['id', 'theme', 'dock_position', 'updated_at'],
            rows: [['default', 'dark', 'bottom', Date.now()]],
          });
        }
        if (body.sql.includes('vfs_nodes')) {
          return Response.json({
            columns: ['id', 'name', 'kind'],
            rows: [['root', '', 'dir']],
          });
        }
        return Response.json({ columns: [], rows: [] });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const health = await gateway.refreshDbHealth();
    expect(health.mode).toBe('local');

    const prefs = await gateway.queryEdgeDatabase(
      'SELECT id, theme, dock_position, updated_at FROM system_preferences',
    );
    expect(prefs.columns).toEqual(['id', 'theme', 'dock_position', 'updated_at']);
    expect(prefs.rows[0][1]).toBe('dark');

    const vfs = await gateway.queryEdgeDatabase(
      "SELECT id, name, kind FROM vfs_nodes WHERE id = 'root'",
    );
    expect(vfs.rows[0][2]).toBe('dir');

    const auditLogs = gateway.logs();
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);

    for (const log of auditLogs) {
      expect(log.status).toBe(200);
      expect(log.timestamp).toBeDefined();
    }

    expect(auditLogs.some((l) => l.path === '/api/db/health')).toBe(true);
    expect(auditLogs.some((l) => l.path === '/api/db/query')).toBe(true);
  });
});
