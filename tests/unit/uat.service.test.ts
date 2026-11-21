import { beforeEach, describe, expect, it } from 'bun:test';
import type { AuditService } from '../../src/app/services/audit.service';
import type { NotificationService } from '../../src/app/services/notification.service';
import { UatService } from '../../src/app/services/uat.service';

describe('UatService (Business Stakeholder UAT)', () => {
  let service: UatService;

  beforeEach(() => {
    const mockAudit = { logEvent: () => undefined, log: () => undefined };
    const mockNotif = { notify: () => undefined };

    service = new UatService();
    service.setDependenciesForTesting(
      mockAudit as unknown as AuditService,
      mockNotif as unknown as NotificationService,
    );
  });

  it('should seed plain-language business acceptance scenarios', () => {
    expect(service.totalCount()).toBeGreaterThanOrEqual(4);
    expect(service.pendingCount()).toBe(service.totalCount());
    expect(service.completionPercent()).toBe(0);
  });

  it('should filter scenarios by business area and review status', async () => {
    service.selectedArea.set('Project Collaboration');
    expect(service.filteredScenarios().every((s) => s.businessArea === 'Project Collaboration')).toBe(true);

    await service.updateScenarioVerdict('UAT-01', 'approved', 'Jordan Taylor', 'Verified project creation');
    service.selectedArea.set('All');
    service.selectedStatus.set('approved');

    expect(service.filteredScenarios().length).toBe(1);
    expect(service.filteredScenarios()[0].id).toBe('UAT-01');
  });

  it('should require a reviewer name when recording a final release sign-off decision', async () => {
    const failed = await service.submitSignOff('approved', '   ', 'Business Owner', 'Looks good');
    expect(failed).toBe(false);
    expect(service.errorMessage()).toContain('full name');

    const succeeded = await service.submitSignOff(
      'approved',
      'Jordan Taylor',
      'VP Operations',
      'Ready for launch',
    );
    expect(succeeded).toBe(true);
    expect(service.signOff().decision).toBe('approved');
    expect(service.signOff().signedBy).toBe('Jordan Taylor');
  });

  it('should generate a clean plain-English executive summary report', async () => {
    await service.updateScenarioVerdict('UAT-01', 'approved', 'Jordan Taylor', 'Smooth flow');
    await service.submitSignOff('approved', 'Jordan Taylor', 'Business Owner', 'Approved');

    const report = service.generateExecutiveSummaryText();
    expect(report).toContain('BUSINESS ACCEPTANCE SIGN-OFF REPORT');
    expect(report).toContain('Jordan Taylor');
    expect(report).toContain('APPROVED');
  });
});
