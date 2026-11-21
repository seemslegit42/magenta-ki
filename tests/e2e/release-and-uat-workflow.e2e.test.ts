import { describe, expect, it } from 'bun:test';
import { AuditService } from '../../src/app/services/audit.service';
import { CicdPipelineService } from '../../src/app/services/cicd-pipeline.service';
import { NotificationService } from '../../src/app/services/notification.service';
import { UatService } from '../../src/app/services/uat.service';

describe('E2E: Release Pipeline, Staging & Business Stakeholder UAT Sign-Off', () => {
  it('completes end-to-end promotion from GitLab CI trigger through Business UAT sign-off', async () => {
    const audit = new AuditService();
    const notifications = new NotificationService();

    const cicd = new CicdPipelineService();
    cicd.setDependenciesForTesting(audit, notifications);

    const uat = new UatService();
    uat.setDependenciesForTesting(audit, notifications);

    // 1. Trigger GitLab CI pipeline on staging branch
    const runId = cicd.triggerPipelineRun(
      'staging',
      'feat(release): candidate for stakeholder uat',
      'gitlab_push',
    );
    expect(runId).toContain('gl-pipe-');
    expect(cicd.activeRun()?.branch).toBe('staging');

    // 2. Business stakeholder reviews all scenarios in plain language
    const scenarios = uat.scenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(4);

    for (const scenario of scenarios) {
      await uat.updateScenarioVerdict(
        scenario.id,
        'approved',
        'Alex Rivera',
        `Verified ${scenario.businessArea} behavior in staging.`,
      );
    }

    expect(uat.allScenariosApproved()).toBe(true);
    expect(uat.completionPercent()).toBe(100);

    // 3. Business Owner submits official release sign-off
    const signed = await uat.submitSignOff(
      'approved',
      'Alex Rivera',
      'Director of Operations',
      'All business acceptance checks verified on staging.',
    );

    expect(signed).toBe(true);
    expect(uat.signOff().decision).toBe('approved');
    expect(uat.generateExecutiveSummaryText()).toContain('APPROVED');

    // 4. Audit trail records both engineering pipeline and business UAT governance events
    const logs = audit.allLogs();
    expect(logs.some((e) => e.action === 'GITLAB_PIPELINE_TRIGGERED')).toBe(true);
    expect(logs.some((e) => e.action === 'UAT_RELEASE_SIGNOFF')).toBe(true);
  });
});
