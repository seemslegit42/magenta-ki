import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Server } from 'node:http';
import type { FeedbackAnalyticsReport, FeedbackEntry } from '../../src/app/models/feedback.models';
import { ApiClientService } from '../../src/app/services/api-client.service';
import { AuditService } from '../../src/app/services/audit.service';
import { FeedbackService } from '../../src/app/services/feedback.service';
import { NotificationService } from '../../src/app/services/notification.service';
import { app } from '../../src/server';

describe('E2E: User Feedback Submission, Backend Categorization & Product Triage Workflow', () => {
  let server: Server;
  let baseUrl: string;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3097;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Route relative /api/* requests from Angular ApiClientService directly to live test server
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return originalFetch(`${baseUrl}${input}`, init);
      }
      return originalFetch(input, init);
    }) as typeof fetch;
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => {
      server.closeAllConnections?.();
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('completes end-to-end feedback intake, automated categorization, analytics ranking, and sprint triage', async () => {
    const audit = new AuditService();
    const notifications = new NotificationService();
    const apiClient = new ApiClientService();
    const feedback = new FeedbackService();
    feedback.setDependenciesForTesting(audit, notifications, apiClient);

    // 1. Load baseline feedback & integration strategy contracts from backend
    await feedback.loadFeedback();
    await feedback.loadIntegrationStrategy();
    expect(feedback.integrations().length).toBeGreaterThanOrEqual(6);

    // 2. Submit user feedback with 2-star rating describing slow latency bug
    const submitted: FeedbackEntry | null = await feedback.submitFeedback({
      rating: 2,
      title: 'Workspace dashboard loading slow during peak sync',
      comment: 'Opening the analytics panel takes over 4 seconds with noticeable lag.',
      area: 'Control Plane & Gateway',
      submittedBy: 'E2E Product User',
    });

    expect(submitted).not.toBeNull();
    expect(submitted?.analysis.category).toBe('performance');
    expect(submitted?.analysis.sentiment).toBe('negative');
    expect(submitted?.analysis.priorityScore).toBeGreaterThan(50);

    // 3. Verify backend analytics reflects new item in prioritized backlog
    const analytics: FeedbackAnalyticsReport = feedback.analytics();
    expect(analytics.topPriorities.some((p) => p.id === submitted?.id)).toBe(true);

    // 4. Product manager triages & plans the item for next sprint
    const transitioned = await feedback.updateStatus(submitted!.id, 'planned');
    expect(transitioned).toBe(true);
    const updatedItem = feedback.entries().find((e) => e.id === submitted!.id);
    expect(updatedItem?.status).toBe('planned');

    // 5. Audit trail records both user submission and triage transition
    const logs = audit.allLogs();
    expect(logs.some((l) => l.action === 'USER_FEEDBACK_SUBMITTED')).toBe(true);
    expect(logs.some((l) => l.action === 'FEEDBACK_TRIAGE_UPDATED')).toBe(true);
  });
});
