import { Injectable, signal, computed, inject } from '@angular/core';
import { PipelineRun, PipelineStatus, StagingTargetStatus, PipelineStep, PipelineStepName } from '../models/cicd.models';
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
    targetName: 'WebOS Staging Target (Cluster Alpha)',
    url: 'https://staging.verdigris-webos.internal',
    environment: 'staging',
    status: 'online',
    activeVersion: 'v2.4.0',
    activeCommitSha: 'a8f92d4',
    lastDeployedAt: Date.now() - 3600000 * 2.5,
    healthCheckStatus: 'passing',
    latencyMs: 14,
    containerId: 'webos-staging-ssr-01',
    memoryUsageMb: 142,
    cpuPercent: 3.2,
    replicas: 2
  });

  public readonly activeRun = computed(() => {
    const id = this.activeRunId();
    if (!id) return this.pipelineRuns()[0] || null;
    return this.pipelineRuns().find(r => r.id === id) || null;
  });

  public readonly latestRun = computed(() => {
    return this.pipelineRuns()[0] || null;
  });

  public readonly totalRuns = computed(() => this.pipelineRuns().length);
  public readonly successfulRuns = computed(() => this.pipelineRuns().filter(r => r.status === 'success').length);
  public readonly failedRuns = computed(() => this.pipelineRuns().filter(r => r.status === 'failed').length);
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

  private seedInitialRuns(): void {
    const defaultRuns: PipelineRun[] = [
      {
        id: 'run-10492',
        commitSha: 'a8f92d4',
        commitMessage: 'feat(cicd): configure automated build, test & staging target pipeline',
        author: 'bmanmarlow@gmail.com',
        branch: 'main',
        triggerEvent: 'push',
        status: 'success',
        startedAt: Date.now() - 3600000 * 2.5,
        completedAt: Date.now() - 3600000 * 2.45,
        durationMs: 42800,
        stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
        steps: [
          {
            name: 'checkout',
            label: 'Checkout Repository',
            status: 'success',
            durationMs: 1200,
            command: 'actions/checkout@v4',
            logs: ['fetching origin main...', 'HEAD is now at a8f92d4']
          },
          {
            name: 'install',
            label: 'Install Dependencies',
            status: 'success',
            durationMs: 4500,
            command: 'bun install --frozen-lockfile',
            logs: ['bun install v1.2.0', 'Saved 1482 packages in 4.2s']
          },
          {
            name: 'lint',
            label: 'ESLint & Angular Linter',
            status: 'success',
            durationMs: 3800,
            command: 'npm run lint',
            logs: ['> ng lint', 'Linting "app"... All files pass linting.']
          },
          {
            name: 'test_unit',
            label: 'Unit Test Suite (Vitest)',
            status: 'success',
            durationMs: 4700,
            command: 'npm run test:unit',
            logs: ['RUN v4.1.11 /app/applet', '✓ 3 test files passed (14 tests)', 'Duration: 4.72s']
          },
          {
            name: 'test_e2e',
            label: 'E2E Test Suite (Bun Test)',
            status: 'success',
            durationMs: 8200,
            command: 'npm run test:e2e',
            logs: ['bun test tests/e2e', '✓ 7 test specs passed (38 assertions)']
          },
          {
            name: 'build_angular',
            label: 'Build Angular WebOS (ApplicationBuilder)',
            status: 'success',
            durationMs: 11200,
            command: 'npm run build',
            logs: ['Building Angular bundle for production...', 'Output created in dist/app']
          },
          {
            name: 'build_go',
            label: 'Build Go Microservice Gateway',
            status: 'success',
            durationMs: 3100,
            command: 'go build -o bin/gateway-server ./cmd/server/main.go',
            logs: ['Compiling Go main.go...', 'Binary output: bin/gateway-server (12.4 MB)']
          },
          {
            name: 'docker_build',
            label: 'Docker Staging Image Build',
            status: 'success',
            durationMs: 4100,
            command: 'docker build -t verdigris-webos:staging .',
            logs: ['Step 1/20: FROM oven/bun:latest', 'Successfully tagged verdigris-webos:staging']
          },
          {
            name: 'deploy_staging',
            label: 'Staging Target Deployment',
            status: 'success',
            durationMs: 2000,
            command: 'docker compose -f docker-compose.staging.yml up -d',
            logs: ['Deploying to staging environment...', 'Healthcheck probe: HTTP 200 OK at /api/cicd/staging-health']
          }
        ]
      },
      {
        id: 'run-10491',
        commitSha: 'f32c91a',
        commitMessage: 'fix(core): optimize zoneless signals reactivity & window manager bounds',
        author: 'bmanmarlow@gmail.com',
        branch: 'develop',
        triggerEvent: 'push',
        status: 'success',
        startedAt: Date.now() - 3600000 * 5.2,
        completedAt: Date.now() - 3600000 * 5.15,
        durationMs: 39500,
        stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
        steps: [
          { name: 'checkout', label: 'Checkout Repository', status: 'success', durationMs: 1100, command: 'actions/checkout@v4', logs: ['HEAD at f32c91a'] },
          { name: 'install', label: 'Install Dependencies', status: 'success', durationMs: 4200, command: 'bun install', logs: ['Dependencies cached'] },
          { name: 'lint', label: 'ESLint & Angular Linter', status: 'success', durationMs: 3600, command: 'npm run lint', logs: ['All clean'] },
          { name: 'test_unit', label: 'Unit Test Suite (Vitest)', status: 'success', durationMs: 4500, command: 'npm run test:unit', logs: ['14 passed'] },
          { name: 'test_e2e', label: 'E2E Test Suite (Bun Test)', status: 'success', durationMs: 8100, command: 'npm run test:e2e', logs: ['38 passed'] },
          { name: 'build_angular', label: 'Build Angular WebOS', status: 'success', durationMs: 10800, command: 'npm run build', logs: ['Success'] },
          { name: 'build_go', label: 'Build Go Microservice Gateway', status: 'success', durationMs: 3000, command: 'go build', logs: ['Success'] },
          { name: 'docker_build', label: 'Docker Staging Image Build', status: 'success', durationMs: 4200, command: 'docker build', logs: ['Tagged'] },
          { name: 'deploy_staging', label: 'Staging Target Deployment', status: 'success', durationMs: 1800, command: 'docker compose up', logs: ['Deployed to staging'] }
        ]
      }
    ];

    this.pipelineRuns.set(defaultRuns);
    this.activeRunId.set(defaultRuns[0].id);
  }

  public triggerPipelineRun(
    branch = 'main',
    commitMessage = 'manual: trigger automated build & test CI/CD pipeline run',
    triggerEvent: PipelineRun['triggerEvent'] = 'workflow_dispatch'
  ): string {
    if (this.isRunning()) return this.activeRunId() || '';

    const randomSha = Math.random().toString(16).substring(2, 9);
    const runId = `run-${Math.floor(10000 + Math.random() * 90000)}`;
    const startTime = Date.now();

    const initialSteps: PipelineStep[] = [
      { name: 'checkout', label: 'Checkout Repository', status: 'queued', durationMs: 0, command: 'actions/checkout@v4', logs: [] },
      { name: 'install', label: 'Install Dependencies', status: 'queued', durationMs: 0, command: 'bun install --frozen-lockfile', logs: [] },
      { name: 'lint', label: 'ESLint & Angular Linter', status: 'queued', durationMs: 0, command: 'npm run lint', logs: [] },
      { name: 'test_unit', label: 'Unit Test Suite (Vitest)', status: 'queued', durationMs: 0, command: 'npm run test:unit', logs: [] },
      { name: 'test_e2e', label: 'E2E Test Suite (Bun Test)', status: 'queued', durationMs: 0, command: 'npm run test:e2e', logs: [] },
      { name: 'build_angular', label: 'Build Angular WebOS', status: 'queued', durationMs: 0, command: 'npm run build', logs: [] },
      { name: 'build_go', label: 'Build Go Microservice Gateway', status: 'queued', durationMs: 0, command: 'go build ./go/cmd/server/main.go', logs: [] },
      { name: 'docker_build', label: 'Docker Staging Image Build', status: 'queued', durationMs: 0, command: 'docker build -t verdigris-webos:staging .', logs: [] },
      { name: 'deploy_staging', label: 'Staging Target Deployment', status: 'queued', durationMs: 0, command: 'docker compose -f docker-compose.staging.yml up -d', logs: [] }
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
      steps: initialSteps
    };

    this.pipelineRuns.update(prev => [newRun, ...prev]);
    this.activeRunId.set(runId);
    this.isRunning.set(true);

    this.auditService.logEvent({
      action: 'CICD_PIPELINE_TRIGGERED',
      category: 'system',
      severity: 'info',
      targetEntity: `pipeline:${runId}`,
      details: `CI/CD Pipeline Triggered (${runId}) on branch [${branch}] - SHA: ${randomSha}`
    });

    this.notificationService.notify({
      title: `CI/CD Pipeline Started: ${runId}`,
      message: `Triggered by ${triggerEvent} on ${branch} (${randomSha})`,
      category: 'task',
      priority: 'normal'
    });

    // Execute steps sequentially
    this.executeStepSequence(runId, 0, startTime);
    return runId;
  }

  private executeStepSequence(runId: string, stepIndex: number, startTime: number): void {
    const run = this.pipelineRuns().find(r => r.id === runId);
    if (!run || stepIndex >= run.steps.length) {
      // All steps completed successfully
      this.finishRun(runId, 'success', startTime);
      return;
    }

    // Set step to running
    const step = run.steps[stepIndex];
    this.updateStep(runId, step.name, {
      status: 'running',
      logs: [`[${new Date().toISOString()}] Executing step: ${step.label}`, `$ ${step.command}`]
    });

    const stepDuration = 800 + Math.floor(Math.random() * 1200);

    setTimeout(() => {
      // Step success log
      const logs = [
        `[${new Date().toISOString()}] Executing step: ${step.label}`,
        `$ ${step.command}`,
        `Step completed cleanly in ${(stepDuration / 1000).toFixed(2)}s. Status 0 (SUCCESS)`
      ];

      this.updateStep(runId, step.name, {
        status: 'success',
        durationMs: stepDuration,
        logs
      });

      // Proceed to next step
      this.executeStepSequence(runId, stepIndex + 1, startTime);
    }, stepDuration);
  }

  private finishRun(runId: string, finalStatus: PipelineStatus, startTime: number): void {
    const totalDuration = Date.now() - startTime;
    const deployedUrl = 'https://staging.verdigris-webos.internal';

    this.pipelineRuns.update(prev => prev.map(r => {
      if (r.id === runId) {
        return {
          ...r,
          status: finalStatus,
          completedAt: Date.now(),
          durationMs: totalDuration,
          stagingDeployedUrl: deployedUrl
        };
      }
      return r;
    }));

    this.isRunning.set(false);

    // Update Staging Target Status
    const targetRun = this.pipelineRuns().find(r => r.id === runId);
    if (targetRun && finalStatus === 'success') {
      this.stagingTarget.update(curr => ({
        ...curr,
        status: 'online',
        activeCommitSha: targetRun.commitSha,
        lastDeployedAt: Date.now(),
        healthCheckStatus: 'passing',
        latencyMs: 12 + Math.floor(Math.random() * 8)
      }));

      this.auditService.logEvent({
        action: 'STAGING_DEPLOYMENT_SUCCESS',
        category: 'system',
        severity: 'info',
        targetEntity: 'staging:target',
        details: `Staging Deployment Succeeded - SHA ${targetRun.commitSha} live at ${deployedUrl}`
      });

      this.notificationService.notify({
        title: `Staging Deployed (${targetRun.commitSha})`,
        message: `Automated CI/CD pipeline succeeded in ${(totalDuration / 1000).toFixed(1)}s!`,
        category: 'update',
        priority: 'high'
      });
    }
  }

  private updateStep(runId: string, stepName: PipelineStepName, updates: Partial<PipelineStep>): void {
    this.pipelineRuns.update(prev => prev.map(r => {
      if (r.id === runId) {
        return {
          ...r,
          steps: r.steps.map(s => s.name === stepName ? { ...s, ...updates } : s)
        };
      }
      return r;
    }));
  }

  public selectRun(runId: string): void {
    this.activeRunId.set(runId);
  }

  public rollbackStaging(commitSha: string): void {
    this.stagingTarget.update(curr => ({
      ...curr,
      status: 'deploying',
      activeCommitSha: commitSha,
      lastDeployedAt: Date.now()
    }));

    this.auditService.logEvent({
      action: 'STAGING_ROLLBACK_TRIGGERED',
      category: 'system',
      severity: 'warning',
      targetEntity: 'staging:target',
      details: `Staging Rollback Triggered to commit SHA: ${commitSha}`
    });

    setTimeout(() => {
      this.stagingTarget.update(curr => ({
        ...curr,
        status: 'online',
        healthCheckStatus: 'passing'
      }));

      this.notificationService.notify({
        title: `Staging Rollback Complete`,
        message: `Staging deployment target rolled back to commit ${commitSha}.`,
        category: 'update',
        priority: 'normal'
      });
    }, 1500);
  }
}
