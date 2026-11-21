import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CicdPipelineService } from '../../src/app/services/cicd-pipeline.service';

describe('CicdPipelineService', () => {
  let service: CicdPipelineService;

  beforeEach(() => {
    // Mock AuditService & NotificationService
    const mockAuditService = { logEvent: vi.fn(), log: vi.fn() };
    const mockNotificationService = { notify: vi.fn() };

    // Instantiate service manually
    service = new CicdPipelineService();
    service.setDependenciesForTesting(mockAuditService as any, mockNotificationService as any);
  });

  it('should initialize with initial seed pipeline runs', () => {
    expect(service.pipelineRuns().length).toBeGreaterThan(0);
    expect(service.totalRuns()).toBeGreaterThan(0);
    expect(service.stagingTarget().status).toBe('online');
  });

  it('should trigger a new pipeline run on specified branch', () => {
    const initialTotal = service.totalRuns();
    const runId = service.triggerPipelineRun('main', 'test: commit message');

    expect(runId).toContain('run-');
    expect(service.totalRuns()).toBe(initialTotal + 1);
    expect(service.isRunning()).toBe(true);

    const activeRun = service.activeRun();
    expect(activeRun).not.toBeNull();
    expect(activeRun?.branch).toBe('main');
    expect(activeRun?.commitMessage).toBe('test: commit message');
  });

  it('should handle staging rollback correctly', () => {
    vi.useFakeTimers();
    service.rollbackStaging('f32c91a');

    expect(service.stagingTarget().activeCommitSha).toBe('f32c91a');
    expect(service.stagingTarget().status).toBe('deploying');

    vi.advanceTimersByTime(2000);
    expect(service.stagingTarget().status).toBe('online');
    vi.useRealTimers();
  });
});
