import { describe, it, expect, beforeEach } from 'bun:test';
import { GatewayService } from '../../src/app/services/gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(() => {
    service = new GatewayService();
  });

  it('should initialize with tenant context and default connection parameters', () => {
    const tenant = service.currentTenant();
    expect(tenant.userId).toBe('usr_operator_7842');
    expect(tenant.tenantId).toBe('default_enterprise_corp');
    expect(tenant.roles).toContain('workspace:admin');
    expect(tenant.tursoConnUrl).toContain('turso.io');
  });

  it('should authenticate a session with valid session token and log the request', () => {
    const initialLogCount = service.logs().length;
    const ctx = service.authenticateSession('sess_valid_jwt_token_123');

    expect(ctx.userId).toBe('usr_operator_7842');
    expect(service.logs().length).toBe(initialLogCount + 1);

    const latest = service.logs()[0];
    expect(latest.method).toBe('GET');
    expect(latest.path).toBe('/api/v1/account');
    expect(latest.status).toBe(200);
    expect(latest.latencyMs).toBeLessThan(15); // SLA verification (<15ms)
  });

  it('should reject session authentication when token is empty', () => {
    expect(() => {
      service.authenticateSession('');
    }).toThrow('Appwrite identity verification rejected: missing session token.');
  });

  it('should execute desktop_state query on Turso edge database and return configuration rows', () => {
    const res = service.queryEdgeDatabase('SELECT config_key, config_val FROM desktop_state WHERE user_id = "test"');
    expect(res.columns).toContain('config_key');
    expect(res.columns).toContain('config_val');
    expect(res.rows.length).toBeGreaterThanOrEqual(3);

    const keys = res.rows.map(r => r[0]);
    expect(keys).toContain('theme_cadence');
    expect(keys).toContain('dock_position');
  });

  it('should execute arbitrary entity query on Turso edge database and log request latency', () => {
    const initialLogCount = service.logs().length;
    const res = service.queryEdgeDatabase('SELECT id, entity_name, status FROM cluster_nodes');

    expect(res.columns).toEqual(['id', 'entity_name', 'status', 'created_at']);
    expect(res.rows.length).toBe(3);

    const latestLog = service.logs()[0];
    expect(latestLog.path).toBe('/api/v1/turso/query');
    expect(latestLog.latencyMs).toBeLessThan(10); // SLA verification (<10ms)
    expect(service.logs().length).toBe(initialLogCount + 1);
  });
});
