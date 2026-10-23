import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { GatewayService } from '../../ts/apps/host/app/services/gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    service = new GatewayService();
    service.setApiBase('http://test.local');
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  it('should initialize with tenant context and local Turso file URL', () => {
    const tenant = service.currentTenant();
    expect(tenant.userId).toBe('usr_operator_7842');
    expect(tenant.tenantId).toBe('default_enterprise_corp');
    expect(tenant.roles).toContain('workspace:admin');
    expect(tenant.tursoConnUrl).toContain('lxvos-shell.db');
  });

  it('should authenticate a session with valid session token and log the request', () => {
    const initialLogCount = service.logs().length;
    const ctx = service.authenticateSession('sess_valid_jwt_token_123');

    expect(ctx.userId).toBe('usr_operator_7842');
    expect(service.logs().length).toBe(initialLogCount + 1);

    const latest = service.logs()[0];
    expect(latest.method).toBe('GET');
    expect(latest.path).toBe('/api/db/health');
    expect(latest.status).toBe(200);
  });

  it('should reject session authentication when token is empty', () => {
    expect(() => {
      service.authenticateSession('');
    }).toThrow('Session token required.');
  });

  it('should refresh DB health from Bun control plane', async () => {
    globalThis.fetch = mock(async () =>
      Response.json({
        mode: 'local',
        url: 'file:./data/lxvos-shell.db',
        syncConfigured: false,
      }),
    ) as unknown as typeof fetch;

    const health = await service.refreshDbHealth();
    expect(health.mode).toBe('local');
    expect(service.currentTenant().tursoConnUrl).toBe('file:./data/lxvos-shell.db');
    expect(service.logs()[0].path).toBe('/api/db/health');
  });

  it('should execute SQL via POST /api/db/query', async () => {
    globalThis.fetch = mock(async () =>
      Response.json({
        columns: ['id', 'theme', 'dock_position', 'updated_at'],
        rows: [['default', 'dark', 'bottom', 1]],
      }),
    ) as unknown as typeof fetch;

    const res = await service.queryEdgeDatabase(
      'SELECT id, theme, dock_position, updated_at FROM system_preferences',
    );
    expect(res.columns).toContain('theme');
    expect(res.rows[0][1]).toBe('dark');
    expect(service.logs()[0].path).toBe('/api/db/query');
    expect(service.logs()[0].method).toBe('POST');
  });
});
