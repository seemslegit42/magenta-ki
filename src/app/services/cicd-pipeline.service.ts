import { computed, Injectable, inject, signal } from '@angular/core';
import {
  PipelineRun,
  PipelineStatus,
  PipelineStep,
  PipelineStepName,
  StagingTargetStatus,
} from '../models/cicd.models';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class CicdPipelineService {
  private auditService: AuditService;
  private notificationService: NotificationService;

  public readonly pipelineRuns = signal<PipelineRun[]>([]);
  public readonly isRunning = signal<boolean>(false);
  public readonly activeRunId = signal<string | null>(null);

  public readonly stagingTarget = signal<StagingTargetStatus>({
    targetName: 'WebOS Staging Target (GitLab Runner)',
    url: 'https://staging.verdigris-webos.internal',
    environment: 'staging',
    status: 'online',
    activeVersion: 'v2.5.0',
    activeCommitSha: 'b9d41e2',
    lastDeployedAt: Date.now() - 1800000,
    healthCheckStatus: 'passing',
    latencyMs: 12,
    containerId: 'webos-staging-ssr',
    memoryUsageMb: 128,
    cpuPercent: 2.8,
    replicas: 2,
  });

  public readonly activeRun = computed(() => {
    const id = this.activeRunId();
    if (!id) return this.pipelineRuns()[0] || null;
    return this.pipelineRuns().find((r) => r.id === id) || null;
  });

  public readonly latestRun = computed(() => {
    return this.pipelineRuns()[0] || null;
  });

  public readonly totalRuns = computed(() => this.pipelineRuns().length);
  public readonly successfulRuns = computed(
    () => this.pipelineRuns().filter((r) => r.status === 'success').length,
  );
  public readonly failedRuns = computed(
    () => this.pipelineRuns().filter((r) => r.status === 'failed').length,
  );
  public readonly passRatePercent = computed(() => {
    const total = this.totalRuns();
    if (total === 0) return 100;
    return Math.round((this.successfulRuns() / total) * 100);
  });

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

    this.seedInitialRuns();
  }

  public setDependenciesForTesting(audit: AuditService, notif: NotificationService): void {
    this.auditService = audit;
    this.notificationService = notif;
  }

  public async syncWithServer(): Promise<void> {
    if (typeof fetch === 'undefined' || typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/cicd/runs');
      if (!res.ok) return;
      const data = (await res.json()) as {
        runs?: PipelineRun[];
        staging?: {
          activeVersion?: string;
          activeCommitSha?: string;
          lastDeployedAt?: number;
          status?: StagingTargetStatus['status'];
          healthCheckStatus?: StagingTargetStatus['healthCheckStatus'];
        };
      };
      if (Array.isArray(data.runs) && data.runs.length > 0) {
        this.pipelineRuns.set(data.runs);
        if (!this.activeRunId()) {
          this.activeRunId.set(data.runs[0].id);
        }
      }
      if (data.staging) {
        this.stagingTarget.update((curr) => ({
          ...curr,
          activeVersion: data.staging?.activeVersion ?? curr.activeVersion,
          activeCommitSha: data.staging?.activeCommitSha ?? curr.activeCommitSha,
          lastDeployedAt: data.staging?.lastDeployedAt ?? curr.lastDeployedAt,
          status: data.staging?.status ?? curr.status,
          healthCheckStatus: data.staging?.healthCheckStatus ?? curr.healthCheckStatus,
        }));
      }
    } catch {
      // Keep local state if API unavailable
    }
  }

  private seedInitialRuns(): void {
    const defaultRuns: PipelineRun[] = [
      {
        id: 'gl-pipe-20418',
        commitSha: 'b9d41e2',
        commitMessage: 'ci(gitlab): bun-only pipeline, biome quality gate & uat portal',
        author: 'bmanmarlow@gmail.com',
        branch: 'staging',
        triggerEvent: 'gitlab_push',
        status: 'success',
        startedAt: Date.now() - 1900000,
        completedAt: Date.now() - 1860000,
        durationMs: 38400,
        stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
        steps: [
          {
            name: 'quality_biome',
            label: 'Biome Lint & Format Gate',
            status: 'success',
            durationMs: 1100,
            command: 'bunx biome ci .',
            logs: ['Checked workspace files cleanly. 0 errors.'],
          },
          {
            name: 'typecheck',
            label: 'TypeScript Strict Check',
            status: 'success',
            durationMs: 2800,
            command: 'bunx tsc --noEmit',
            logs: ['0 strict compiler diagnostics.'],
          },
          {
            name: 'test_unit',
            label: 'Unit Suite (Bun + Go)',
            status: 'success',
            durationMs: 2400,
            command: 'bun test tests/unit && go test ./...',
            logs: ['Bun unit test specs passed; Go handler & auth tests passed.'],
          },
          {
            name: 'test_integration',
            label: 'HTTP Integration Suite',
            status: 'success',
            durationMs: 3100,
            command: 'bun test tests/integration',
            logs: ['REST contract & validation assertions passed.'],
          },
          {
            name: 'test_e2e',
            label: 'Workflow E2E Suite (Bun)',
            status: 'success',
            durationMs: 4900,
            command: 'bun test tests/e2e',
            logs: ['All end-to-end user & system journeys passed without Playwright bloat.'],
          },
          {
            name: 'build_webos',
            label: 'Angular SSR Production Build',
            status: 'success',
            durationMs: 12100,
            command: 'bun run build',
            logs: ['Output generated in dist/app.'],
          },
          {
            name: 'build_go',
            label: 'Go Gateway Binary Build',
            status: 'success',
            durationMs: 3400,
            command: 'cd go && go build -o ../bin/gateway-server ./cmd/server/main.go',
            logs: ['Compiled static Go microservice gateway binary.'],
          },
          {
            name: 'deploy_staging',
            label: 'Docker Staging Deployment',
            status: 'success',
            durationMs: 8600,
            command: 'docker compose -f docker-compose.staging.yml up -d --build',
            logs: ['Health probe HTTP 200 OK at /api/cicd/staging-health.'],
          },
        ],
      },
      {
        id: 'gl-pipe-20417',
        commitSha: 'a8f92d4',
        commitMessage: 'feat(git): enforce gitlab flow & lefthook conventional commits',
        author: 'bmanmarlow@gmail.com',
        branch: 'main',
        triggerEvent: 'merge_request',
        status: 'success',
        startedAt: Date.now() - 3600000 * 3,
        completedAt: Date.now() - 3600000 * 2.95,
        durationMs: 35200,
        stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
        steps: [
          {
            name: 'quality_biome',
            label: 'Biome Lint & Format Gate',
            status: 'success',
            durationMs: 1050,
            command: 'bunx biome ci .',
            logs: ['0 errors'],
          },
          {
            name: 'typecheck',
            label: 'TypeScript Strict Check',
            status: 'success',
            durationMs: 2600,
            command: 'bunx tsc --noEmit',
            logs: ['Clean'],
          },
          {
            name: 'test_unit',
            label: 'Unit Suite (Bun + Go)',
            status: 'success',
            durationMs: 2100,
            command: 'bun test tests/unit',
            logs: ['Passed'],
          },
          {
            name: 'test_integration',
            label: 'HTTP Integration Suite',
            status: 'success',
            durationMs: 2900,
            command: 'bun test tests/integration',
            logs: ['Passed'],
          },
          {
            name: 'test_e2e',
            label: 'Workflow E2E Suite (Bun)',
            status: 'success',
            durationMs: 4700,
            command: 'bun test tests/e2e',
            logs: ['Passed'],
          },
          {
            name: 'build_webos',
            label: 'Angular SSR Production Build',
            status: 'success',
            durationMs: 11200,
            command: 'bun run build',
            logs: ['Built dist/app'],
          },
          {
            name: 'build_go',
            label: 'Go Gateway Binary Build',
            status: 'success',
            durationMs: 3100,
            command: 'go build',
            logs: ['Compiled'],
          },
          {
            name: 'deploy_staging',
            label: 'Docker Staging Deployment',
            status: 'success',
            durationMs: 7550,
            command: 'docker compose up -d',
            logs: ['Healthy'],
          },
        ],
      },
    ];

    this.pipelineRuns.set(defaultRuns);
    this.activeRunId.set(defaultRuns[0].id);
  }

  public triggerPipelineRun(
    branch = 'main',
    commitMessage = 'ci(gitlab): trigger bun & biome verification pipeline',
    triggerEvent: PipelineRun['triggerEvent'] = 'manual',
  ): string {
    if (this.isRunning()) return this.activeRunId() || '';

    const randomSha = Math.random().toString(16).substring(2, 9);
    const runId = `gl-pipe-${Math.floor(20500 + Math.random() * 79000)}`;
    const startTime = Date.now();

    const initialSteps: PipelineStep[] = [
      {
        name: 'quality_biome',
        label: 'Biome Lint & Format Gate',
        status: 'queued',
        durationMs: 0,
        command: 'bunx biome ci .',
        logs: [],
      },
      {
        name: 'typecheck',
        label: 'TypeScript Strict Check',
        status: 'queued',
        durationMs: 0,
        command: 'bunx tsc --noEmit',
        logs: [],
      },
      {
        name: 'test_unit',
        label: 'Unit Suite (Bun + Go)',
        status: 'queued',
        durationMs: 0,
        command: 'bun test tests/unit && go test ./...',
        logs: [],
      },
      {
        name: 'test_integration',
        label: 'HTTP Integration Suite',
        status: 'queued',
        durationMs: 0,
        command: 'bun test tests/integration',
        logs: [],
      },
      {
        name: 'test_e2e',
        label: 'Workflow E2E Suite (Bun)',
        status: 'queued',
        durationMs: 0,
        command: 'bun test tests/e2e',
        logs: [],
      },
      {
        name: 'build_webos',
        label: 'Angular SSR Production Build',
        status: 'queued',
        durationMs: 0,
        command: 'bun run build',
        logs: [],
      },
      {
        name: 'build_go',
        label: 'Go Gateway Binary Build',
        status: 'queued',
        durationMs: 0,
        command: 'cd go && go build -o ../bin/gateway-server ./cmd/server/main.go',
        logs: [],
      },
      {
        name: 'deploy_staging',
        label: 'Docker Staging Deployment',
        status: 'queued',
        durationMs: 0,
        command: 'docker compose -f docker-compose.staging.yml up -d --build',
        logs: [],
      },
    ];

    const newRun: PipelineRun = {
      id: runId,
      commitSha: randomSha,
      commitMessage,
      author: 'bmanmarlow@gmail.com',
      branch,
      triggerEvent,
      status: 'running',
      startedAt: startTime,
      durationMs: 0,
      steps: initialSteps,
    };

    this.pipelineRuns.update((prev) => [newRun, ...prev]);
    this.activeRunId.set(runId);
    this.isRunning.set(true);

    this.auditService.logEvent({
      action: 'GITLAB_PIPELINE_TRIGGERED',
      category: 'system',
      severity: 'info',
      targetEntity: `pipeline:${runId}`,
      details: `GitLab CI Pipeline (${runId}) triggered on branch [${branch}] - SHA: ${randomSha}`,
    });

    this.notificationService.notify({
      title: `GitLab Pipeline Started: ${runId}`,
      message: `Triggered by ${triggerEvent} on ${branch} (${randomSha})`,
      category: 'task',
      priority: 'normal',
    });

    if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
      void fetch('/api/cicd/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, commitMessage, triggerEvent }),
      }).catch(() => undefined);
    }

    this.executeStepSequence(runId, 0, startTime);
    return runId;
  }

  private executeStepSequence(runId: string, stepIndex: number, startTime: number): void {
    const run = this.pipelineRuns().find((r) => r.id === runId);
    if (!run || stepIndex >= run.steps.length) {
      this.finishRun(runId, 'success', startTime);
      return;
    }

    const step = run.steps[stepIndex];
    this.updateStep(runId, step.name, {
      status: 'running',
      logs: [`[${new Date().toISOString()}] Executing: ${step.label}`, `$ ${step.command}`],
    });

    const stepDuration = 500 + Math.floor(Math.random() * 600);

    setTimeout(() => {
      const logs = [
        `[${new Date().toISOString()}] Executing: ${step.label}`,
        `$ ${step.command}`,
        `Completed in ${(stepDuration / 1000).toFixed(2)}s (exit code 0)`,
      ];

      this.updateStep(runId, step.name, {
        status: 'success',
        durationMs: stepDuration,
        logs,
      });

      this.executeStepSequence(runId, stepIndex + 1, startTime);
    }, stepDuration);
  }

  private finishRun(runId: string, finalStatus: PipelineStatus, startTime: number): void {
    const totalDuration = Date.now() - startTime;
    const deployedUrl = 'https://staging.verdigris-webos.internal';

    this.pipelineRuns.update((prev) =>
      prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              status: finalStatus,
              completedAt: Date.now(),
              durationMs: totalDuration,
              stagingDeployedUrl: deployedUrl,
            }
          : r,
      ),
    );

    this.isRunning.set(false);

    const targetRun = this.pipelineRuns().find((r) => r.id === runId);
    if (targetRun && finalStatus === 'success') {
      this.stagingTarget.update((curr) => ({
        ...curr,
        status: 'online',
        activeCommitSha: targetRun.commitSha,
        lastDeployedAt: Date.now(),
        healthCheckStatus: 'passing',
        latencyMs: 11 + Math.floor(Math.random() * 6),
      }));

      this.auditService.logEvent({
        action: 'STAGING_DEPLOYMENT_SUCCESS',
        category: 'system',
        severity: 'info',
        targetEntity: 'staging:target',
        details: `Staging Deployment Succeeded - SHA ${targetRun.commitSha} live at ${deployedUrl}`,
      });

      this.notificationService.notify({
        title: `Staging Deployed (${targetRun.commitSha})`,
        message: `Bun + Biome GitLab CI pipeline completed in ${(totalDuration / 1000).toFixed(1)}s.`,
        category: 'update',
        priority: 'high',
      });
    }
  }

  private updateStep(runId: string, stepName: PipelineStepName, updates: Partial<PipelineStep>): void {
    this.pipelineRuns.update((prev) =>
      prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              steps: r.steps.map((s) => (s.name === stepName ? { ...s, ...updates } : s)),
            }
          : r,
      ),
    );
  }

  public selectRun(runId: string): void {
    this.activeRunId.set(runId);
  }

  public rollbackStaging(commitSha: string): void {
    this.stagingTarget.update((curr) => ({
      ...curr,
      status: 'deploying',
      activeCommitSha: commitSha,
      lastDeployedAt: Date.now(),
    }));

    if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
      void fetch('/api/cicd/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitSha }),
      }).catch(() => undefined);
    }

    this.auditService.logEvent({
      action: 'STAGING_ROLLBACK_TRIGGERED',
      category: 'system',
      severity: 'warning',
      targetEntity: 'staging:target',
      details: `Staging Rollback Triggered to commit SHA: ${commitSha}`,
    });

    setTimeout(() => {
      this.stagingTarget.update((curr) => ({
        ...curr,
        status: 'online',
        healthCheckStatus: 'passing',
      }));

      this.notificationService.notify({
        title: 'Staging Rollback Complete',
        message: `Staging environment restored to commit ${commitSha}.`,
        category: 'update',
        priority: 'normal',
      });
    }, 1200);
  }
}
