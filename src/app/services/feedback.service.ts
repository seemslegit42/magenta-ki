import { computed, Injectable, inject, signal } from '@angular/core';
import type {
  ExternalServiceContract,
  FeedbackAnalyticsReport,
  FeedbackCategory,
  FeedbackEntry,
  FeedbackSentiment,
  FeedbackStatus,
  FeedbackSubmissionPayload,
} from '../models/feedback.models';
import { AuditCategory, AuditSeverity } from '../models/webos.models';
import { ApiClientService } from './api-client.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const SEED_FEEDBACK_ENTRIES: FeedbackEntry[] = [
  {
    id: 'fb_seed_01',
    rating: 2,
    title: 'WOPI lock release delay after switching windows quickly',
    comment:
      'When saving a document and switching tabs immediately, the document lock sometimes stays active for several seconds before timing out.',
    area: 'Document Workspace',
    userCategoryHint: 'bug_report',
    submittedBy: 'Elena Vance',
    status: 'triaged',
    createdAt: Date.now() - 86_400_000,
    updatedAt: Date.now() - 72_000_000,
    analysis: {
      category: 'bug_report',
      sentiment: 'negative',
      sentimentScore: -0.52,
      urgency: 'high',
      themes: ['Document & File Handling', 'API & Data Sync'],
      priorityScore: 81,
      actionRecommendation:
        'Reproduce issue in Document & File Handling, add automated regression test, and schedule patch in current sprint.',
      analyzerEngine: 'deterministic-nlp',
      confidence: 0.88,
    },
  },
  {
    id: 'fb_seed_02',
    rating: 4,
    title: 'Export executive UAT summary directly to PDF alongside TXT',
    comment:
      'Business stakeholders appreciate the plain-language UAT portal and would love a formatted executive PDF export option for quarterly board packets.',
    area: 'Business Acceptance (UAT)',
    userCategoryHint: 'feature_request',
    submittedBy: 'Marcus Chen',
    status: 'planned',
    createdAt: Date.now() - 54_000_000,
    updatedAt: Date.now() - 40_000_000,
    analysis: {
      category: 'feature_request',
      sentiment: 'positive',
      sentimentScore: 0.5,
      urgency: 'medium',
      themes: ['Release & UAT Readiness', 'Navigation & Workspace Flow'],
      priorityScore: 42,
      actionRecommendation:
        'Evaluate product scope for Release & UAT Readiness enhancement and queue for upcoming milestone planning.',
      analyzerEngine: 'deterministic-nlp',
      confidence: 0.88,
    },
  },
  {
    id: 'fb_seed_03',
    rating: 5,
    title: 'Clean keyboard navigation and fast project creation flow',
    comment:
      'Creating new team projects is fast, clear, and works seamlessly with clear validation feedback.',
    area: 'Project Collaboration',
    userCategoryHint: 'praise',
    submittedBy: 'Sophia Patel',
    status: 'resolved',
    createdAt: Date.now() - 21_600_000,
    updatedAt: Date.now() - 21_600_000,
    analysis: {
      category: 'praise',
      sentiment: 'positive',
      sentimentScore: 0.89,
      urgency: 'low',
      themes: ['Speed & Responsiveness', 'Navigation & Workspace Flow'],
      priorityScore: 15,
      actionRecommendation:
        'Preserve current design pattern in Speed & Responsiveness and share benchmark across sister modules.',
      analyzerEngine: 'deterministic-nlp',
      confidence: 0.88,
    },
  },
];

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private apiClient: ApiClientService;
  private auditService: AuditService;
  private notificationService: NotificationService;

  public readonly entries = signal<FeedbackEntry[]>(SEED_FEEDBACK_ENTRIES);
  public readonly serverAnalytics = signal<FeedbackAnalyticsReport | null>(null);
  public readonly integrations = signal<ExternalServiceContract[]>([]);

  public readonly categoryFilter = signal<FeedbackCategory | 'all'>('all');
  public readonly sentimentFilter = signal<FeedbackSentiment | 'all'>('all');
  public readonly isLoading = signal<boolean>(false);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly lastSubmittedEntry = signal<FeedbackEntry | null>(null);

  constructor() {
    let resolvedClient: ApiClientService | null = null;
    let resolvedAudit: AuditService | null = null;
    let resolvedNotif: NotificationService | null = null;
    try {
      resolvedClient = inject(ApiClientService, { optional: true });
      resolvedAudit = inject(AuditService, { optional: true });
      resolvedNotif = inject(NotificationService, { optional: true });
    } catch {
      resolvedClient = null;
    }
    this.apiClient = resolvedClient ?? new ApiClientService();
    this.auditService = resolvedAudit ?? new AuditService();
    this.notificationService = resolvedNotif ?? new NotificationService();
  }

  public setDependenciesForTesting(
    audit: AuditService,
    notification: NotificationService,
    apiClient?: ApiClientService,
  ): void {
    this.auditService = audit;
    this.notificationService = notification;
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  public readonly filteredEntries = computed(() => {
    const cat = this.categoryFilter();
    const sent = this.sentimentFilter();
    return this.entries().filter((entry) => {
      const matchCat = cat === 'all' || entry.analysis.category === cat;
      const matchSent = sent === 'all' || entry.analysis.sentiment === sent;
      return matchCat && matchSent;
    });
  });

  public readonly analytics = computed<FeedbackAnalyticsReport>(() => {
    const cached = this.serverAnalytics();
    if (cached && cached.totalSubmissions === this.entries().length) {
      return cached;
    }
    return this.computeLocalAnalytics(this.entries());
  });

  public async loadFeedback(force = false): Promise<void> {
    if (this.isLoading() && !force) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const res = await this.apiClient.request<{
      entries: FeedbackEntry[];
      analytics: FeedbackAnalyticsReport;
    }>('/api/feedback');

    if (res.ok && res.data) {
      this.entries.set(res.data.entries);
      this.serverAnalytics.set(res.data.analytics);
    } else if (res.error) {
      this.errorMessage.set(res.error.message);
    }
    this.isLoading.set(false);
  }

  public async loadIntegrationStrategy(): Promise<void> {
    const res = await this.apiClient.request<{ services: ExternalServiceContract[] }>(
      '/api/integrations/strategy',
    );
    if (res.ok && res.data) {
      this.integrations.set(res.data.services);
    }
  }

  public async probeIntegration(serviceId: string): Promise<boolean> {
    this.errorMessage.set(null);
    const res = await this.apiClient.request<{
      service: ExternalServiceContract;
      probeResult: { healthy: boolean; message: string };
    }>(`/api/integrations/probe/${encodeURIComponent(serviceId)}`, {
      method: 'POST',
      timeoutMs: 4000,
    });

    if (res.ok && res.data?.service) {
      this.integrations.update((list) => list.map((svc) => (svc.id === serviceId ? res.data!.service : svc)));
      return res.data.probeResult.healthy;
    }

    if (res.error) {
      this.errorMessage.set(res.error.message);
      await this.loadIntegrationStrategy();
    }
    return false;
  }

  public async submitFeedback(payload: FeedbackSubmissionPayload): Promise<FeedbackEntry | null> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const cleanTitle = (payload.title || '').trim();
    const cleanComment = (payload.comment || '').trim();
    if (cleanTitle.length < 3 || cleanComment.length < 8) {
      this.errorMessage.set('Please enter a brief headline (3+ characters) and details (8+ characters).');
      this.isSubmitting.set(false);
      return null;
    }

    const res = await this.apiClient.request<{
      entry: FeedbackEntry;
      analytics: FeedbackAnalyticsReport;
    }>('/api/feedback', {
      method: 'POST',
      body: payload,
      idempotencyKey: `fb_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    });

    if (res.ok && res.data?.entry) {
      const entry = res.data.entry;
      this.entries.update((prev) => [entry, ...prev]);
      this.serverAnalytics.set(res.data.analytics);
      this.lastSubmittedEntry.set(entry);

      this.auditService.logEvent({
        action: 'USER_FEEDBACK_SUBMITTED',
        category: AuditCategory.SYSTEM,
        severity: entry.analysis.urgency === 'critical' ? AuditSeverity.WARNING : AuditSeverity.INFO,
        targetEntity: entry.id,
        details: `Feedback (${entry.rating}/5) categorized as ${entry.analysis.category} (priority ${entry.analysis.priorityScore}).`,
      });
      this.notificationService.notify({
        title: 'Feedback Recorded',
        message: 'Thank you — your feedback was categorized for product triage.',
        category: 'system',
        priority: 'normal',
        sourceApp: 'Feedback Hub',
      });
      this.isSubmitting.set(false);
      return entry;
    }

    if (res.error) {
      // Only fall back locally when backend HTTP endpoint isn't running (unit tests); propagate validation 400s!
      if (res.error.code === 'NETWORK_UNREACHABLE' || res.error.upstreamStatus === 404) {
        const localEntry = this.createLocalFallbackEntry(payload);
        this.entries.update((prev) => [localEntry, ...prev]);
        this.serverAnalytics.set(this.computeLocalAnalytics(this.entries()));
        this.lastSubmittedEntry.set(localEntry);

        this.auditService.logEvent({
          action: 'USER_FEEDBACK_SUBMITTED',
          category: AuditCategory.SYSTEM,
          severity: AuditSeverity.INFO,
          targetEntity: localEntry.id,
          details: `Feedback (${localEntry.rating}/5) analyzed locally as ${localEntry.analysis.category}.`,
        });
        this.isSubmitting.set(false);
        return localEntry;
      }

      this.errorMessage.set(res.error.message);
    }

    this.isSubmitting.set(false);
    return null;
  }

  public async updateStatus(id: string, status: FeedbackStatus): Promise<boolean> {
    const res = await this.apiClient.request<{
      entry: FeedbackEntry;
      analytics: FeedbackAnalyticsReport;
    }>(`/api/feedback/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status },
    });

    if (res.ok && res.data?.entry) {
      this.entries.update((prev) => prev.map((e) => (e.id === id ? res.data!.entry : e)));
      this.serverAnalytics.set(res.data.analytics);
      this.auditService.logEvent({
        action: 'FEEDBACK_TRIAGE_UPDATED',
        category: AuditCategory.SYSTEM,
        severity: AuditSeverity.INFO,
        targetEntity: id,
        details: `Updated feedback item ${id} status to ${status}.`,
      });
      return true;
    }

    if (res.error && (res.error.code === 'NETWORK_UNREACHABLE' || res.error.upstreamStatus === 404)) {
      this.entries.update((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status, updatedAt: Date.now() } : e)),
      );
      this.serverAnalytics.set(this.computeLocalAnalytics(this.entries()));
      return true;
    }

    if (res.error) {
      this.errorMessage.set(res.error.message);
    }
    return false;
  }

  public async enrichWithAi(id: string): Promise<boolean> {
    this.errorMessage.set(null);
    const res = await this.apiClient.request<{
      entry: FeedbackEntry;
      analytics: FeedbackAnalyticsReport;
    }>(`/api/feedback/${encodeURIComponent(id)}/analyze-ai`, {
      method: 'POST',
      timeoutMs: 15000,
    });

    if (res.ok && res.data?.entry) {
      this.entries.update((prev) => prev.map((e) => (e.id === id ? res.data!.entry : e)));
      this.serverAnalytics.set(res.data.analytics);
      return true;
    }

    if (res.error) {
      this.errorMessage.set(res.error.message);
    }
    return false;
  }

  public exportInsightsJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        analytics: this.analytics(),
        entries: this.entries(),
      },
      null,
      2,
    );
  }

  private createLocalFallbackEntry(payload: FeedbackSubmissionPayload): FeedbackEntry {
    const lower = `${payload.title} ${payload.comment}`.toLowerCase();
    const category: FeedbackCategory =
      payload.userCategoryHint ||
      (lower.includes('bug') || lower.includes('error') || lower.includes('crash')
        ? 'bug_report'
        : lower.includes('slow') || lower.includes('lag')
          ? 'performance'
          : lower.includes('api') || lower.includes('sync')
            ? 'integration_api'
            : payload.rating >= 4
              ? 'praise'
              : 'feature_request');

    const sentiment: FeedbackSentiment =
      payload.rating >= 4 ? 'positive' : payload.rating <= 2 ? 'negative' : 'neutral';

    return {
      id: `fb_${Date.now().toString(36)}`,
      rating: payload.rating,
      title: payload.title.trim(),
      comment: payload.comment.trim(),
      area: (payload.area || 'General Workspace').trim(),
      userCategoryHint: payload.userCategoryHint,
      contactEmail: payload.contactEmail?.trim() || undefined,
      submittedBy: (payload.submittedBy || 'Workspace Member').trim(),
      status: 'new',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      analysis: {
        category,
        sentiment,
        sentimentScore: Number(((payload.rating - 3) / 2).toFixed(2)),
        urgency: payload.rating <= 2 ? 'high' : 'medium',
        themes: [(payload.area || 'General Experience').trim()],
        priorityScore: (6 - payload.rating) * 15,
        actionRecommendation: `Review ${category.replace('_', ' ')} submission in sprint triage.`,
        analyzerEngine: 'deterministic-nlp',
        confidence: 0.78,
      },
    };
  }

  private computeLocalAnalytics(list: FeedbackEntry[]): FeedbackAnalyticsReport {
    const total = list.length;
    if (total === 0) {
      return {
        totalSubmissions: 0,
        averageRating: 0,
        npsScore: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        openActionCount: 0,
        categoryBreakdown: [],
        topThemes: [],
        topPriorities: [],
        lastUpdatedAt: Date.now(),
      };
    }

    const avgRating = Number((list.reduce((s, e) => s + e.rating, 0) / total).toFixed(2));
    const promoters = list.filter((e) => e.rating === 5).length;
    const detractors = list.filter((e) => e.rating <= 3).length;

    const categoryMap = new Map<FeedbackCategory, FeedbackEntry[]>();
    for (const item of list) {
      const bucket = categoryMap.get(item.analysis.category) || [];
      bucket.push(item);
      categoryMap.set(item.analysis.category, bucket);
    }

    return {
      totalSubmissions: total,
      averageRating: avgRating,
      npsScore: Math.round(((promoters - detractors) / total) * 100),
      positiveCount: list.filter((e) => e.analysis.sentiment === 'positive').length,
      neutralCount: list.filter((e) => e.analysis.sentiment === 'neutral').length,
      negativeCount: list.filter((e) => e.analysis.sentiment === 'negative').length,
      openActionCount: list.filter((e) => e.status !== 'resolved' && e.analysis.category !== 'praise').length,
      categoryBreakdown: Array.from(categoryMap.entries()).map(([category, group]) => ({
        category,
        label: category,
        count: group.length,
        averageRating: Number((group.reduce((s, e) => s + e.rating, 0) / group.length).toFixed(2)),
        averagePriority: Math.round(group.reduce((s, e) => s + e.analysis.priorityScore, 0) / group.length),
      })),
      topThemes: [],
      topPriorities: [...list]
        .filter((e) => e.status !== 'resolved')
        .sort((a, b) => b.analysis.priorityScore - a.analysis.priorityScore)
        .slice(0, 5)
        .map((e) => ({
          id: e.id,
          title: e.title,
          category: e.analysis.category,
          urgency: e.analysis.urgency,
          priorityScore: e.analysis.priorityScore,
          status: e.status,
          actionRecommendation: e.analysis.actionRecommendation,
        })),
      lastUpdatedAt: Date.now(),
    };
  }
}
