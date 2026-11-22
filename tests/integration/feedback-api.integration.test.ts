import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Server } from 'node:http';
import type {
  ApiErrorEnvelope,
  ExternalServiceContract,
  FeedbackAnalyticsReport,
  FeedbackEntry,
} from '../../src/app/models/feedback.models';
import { app } from '../../src/server';

describe('Integration: Feedback Mechanism & API Integration Strategy Endpoints', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3098;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.closeAllConnections?.();
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('POST /api/feedback validates bad payloads and categorizes valid submissions', async () => {
    const badRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 9, title: 'x', comment: 'short', area: 'Workspace' }),
    });
    expect(badRes.status).toBe(400);
    const badBody = (await badRes.json()) as ApiErrorEnvelope;
    expect(badBody.code).toBe('VALIDATION_ERROR');
    expect(badBody.retryable).toBe(false);

    const okRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 2,
        title: 'Polar webhook timeout during billing sync',
        comment: 'Integration endpoint fails with timeout error when syncing invoices.',
        area: 'APIs & Integrations',
        submittedBy: 'Integration Tester',
      }),
    });
    expect(okRes.status).toBe(201);
    const okBody = (await okRes.json()) as {
      entry: FeedbackEntry;
      analytics: FeedbackAnalyticsReport;
    };
    expect(okBody.entry.analysis.category).toBe('integration_api');
    expect(okBody.entry.analysis.sentiment).toBe('negative');
    expect(okBody.analytics.totalSubmissions).toBeGreaterThanOrEqual(4);

    // Triage status transition via PATCH /api/feedback/:id
    const patchRes = await fetch(`${baseUrl}/api/feedback/${okBody.entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'planned' }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = (await patchRes.json()) as { entry: FeedbackEntry };
    expect(patchBody.entry.status).toBe('planned');
  });

  it('POST /api/feedback/:id/analyze-ai returns explicit 503 error when GEMINI_API_KEY is absent', async () => {
    const previousKey = process.env['GEMINI_API_KEY'];
    delete process.env['GEMINI_API_KEY'];

    try {
      const res = await fetch(`${baseUrl}/api/feedback/fb_seed_01/analyze-ai`, {
        method: 'POST',
      });
      expect(res.status).toBe(503);
      const errBody = (await res.json()) as ApiErrorEnvelope;
      expect(errBody.code).toBe('GEMINI_KEY_MISSING');
    } finally {
      if (previousKey !== undefined) {
        process.env['GEMINI_API_KEY'] = previousKey;
      }
    }
  });

  it('GET /api/integrations/strategy and POST /api/integrations/probe enforce SSRF protection', async () => {
    const strategyRes = await fetch(`${baseUrl}/api/integrations/strategy`);
    expect(strategyRes.status).toBe(200);
    const strategyBody = (await strategyRes.json()) as { services: ExternalServiceContract[] };
    expect(strategyBody.services.length).toBeGreaterThanOrEqual(6);

    const ssrfProbeRes = await fetch(`${baseUrl}/api/integrations/probe/polar-billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ probeUrl: 'http://169.254.169.254/latest/meta-data' }),
    });
    expect(ssrfProbeRes.status).toBe(403);
    const errEnv = (await ssrfProbeRes.json()) as ApiErrorEnvelope;
    expect(['UNSAFE_PROTOCOL', 'SSRF_BLOCKED_PRIVATE_IP']).toContain(errEnv.code);

    const healthyProbeRes = await fetch(`${baseUrl}/api/integrations/probe/appwrite-backend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(healthyProbeRes.status).toBe(200);
    const healthyBody = (await healthyProbeRes.json()) as {
      service: ExternalServiceContract;
      probeResult: { healthy: boolean };
    };
    expect(healthyBody.probeResult.healthy).toBe(true);
    expect(healthyBody.service.circuitState).toBe('closed');
  });
});
