import { beforeEach, describe, expect, it } from 'bun:test';
import type { AuditService } from '../../src/app/services/audit.service';
import { CicdPipelineService } from '../../src/app/services/cicd-pipeline.service';
import type { NotificationService } from '../../src/app/services/notification.service';

describe('CicdPipelineService (GitLab CI/CD & Bun)', () => {
  let service: CicdPipelineService;

  beforeEach(() => {
    const mockAuditService = { logEvent: () => undefined, log: () => undefined };
    const mockNotificationService = { notify: () => undefined };

    service = new CicdPipelineService();
    service.setDependenciesForTesting(
      mockAuditService as unknown as AuditService,
      mockNotificationService as unknown as NotificationService,
    );
  });

  it('should initialize with GitLab Flow seed pipeline runs and healthy staging target', () => {
    expect(service.pipelineRuns().length).toBeGreaterThan(0);
    expect(service.totalRuns()).toBeGreaterThan(0);
    expect(service.stagingTarget().status).toBe('online');
    expect(service.pipelineRuns()[0].id).toContain('gl-pipe-');
  });

  it('should trigger a new GitLab pipeline run on the specified branch', () => {
    const initialTotal = service.totalRuns();
    const runId = service.triggerPipelineRun('staging', 'ci(gitlab): verify bun & biome pipeline');

    expect(runId).toContain('gl-pipe-');
    expect(service.totalRuns()).toBe(initialTotal + 1);
    expect(service.isRunning()).toBe(true);

    const activeRun = service.activeRun();
    expect(activeRun).not.toBeNull();
    expect(activeRun?.branch).toBe('staging');
    expect(activeRun?.commitMessage).toBe('ci(gitlab): verify bun & biome pipeline');
    expect(activeRun?.steps.some((s) => s.name === 'quality_biome')).toBe(true);
  });

  it('should handle staging rollback and restore online status', async () => {
    service.rollbackStaging('a8f92d4');

    expect(service.stagingTarget().activeCommitSha).toBe('a8f92d4');
    expect(service.stagingTarget().status).toBe('deploying');

    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(service.stagingTarget().status).toBe('online');
  });
});
