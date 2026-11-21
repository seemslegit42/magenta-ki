import { computed, Injectable, inject, signal } from '@angular/core';
import {
  UatBusinessArea,
  UatScenario,
  UatScenarioStatus,
  UatSignOffDecision,
  UatSignOffRecord,
} from '../models/cicd.models';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const DEFAULT_UAT_SCENARIOS: UatScenario[] = [
  {
    id: 'UAT-01',
    businessArea: 'Project Collaboration',
    title: 'Team members can create and organize projects safely',
    plainLanguageGoal: 'Confirm staff can add a new project, save details, and keep team work separated.',
    stepsToVerify: [
      'Open Enterprise Projects Manager from Applications.',
      'Add a new project with a name and short description, then save.',
      'Refresh or reopen the list and confirm your project appears cleanly.',
    ],
    expectedOutcome:
      'New projects appear right away with accurate names and stay assigned to the correct team.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-02',
    businessArea: 'Document Workspace',
    title: 'Documents open, save, and download without losing content',
    plainLanguageGoal: 'Verify team members can upload or edit a document and retrieve the exact file later.',
    stepsToVerify: [
      'Open WOPI Office Suite or OS File Explorer.',
      'Open an existing document or save a brief text update.',
      'Download or reopen the document to verify all edits remain intact.',
    ],
    expectedOutcome: 'Saved changes remain readable and file names stay intact without formatting errors.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-03',
    businessArea: 'Billing & Usage',
    title: 'Usage totals and pricing floors match finance policy',
    plainLanguageGoal:
      'Ensure usage summaries and customer cost breakdowns match approved pricing agreements.',
    stepsToVerify: [
      'Open Control Plane & Gateway and view the Billing or Economy summary.',
      'Check that displayed unit prices and customer totals look clear and legible.',
      'Verify there are no unexpected warnings or blank totals.',
    ],
    expectedOutcome:
      'Cost figures, customer balances, and upgrade guidance align with current business pricing.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-04',
    businessArea: 'Security & Access',
    title: 'Restricted actions are protected and recorded',
    plainLanguageGoal:
      'Confirm sensitive permissions are respected and important team activity appears in the audit record.',
    stepsToVerify: [
      'Open Audit Trail & RBAC Sentinel.',
      'Confirm recent team actions appear with clear timestamps and action names.',
      'Verify role permissions clearly distinguish staff and administrator capabilities.',
    ],
    expectedOutcome:
      'Every major action is clearly logged and restricted settings cannot be changed by guest roles.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
];

@Injectable({ providedIn: 'root' })
export class UatService {
  private auditService: AuditService;
  private notificationService: NotificationService;

  public readonly scenarios = signal<UatScenario[]>(DEFAULT_UAT_SCENARIOS);
  public readonly signOff = signal<UatSignOffRecord>({
    releaseLabel: 'Release 2.5 (Staging Review)',
    decision: 'pending',
    signedBy: '',
    role: '',
    summaryNote: '',
    signedAt: null,
  });

  public readonly selectedArea = signal<UatBusinessArea | 'All'>('All');
  public readonly selectedStatus = signal<UatScenarioStatus | 'all'>('all');
  public readonly isSaving = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly filteredScenarios = computed(() => {
    const area = this.selectedArea();
    const status = this.selectedStatus();
    return this.scenarios().filter((s) => {
      const areaMatch = area === 'All' || s.businessArea === area;
      const statusMatch = status === 'all' || s.status === status;
      return areaMatch && statusMatch;
    });
  });

  public readonly totalCount = computed(() => this.scenarios().length);
  public readonly approvedCount = computed(
    () => this.scenarios().filter((s) => s.status === 'approved').length,
  );
  public readonly changesRequestedCount = computed(
    () => this.scenarios().filter((s) => s.status === 'changes_requested').length,
  );
  public readonly blockedCount = computed(
    () => this.scenarios().filter((s) => s.status === 'blocked').length,
  );
  public readonly pendingCount = computed(
    () => this.scenarios().filter((s) => s.status === 'pending').length,
  );
  public readonly completionPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    const reviewed = total - this.pendingCount();
    return Math.round((reviewed / total) * 100);
  });
  public readonly allScenariosApproved = computed(
    () => this.totalCount() > 0 && this.approvedCount() === this.totalCount(),
  );

  constructor() {
    let resolvedAudit: AuditService | null = null;
    let resolvedNotif: NotificationService | null = null;
    try {
      resolvedAudit = inject(AuditService, { optional: true });
    } catch {
      resolvedAudit = null;
    }
    try {
      resolvedNotif = inject(NotificationService, { optional: true });
    } catch {
      resolvedNotif = null;
    }
    this.auditService = resolvedAudit ?? new AuditService();
    this.notificationService = resolvedNotif ?? new NotificationService();
  }

  public setDependenciesForTesting(audit: AuditService, notif: NotificationService): void {
    this.auditService = audit;
    this.notificationService = notif;
  }

  public async loadFromServer(): Promise<void> {
    if (typeof fetch === 'undefined' || typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/uat/scenarios');
      if (!res.ok) return;
      const data = (await res.json()) as { scenarios?: UatScenario[]; signOff?: UatSignOffRecord };
      if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        this.scenarios.set(data.scenarios);
      }
      if (data.signOff) {
        this.signOff.set(data.signOff);
      }
      this.errorMessage.set(null);
    } catch {
      // Keep local resilient defaults if offline
    }
  }

  public async updateScenarioVerdict(
    scenarioId: string,
    status: UatScenarioStatus,
    reviewerName: string,
    reviewerNote: string,
  ): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const trimmedName = reviewerName.trim();
    const trimmedNote = reviewerNote.trim();

    this.scenarios.update((list) =>
      list.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              status,
              reviewerName: trimmedName || s.reviewerName,
              reviewerNote: trimmedNote,
              updatedAt: Date.now(),
            }
          : s,
      ),
    );

    if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/uat/scenarios/${encodeURIComponent(scenarioId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            reviewerName: trimmedName,
            reviewerNote: trimmedNote,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { scenario?: UatScenario };
          if (data.scenario) {
            this.scenarios.update((list) => list.map((s) => (s.id === scenarioId ? data.scenario! : s)));
          }
        }
      } catch {
        // State remains updated locally
      }
    }

    this.auditService.logEvent({
      action: 'UAT_SCENARIO_REVIEWED',
      category: 'system',
      severity: status === 'blocked' ? 'warning' : 'info',
      targetEntity: `uat:${scenarioId}`,
      details: `Business review updated for ${scenarioId} to ${status}`,
    });

    this.isSaving.set(false);
  }

  public async submitSignOff(
    decision: UatSignOffDecision,
    signedBy: string,
    role: string,
    summaryNote: string,
  ): Promise<boolean> {
    const cleanName = signedBy.trim();
    const cleanRole = role.trim() || 'Business Owner';
    const cleanNote = summaryNote.trim();

    if (decision !== 'pending' && !cleanName) {
      this.errorMessage.set('Please enter your full name before recording a release decision.');
      return false;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const nextRecord: UatSignOffRecord = {
      releaseLabel: this.signOff().releaseLabel,
      decision,
      signedBy: cleanName,
      role: cleanRole,
      summaryNote: cleanNote,
      signedAt: decision === 'pending' ? null : Date.now(),
    };

    if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/uat/signoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextRecord),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          this.errorMessage.set(err.error || 'Unable to save release sign-off.');
          this.isSaving.set(false);
          return false;
        }
        const data = (await res.json()) as { signOff?: UatSignOffRecord };
        if (data.signOff) {
          this.signOff.set(data.signOff);
        } else {
          this.signOff.set(nextRecord);
        }
      } catch {
        this.signOff.set(nextRecord);
      }
    } else {
      this.signOff.set(nextRecord);
    }

    this.auditService.logEvent({
      action: 'UAT_RELEASE_SIGNOFF',
      category: 'system',
      severity: decision === 'approved' ? 'info' : 'warning',
      targetEntity: 'release:staging',
      details: `Business release decision "${decision}" recorded by ${cleanName || 'Reviewer'} (${cleanRole})`,
    });

    this.notificationService.notify({
      title: decision === 'approved' ? 'Release Approved for Launch' : 'Release Held for Changes',
      message: `${cleanName || 'Business Reviewer'} recorded "${decision}" for ${nextRecord.releaseLabel}.`,
      category: 'update',
      priority: 'high',
    });

    this.isSaving.set(false);
    return true;
  }

  public generateExecutiveSummaryText(): string {
    const record = this.signOff();
    const lines = [
      `BUSINESS ACCEPTANCE SIGN-OFF REPORT`,
      `Release: ${record.releaseLabel}`,
      `Overall Decision: ${record.decision.toUpperCase()}`,
      `Reviewed By: ${record.signedBy || 'Pending Sign-Off'}${record.role ? ` (${record.role})` : ''}`,
      `Progress: ${this.approvedCount()} of ${this.totalCount()} scenarios approved`,
      ``,
      `SCENARIO DETAILS`,
      ...this.scenarios().map((s) => {
        const note = s.reviewerNote ? ` | Notes: ${s.reviewerNote}` : '';
        return `- [${s.id}] ${s.businessArea} — ${s.title}: ${s.status.replace('_', ' ').toUpperCase()}${note}`;
      }),
    ];
    if (record.summaryNote) {
      lines.push('', `Executive Notes: ${record.summaryNote}`);
    }
    return lines.join('\n');
  }
}
