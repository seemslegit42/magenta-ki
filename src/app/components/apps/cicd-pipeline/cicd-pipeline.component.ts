import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CicdPipelineService } from '../../../services/cicd-pipeline.service';
import { UatService } from '../../../services/uat.service';
import { WindowManagerService } from '../../../services/window-manager.service';
import { TablerIconComponent } from '../../common/tabler-icon.component';

@Component({
  selector: 'app-cicd-pipeline',
  imports: [CommonModule, TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full gap-4 font-['Lexend'] text-[#F5FFFA] select-none">
      <!-- App Header & Primary Action -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-[#3EB991]/15 border border-[#3EB991]/40 flex items-center justify-center text-[#3EB991] shrink-0">
            <app-tabler-icon name="git-branch" size="18" />
          </div>
          <div>
            <h2 class="font-['Comfortaa'] text-lg font-bold text-[#F5FFFA]">
              GitLab CI/CD &amp; Release Pipeline
            </h2>
            <p class="text-xs text-[#8C94A8]">
              GitLab Flow · Bun-Only Runner · Biome Quality Gate · Lefthook Hooks · Go &amp; Angular SSR
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            (click)="openBusinessUat()"
            class="px-3.5 py-2 rounded-lg bg-[#20B2AA]/15 hover:bg-[#20B2AA]/25 border border-[#20B2AA]/40 text-[#F5FFFA] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <app-tabler-icon name="clipboard-check" size="16" class="text-[#20B2AA]" />
            <span>Business UAT Portal</span>
          </button>

          <button
            type="button"
            [disabled]="cicdService.isRunning()"
            (click)="triggerNewRun()"
            class="px-4 py-2 rounded-lg bg-[#3EB991] hover:bg-[#52caa1] text-[#0E1015] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
          >
            <app-tabler-icon [name]="cicdService.isRunning() ? 'refresh' : 'player-play'" size="16" [class]="cicdService.isRunning() ? 'animate-spin' : ''" />
            <span>{{ cicdService.isRunning() ? 'Running Pipeline...' : 'Run Pipeline' }}</span>
          </button>
        </div>
      </header>

      <!-- Navigation Bar -->
      <nav aria-label="Pipeline Views" class="flex items-center gap-1 bg-[#14161C] p-1 rounded-xl border border-white/10 text-xs">
        <button
          type="button"
          (click)="activeTab.set('runs')"
          class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          [class.bg-[#22252F]]="activeTab() === 'runs'"
          [class.text-[#3EB991]]="activeTab() === 'runs'"
          [class.text-[#8C94A8]]="activeTab() !== 'runs'"
        >
          <app-tabler-icon name="git-branch" size="15" />
          <span class="tabular-nums">Pipeline Runs ({{ cicdService.totalRuns() }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('staging')"
          class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          [class.bg-[#22252F]]="activeTab() === 'staging'"
          [class.text-[#20B2AA]]="activeTab() === 'staging'"
          [class.text-[#8C94A8]]="activeTab() !== 'staging'"
        >
          <app-tabler-icon name="server" size="15" />
          <span>Staging Target</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('workflow')"
          class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          [class.bg-[#22252F]]="activeTab() === 'workflow'"
          [class.text-[#F5FFFA]]="activeTab() === 'workflow'"
          [class.text-[#8C94A8]]="activeTab() !== 'workflow'"
        >
          <app-tabler-icon name="layers" size="15" />
          <span>GitLab CI &amp; Hooks</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('tests')"
          class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          [class.bg-[#22252F]]="activeTab() === 'tests'"
          [class.text-[#dfb7ff]]="activeTab() === 'tests'"
          [class.text-[#8C94A8]]="activeTab() !== 'tests'"
        >
          <app-tabler-icon name="shield-check" size="15" />
          <span>4-Tier Test Strategy</span>
        </button>
      </nav>

      <!-- Main Body -->
      <div class="flex-1 overflow-y-auto pr-1">
        @switch (activeTab()) {
          @case ('runs') {
            <div class="space-y-4">
              <!-- KPI Strip -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3.5">
                  <div class="text-xs text-[#8C94A8]">Total Pipeline Runs</div>
                  <div class="text-xl font-bold font-['Comfortaa'] text-white mt-1 tabular-nums">{{ cicdService.totalRuns() }}</div>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3.5">
                  <div class="text-xs text-[#8C94A8]">Pass Rate</div>
                  <div class="text-xl font-bold font-['Comfortaa'] text-[#3EB991] mt-1 tabular-nums">{{ cicdService.passRatePercent() }}%</div>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3.5">
                  <div class="text-xs text-[#8C94A8]">Staging Health</div>
                  <div class="text-sm font-semibold text-[#20B2AA] mt-1 capitalize">{{ cicdService.stagingTarget().status }}</div>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3.5">
                  <div class="text-xs text-[#8C94A8]">Business UAT Gate</div>
                  <div class="text-sm font-semibold mt-1 capitalize"
                    [class.text-[#3EB991]]="uatService.signOff().decision === 'approved'"
                    [class.text-[#FFB4AB]]="uatService.signOff().decision === 'rejected'"
                    [class.text-[#F5FFFA]]="uatService.signOff().decision === 'pending'"
                  >
                    {{ uatService.signOff().decision }} ({{ uatService.approvedCount() }}/{{ uatService.totalCount() }})
                  </div>
                </div>
              </div>

              <!-- Split View -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div class="lg:col-span-5 space-y-2.5">
                  <h3 class="text-xs font-semibold text-[#8C94A8]">Recent GitLab Executions</h3>
                  <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    @for (run of cicdService.pipelineRuns(); track run.id) {
                      <button
                        type="button"
                        (click)="cicdService.selectRun(run.id)"
                        class="w-full text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1.5 bg-[#14161C] border-white/10"
                        [class.bg-[#22252F]]="cicdService.activeRunId() === run.id"
                        [class.border-[#3EB991]]="cicdService.activeRunId() === run.id"
                      >
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-mono font-bold text-white">{{ run.id }} · {{ run.branch }}</span>
                          <span class="font-mono text-[#8C94A8] tabular-nums">{{ formatTime(run.startedAt) }}</span>
                        </div>
                        <p class="text-xs text-[#F5FFFA] font-light line-clamp-1">{{ run.commitMessage }}</p>
                        <div class="flex items-center justify-between text-[11px] font-mono text-[#8C94A8]">
                          <span>{{ run.commitSha }} · {{ run.status }}</span>
                          <span class="tabular-nums">{{ (run.durationMs / 1000).toFixed(1) }}s</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>

                <div class="lg:col-span-7 bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-4">
                  @let active = cicdService.activeRun();
                  @if (active) {
                    <div class="flex items-start justify-between pb-3 border-b border-white/10">
                      <div>
                        <h4 class="font-['Comfortaa'] text-base font-bold text-white">
                          {{ active.id }} · {{ active.status }}
                        </h4>
                        <p class="text-xs text-[#8C94A8] mt-1">{{ active.commitMessage }}</p>
                      </div>
                      <div class="text-right font-mono text-xs text-[#8C94A8]">
                        <div>Branch: <span class="text-white">{{ active.branch }}</span></div>
                        <div>Commit: <span class="text-[#3EB991]">{{ active.commitSha }}</span></div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      @for (step of active.steps; track step.name; let idx = $index) {
                        <button
                          type="button"
                          class="w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer bg-[#0E1015] border-white/10"
                          [class.border-[#3EB991]]="selectedStepName() === step.name"
                          (click)="selectedStepName.set(step.name)"
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                              <app-tabler-icon
                                [name]="step.status === 'success' ? 'check' : (step.status === 'running' ? 'refresh' : (step.status === 'failed' ? 'x' : 'clock'))"
                                size="16"
                                [class]="step.status === 'success' ? 'text-[#3EB991]' : (step.status === 'running' ? 'text-[#20B2AA] animate-spin' : 'text-[#8C94A8]')"
                              />
                              <div>
                                <div class="text-xs font-medium text-white">{{ idx + 1 }}. {{ step.label }}</div>
                                <div class="text-[11px] font-mono text-[#8C94A8]">{{ step.command }}</div>
                              </div>
                            </div>

                            <div class="text-right text-[11px] font-mono text-[#8C94A8] tabular-nums">
                              @if (step.durationMs > 0) {
                                <span class="text-[#3EB991]">{{ (step.durationMs / 1000).toFixed(1) }}s</span>
                              }
                            </div>
                          </div>

                          @if (selectedStepName() === step.name || step.status === 'running') {
                            <div class="mt-2 p-2 rounded bg-[#08090C] border border-white/10 font-mono text-[11px] text-[#3EB991] space-y-0.5">
                              @for (log of step.logs; track $index) {
                                <div>{{ log }}</div>
                              }
                              @if (step.logs.length === 0) {
                                <div class="text-[#8C94A8]">Waiting for runner slot...</div>
                              }
                            </div>
                          }
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          @case ('staging') {
            <div class="space-y-4">
              <div class="bg-[#14161C] border border-[#20B2AA]/30 rounded-xl p-5 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <h3 class="font-['Comfortaa'] text-lg font-bold text-white">{{ cicdService.stagingTarget().targetName }}</h3>
                    <div class="text-xs font-mono text-[#20B2AA] mt-0.5">
                      {{ cicdService.stagingTarget().url }} · {{ cicdService.stagingTarget().activeVersion }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="cicdService.rollbackStaging('a8f92d4')"
                      class="px-3.5 py-2 rounded-lg bg-[#1A1C23] hover:bg-[#22252F] border border-white/15 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                    >
                      Rollback Staging
                    </button>
                    <button
                      type="button"
                      (click)="triggerNewRun()"
                      class="px-3.5 py-2 rounded-lg bg-[#20B2AA] hover:bg-[#3EB991] text-[#0E1015] text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Redeploy Staging
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div class="bg-[#0E1015] border border-white/10 rounded-lg p-3">
                    <div class="text-[#8C94A8]">Active Commit</div>
                    <div class="font-mono font-bold text-[#3EB991] mt-1">{{ cicdService.stagingTarget().activeCommitSha }}</div>
                  </div>
                  <div class="bg-[#0E1015] border border-white/10 rounded-lg p-3">
                    <div class="text-[#8C94A8]">Health Probe</div>
                    <div class="font-mono font-bold text-white mt-1 capitalize">{{ cicdService.stagingTarget().healthCheckStatus }}</div>
                  </div>
                  <div class="bg-[#0E1015] border border-white/10 rounded-lg p-3">
                    <div class="text-[#8C94A8]">Latency</div>
                    <div class="font-mono font-bold text-[#20B2AA] mt-1 tabular-nums">{{ cicdService.stagingTarget().latencyMs }} ms</div>
                  </div>
                  <div class="bg-[#0E1015] border border-white/10 rounded-lg p-3">
                    <div class="text-[#8C94A8]">UAT Decision</div>
                    <div class="font-mono font-bold text-white mt-1 capitalize">{{ uatService.signOff().decision }}</div>
                  </div>
                </div>
              </div>
            </div>
          }

          @case ('workflow') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                <h3 class="font-['Comfortaa'] text-sm font-bold text-white">GitLab Flow Branching Strategy</h3>
                <ul class="space-y-2 text-xs text-[#8C94A8]">
                  <li><strong class="text-white">feature/* &amp; fix/*</strong> — Short-lived Merge Request branches tested by Biome, Bun, and Go.</li>
                  <li><strong class="text-white">main</strong> — Protected trunk; automatically builds and deploys Staging.</li>
                  <li><strong class="text-white">staging</strong> — Business Stakeholder UAT review environment (<code class="text-[#20B2AA]">/uat</code>).</li>
                  <li><strong class="text-white">production</strong> — Manual release gate promoted only after Business Owner sign-off.</li>
                </ul>
              </div>

              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                <h3 class="font-['Comfortaa'] text-sm font-bold text-white">Local Lefthook &amp; Biome Guardrails</h3>
                <ul class="space-y-2 text-xs text-[#8C94A8]">
                  <li><strong class="text-[#3EB991]">pre-commit</strong> — <code class="text-white">bunx biome check</code> on staged files + <code class="text-white">tsc --noEmit</code>.</li>
                  <li><strong class="text-[#3EB991]">commit-msg</strong> — Conventional Commits validation (<code class="text-white">feat|fix|ci|docs|test</code>).</li>
                  <li><strong class="text-[#3EB991]">pre-push</strong> — <code class="text-white">bun test tests/unit tests/integration</code> + Go backend test check.</li>
                </ul>
              </div>
            </div>
          }

          @case ('tests') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                <div class="text-xs font-semibold text-[#3EB991]">Tier 1 · Unit Tests (Bun + Go)</div>
                <p class="text-xs text-[#8C94A8]">Fast isolated specs for Angular services, UAT logic, and Go RBAC/economy handlers.</p>
                <div class="font-mono text-[11px] text-white">bun test tests/unit · cd go &amp;&amp; go test ./...</div>
              </div>

              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                <div class="text-xs font-semibold text-[#20B2AA]">Tier 2 · HTTP API Integration Tests (Bun)</div>
                <p class="text-xs text-[#8C94A8]">Real HTTP contract verification against Express SSR routes, CI/CD, and UAT APIs.</p>
                <div class="font-mono text-[11px] text-white">bun test tests/integration</div>
              </div>

              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                <div class="text-xs font-semibold text-[#dfb7ff]">Tier 3 · End-to-End Workflows (Bun, Zero Playwright)</div>
                <p class="text-xs text-[#8C94A8]">Full multi-step workflows for AgentFS, RBAC/Audit, Window Management, and Release Sign-Off.</p>
                <div class="font-mono text-[11px] text-white">bun test tests/e2e</div>
              </div>

              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                <div class="text-xs font-semibold text-[#F5FFFA]">Tier 4 · Business Stakeholder UAT</div>
                <p class="text-xs text-[#8C94A8]">Plain-English acceptance portal for non-technical business owners with exportable sign-off.</p>
                <button
                  type="button"
                  (click)="openBusinessUat()"
                  class="mt-1 px-3 py-1.5 rounded-lg bg-[#3EB991] text-[#0E1015] text-xs font-bold cursor-pointer"
                >
                  Open Business UAT Portal
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class CicdPipelineComponent {
  readonly pid = input<string>();

  protected readonly cicdService = inject(CicdPipelineService);
  protected readonly uatService = inject(UatService);
  private readonly windowManager = inject(WindowManagerService);

  public readonly activeTab = signal<'runs' | 'staging' | 'workflow' | 'tests'>('runs');
  public readonly selectedStepName = signal<string>('test_unit');

  constructor() {
    afterNextRender(() => {
      void this.cicdService.syncWithServer();
      void this.uatService.loadFromServer();
    });
  }

  public formatTime(ts: number): string {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  public triggerNewRun(): void {
    const branches = ['main', 'staging', 'feature/uat-portal'];
    const branch = branches[Math.floor(Math.random() * branches.length)];
    this.cicdService.triggerPipelineRun(branch, `ci(gitlab): bun & biome check on ${branch}`);
    this.activeTab.set('runs');
  }

  public openBusinessUat(): void {
    this.windowManager.openApp({
      id: 'uat-portal',
      name: 'Business Acceptance (UAT)',
      icon: 'clipboard-check',
      componentName: 'UatPortalComponent',
      entryComponent: 'UatPortalComponent',
      category: 'productivity',
    });
  }
}
