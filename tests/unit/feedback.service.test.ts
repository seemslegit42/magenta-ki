import { describe, expect, it } from 'bun:test';
import { ApiClientService } from '../../src/app/services/api-client.service';
import { AuditService } from '../../src/app/services/audit.service';
import { FeedbackService } from '../../src/app/services/feedback.service';
import { NotificationService } from '../../src/app/services/notification.service';

describe('FeedbackService', () => {
  function createIsolatedService(): {
    service: FeedbackService;
    audit: AuditService;
  } {
    const service = new FeedbackService();
    const audit = new AuditService();
    const notifications = new NotificationService();
    const apiClient = new ApiClientService();
    service.setDependenciesForTesting(audit, notifications, apiClient);
    return { service, audit };
  }

  it('rejects too-short feedback submissions with clear validation message', async () => {
    const { service } = createIsolatedService();
    const beforeCount = service.entries().length;

    const result = await service.submitFeedback({
      rating: 4,
      title: 'Hi',
      comment: 'Too short',
      area: 'Document Workspace',
    });

    expect(result).toBeNull();
    expect(service.errorMessage()).toContain('headline');
    expect(service.entries().length).toBe(beforeCount);
  });

  it('filters entries reactively by category and sentiment signals', () => {
    const { service } = createIsolatedService();
    service.categoryFilter.set('bug_report');
    expect(service.filteredEntries().every((e) => e.analysis.category === 'bug_report')).toBe(true);

    service.categoryFilter.set('all');
    service.sentimentFilter.set('positive');
    expect(service.filteredEntries().every((e) => e.analysis.sentiment === 'positive')).toBe(true);
  });

  it('updates analytics and exports valid JSON insights report', () => {
    const { service } = createIsolatedService();
    const exported = JSON.parse(service.exportInsightsJson()) as {
      analytics: { totalSubmissions: number };
      entries: unknown[];
    };
    expect(exported.analytics.totalSubmissions).toBe(service.entries().length);
    expect(exported.entries.length).toBe(service.entries().length);
  });
});
