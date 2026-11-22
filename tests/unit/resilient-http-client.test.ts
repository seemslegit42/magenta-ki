import { describe, expect, it } from 'bun:test';
import {
  assertSafeOutboundUrl,
  IntegrationGatewayError,
  ResilientHttpClient,
} from '../../src/server/resilient-http-client';

describe('ResilientHttpClient & Outbound SSRF Guard', () => {
  it('blocks non-HTTPS external protocols and private/metadata IPs (SSRF defense)', () => {
    expect(() => assertSafeOutboundUrl('http://api.polar.sh/v1/checkouts')).toThrow(IntegrationGatewayError);
    expect(() => assertSafeOutboundUrl('https://169.254.169.254/latest/meta-data')).toThrow(
      IntegrationGatewayError,
    );
    expect(() => assertSafeOutboundUrl('https://10.0.0.15/internal')).toThrow(IntegrationGatewayError);
    expect(() =>
      assertSafeOutboundUrl('https://evil.example.com/steal', {
        allowedHosts: ['api.polar.sh'],
      }),
    ).toThrow(IntegrationGatewayError);

    const valid = assertSafeOutboundUrl('https://api.polar.sh/v1/checkouts', {
      allowedHosts: ['api.polar.sh'],
    });
    expect(valid.hostname).toBe('api.polar.sh');
  });

  it('retries retryable 503 responses and recovers cleanly on subsequent attempt', async () => {
    let calls = 0;
    const mockFetch = (async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: 'temporary overload' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true, attempt: calls }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const client = new ResilientHttpClient({ fetchImpl: mockFetch, failureThreshold: 3 });
    const data = await client.requestJson<{ ok: boolean; attempt: number }>(
      'polar-billing',
      'https://api.polar.sh/v1/health',
      {
        method: 'GET',
        maxRetries: 2,
        allowedHosts: ['api.polar.sh'],
      },
    );

    expect(calls).toBe(2);
    expect(data.ok).toBe(true);
    expect(client.getCircuitSnapshot('polar-billing').state).toBe('closed');
  });

  it('does not retry 400 validation client errors and propagates normalized envelope', async () => {
    let calls = 0;
    const mockFetch = (async () => {
      calls++;
      return new Response(JSON.stringify({ error: 'bad request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const client = new ResilientHttpClient({ fetchImpl: mockFetch });
    let caught: unknown;
    try {
      await client.requestJson('polar-billing', 'https://api.polar.sh/v1/checkouts', {
        method: 'POST',
        idempotencyKey: 'idem_123',
        maxRetries: 3,
        allowedHosts: ['api.polar.sh'],
      });
    } catch (err) {
      caught = err;
    }

    expect(calls).toBe(1);
    expect(caught).toBeInstanceOf(IntegrationGatewayError);
    expect((caught as IntegrationGatewayError).httpStatus).toBe(400);
    expect((caught as IntegrationGatewayError).envelope.retryable).toBe(false);
  });

  it('opens circuit breaker after threshold consecutive 5xx failures and closes on recovery', async () => {
    let failMode = true;
    const mockFetch = (async () => {
      if (failMode) {
        return new Response(JSON.stringify({ error: 'down' }), { status: 502 });
      }
      return new Response(JSON.stringify({ healthy: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const client = new ResilientHttpClient({
      fetchImpl: mockFetch,
      failureThreshold: 2,
      cooldownMs: 10,
    });

    await expect(
      client.requestJson('turso-libsql', 'https://turso.io/health', { maxRetries: 0 }),
    ).rejects.toBeInstanceOf(IntegrationGatewayError);

    await expect(
      client.requestJson('turso-libsql', 'https://turso.io/health', { maxRetries: 0 }),
    ).rejects.toBeInstanceOf(IntegrationGatewayError);

    expect(client.getCircuitSnapshot('turso-libsql').state).toBe('open');

    // Wait for cooldown -> half-open -> successful recovery closes circuit
    await new Promise((r) => setTimeout(r, 20));
    failMode = false;

    const res = await client.requestJson<{ healthy: boolean }>('turso-libsql', 'https://turso.io/health', {
      maxRetries: 0,
    });
    expect(res.healthy).toBe(true);
    expect(client.getCircuitSnapshot('turso-libsql').state).toBe('closed');
  });
});
