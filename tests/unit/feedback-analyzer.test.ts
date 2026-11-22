import { describe, expect, it } from 'bun:test';
import type { FeedbackEntry } from '../../src/app/models/feedback.models';
import {
  analyzeFeedbackDeterministic,
  computeFeedbackAnalytics,
  validateAndSanitizeSubmission,
} from '../../src/server/feedback-analyzer';

describe('Backend Feedback Validation, NLP Categorization & Analytics', () => {
  it('validates and sanitizes unsafe characters out of user feedback submissions', () => {
    const invalidRating = validateAndSanitizeSubmission({
      rating: 7 as never,
      title: 'Valid title',
      comment: 'Long enough valid comment text',
      area: 'Document Workspace',
    });
    expect(invalidRating.valid).toBe(false);

    const sanitized = validateAndSanitizeSubmission({
      rating: 4,
      title: '  <script>alert(1)</script> Fast UI   update ',
      comment: 'Works smoothly across workspace windows and saves properly.',
      area: 'Project Collaboration',
      contactEmail: 'alex@example.com',
    });
    expect(sanitized.valid).toBe(true);
    expect(sanitized.sanitized?.title).toBe('scriptalert(1)/script Fast UI update');
  });

  it('classifies critical bug reports vs feature praise accurately with priority scores', () => {
    const criticalBug = analyzeFeedbackDeterministic({
      rating: 1,
      title: 'App crash and 500 error when exporting workspace document',
      comment: 'Clicking export causes an immediate crash and blocked data sync.',
      area: 'Document Workspace',
    });

    expect(criticalBug.category).toBe('bug_report');
    expect(criticalBug.sentiment).toBe('negative');
    expect(criticalBug.urgency).toBe('critical');
    expect(criticalBug.priorityScore).toBeGreaterThanOrEqual(85);
    expect(criticalBug.analyzerEngine).toBe('deterministic-nlp');

    const positivePraise = analyzeFeedbackDeterministic({
      rating: 5,
      title: 'Love the clean layout and smooth keyboard shortcuts',
      comment: 'Everything feels intuitive, awesome, and helpful for daily operations.',
      area: 'General Workspace',
    });

    expect(positivePraise.category).toBe('praise');
    expect(positivePraise.sentiment).toBe('positive');
    expect(positivePraise.urgency).toBe('low');
    expect(positivePraise.priorityScore).toBeLessThan(30);
  });

  it('computes average rating, NPS score, themes, and priority backlog correctly', () => {
    const sampleEntries: FeedbackEntry[] = [
      {
        id: 'f1',
        rating: 5,
        title: 'Clean navigation',
        comment: 'Very smooth and intuitive navigation menu.',
        area: 'Workspace',
        submittedBy: 'User A',
        status: 'resolved',
        createdAt: 1,
        updatedAt: 1,
        analysis: analyzeFeedbackDeterministic({
          rating: 5,
          title: 'Clean navigation',
          comment: 'Very smooth and intuitive navigation menu.',
        }),
      },
      {
        id: 'f2',
        rating: 1,
        title: 'API timeout on sync',
        comment: 'Sync endpoint fails with timeout error repeatedly.',
        area: 'APIs',
        submittedBy: 'User B',
        status: 'new',
        createdAt: 2,
        updatedAt: 2,
        analysis: analyzeFeedbackDeterministic({
          rating: 1,
          title: 'API timeout on sync',
          comment: 'Sync endpoint fails with timeout error repeatedly.',
        }),
      },
    ];

    const report = computeFeedbackAnalytics(sampleEntries);
    expect(report.totalSubmissions).toBe(2);
    expect(report.averageRating).toBe(3);
    expect(report.npsScore).toBe(0); // 1 promoter (5), 1 detractor (1) => (1-1)/2 * 100 = 0
    expect(report.openActionCount).toBe(1);
    expect(report.topPriorities[0].id).toBe('f2');
    expect(report.topThemes.length).toBeGreaterThan(0);
  });
});
