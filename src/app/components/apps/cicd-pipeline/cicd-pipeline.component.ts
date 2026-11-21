import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CicdPipelineService } from '../../../services/cicd-pipeline.service';

@Component({
  selector: 'app-cicd-pipeline',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full space-y-4 font-['Lexend'] text-[#F5FFFA] select-none">
      
      <!-- App Header & Navigation Tabs -->
      <header class="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#3EB991]/20 border border-[#3EB991]/40 flex items-center justify-center text-[#3EB991] shadow-[0_0_12px_rgba(62,185,145,0.3)]">
              <mat-icon class="text-lg">alt_route</mat-icon>
            </div>
            <div>
              <h2 class="font-['Comfortaa'] text-xl font-bold text-[#F5FFFA] flex items-center space-x-2">
                <span>CI/CD Automation & Staging Pipeline</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3EB991]/15 text-[#3EB991] border border-[#3EB991]/30">v2.4.0</span>
              </h2>
              <p class="text-[11px] text-[#8C94A8] font-light">
                Automated continuous integration, unit & E2E test execution, container builds, and staging target deployment.
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Action Trigger Button -->
        <div class="flex items-center space-x-2">
          <button
            type="button"
            [disabled]="cicdService.isRunning()"
            (click)="triggerNewRun()"
            class="px-3.5 py-2 rounded-xl bg-[#3EB991] hover:bg-[#52caa1] active:scale-95 text-[#0E1015] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg hover:shadow-[#3EB991]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <mat-icon class="text-sm" [class.animate-spin]="cicdService.isRunning()">
              {{ cicdService.isRunning() ? 'autorenew' : 'play_arrow' }}
            </mat-icon>
            <span>{{ cicdService.isRunning() ? 'Running Pipeline...' : 'Run CI/CD Pipeline' }}</span>
          </button>
        </div>
      </header>

      <!-- Navigation Bar -->
      <nav aria-label="CI/CD Views" class="flex items-center space-x-1 bg-[#14161C] p-1 rounded-xl border border-white/10 text-xs">
        <button
          type="button"
          (click)="activeTab.set('runs')"
          class="flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[#8C94A8]"
          [class.bg-[#22252F]]="activeTab() === 'runs'"
          [class.text-[#3EB991]]="activeTab() === 'runs'"
          [class.shadow-sm]="activeTab() === 'runs'">
          <mat-icon class="text-sm">view_timeline</mat-icon>
          <span>Pipeline Runs ({{ cicdService.totalRuns() }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('staging')"
          class="flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[#8C94A8]"
          [class.bg-[#22252F]]="activeTab() === 'staging'"
          [class.text-[#20B2AA]]="activeTab() === 'staging'"
          [class.shadow-sm]="activeTab() === 'staging'">
          <mat-icon class="text-sm">cloud_upload</mat-icon>
          <span>Staging Target</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('workflow')"
          class="flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[#8C94A8]"
          [class.bg-[#22252F]]="activeTab() === 'workflow'"
          [class.text-[#FF2A9D]]="activeTab() === 'workflow'"
          [class.shadow-sm]="activeTab() === 'workflow'">
          <mat-icon class="text-sm">code</mat-icon>
          <span>GitHub Actions Specs</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('tests')"
          class="flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[#8C94A8]"
          [class.bg-[#22252F]]="activeTab() === 'tests'"
          [class.text-[#dfb7ff]]="activeTab() === 'tests'"
          [class.shadow-sm]="activeTab() === 'tests'">
          <mat-icon class="text-sm">verified</mat-icon>
          <span>Test Suite Analytics</span>
        </button>
      </nav>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto pr-1">
        @switch (activeTab()) {

          <!-- TAB 1: PIPELINE RUNS & STEP WORKFLOW GRAPH -->
          @case ('runs') {
            <div class="space-y-4">
              <!-- Summary KPI Metrics Row -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono tracking-wider">Total Runs</span>
                    <div class="text-xl font-bold font-['Comfortaa'] text-white mt-0.5">{{ cicdService.totalRuns() }}</div>
                  </div>
                  <mat-icon class="text-xl text-[#3EB991]">history</mat-icon>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono tracking-wider">Pass Rate</span>
                    <div class="text-xl font-bold font-['Comfortaa'] text-[#3EB991] mt-0.5">{{ cicdService.passRatePercent() }}%</div>
                  </div>
                  <mat-icon class="text-xl text-[#3EB991]">check_circle</mat-icon>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono tracking-wider">Staging Status</span>
                    <div class="text-xs font-semibold text-[#20B2AA] mt-1 flex items-center space-x-1">
                      <span class="w-2 h-2 rounded-full bg-[#20B2AA] animate-pulse"></span>
                      <span class="capitalize">{{ cicdService.stagingTarget().status }}</span>
                    </div>
                  </div>
                  <mat-icon class="text-xl text-[#20B2AA]">dns</mat-icon>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono tracking-wider">Active Commit</span>
                    <div class="text-xs font-mono text-[#FF2A9D] mt-1">{{ cicdService.stagingTarget().activeCommitSha }}</div>
                  </div>
                  <mat-icon class="text-xl text-[#FF2A9D]">commit</mat-icon>
                </div>
              </div>

              <!-- Main Split View: Left List of Runs, Right Step Execution Graph & Logs -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                <!-- Runs List (5 cols) -->
                <div class="lg:col-span-5 space-y-2.5">
                  <h3 class="text-xs font-semibold text-[#8C94A8] uppercase tracking-wider font-mono">Recent Executions</h3>
                  
                  <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    @for (run of cicdService.pipelineRuns(); track run.id) {
                      <button
                        type="button"
                        (click)="cicdService.selectRun(run.id)"
                        class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 bg-[#14161C] border-white/10"
                        [class.bg-[#22252F]]="cicdService.activeRunId() === run.id"
                        [class.border-[#3EB991]]="cicdService.activeRunId() === run.id"
                        [class.shadow-lg]="cicdService.activeRunId() === run.id">
                        
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-2">
                            <span class="w-2.5 h-2.5 rounded-full"
                              [class.bg-[#3EB991]]="run.status === 'success'"
                              [class.bg-[#FF4D6D]]="run.status === 'failed'"
                              [class.bg-[#20B2AA]]="run.status === 'running'"
                              [class.animate-ping]="run.status === 'running'"></span>
                            <span class="font-mono text-xs font-bold text-white">{{ run.id }}</span>
                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8C94A8] border border-white/10">{{ run.branch }}</span>
                          </div>

                          <span class="text-[10px] font-mono text-[#8C94A8]">{{ formatTime(run.startedAt) }}</span>
                        </div>

                        <p class="text-xs text-[#F5FFFA] font-light line-clamp-1 leading-snug">{{ run.commitMessage }}</p>

                        <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-[#8C94A8]">
                          <span class="flex items-center space-x-1">
                            <mat-icon class="text-xs">commit</mat-icon>
                            <span>{{ run.commitSha }}</span>
                          </span>
                          <span>{{ (run.durationMs / 1000).toFixed(1) }}s</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>

                <!-- Active Run Details & Step Graph (7 cols) -->
                <div class="lg:col-span-7 bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col space-y-4">
                  @let active = cicdService.activeRun();
                  @if (active) {
                    <!-- Header -->
                    <div class="flex items-start justify-between pb-3 border-b border-white/10">
                      <div>
                        <div class="flex items-center space-x-2">
                          <h4 class="font-['Comfortaa'] text-base font-bold text-white">{{ active.id }}</h4>
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold"
                            [class.bg-[#3EB991]/20]="active.status === 'success'"
                            [class.text-[#3EB991]]="active.status === 'success'"
                            [class.bg-[#20B2AA]/20]="active.status === 'running'"
                            [class.text-[#20B2AA]]="active.status === 'running'"
                            [class.bg-[#FF4D6D]/20]="active.status === 'failed'"
                            [class.text-[#FF4D6D]]="active.status === 'failed'">
                            {{ active.status }}
                          </span>
                        </div>
                        <p class="text-xs text-[#8C94A8] mt-1">{{ active.commitMessage }}</p>
                      </div>

                      <div class="text-right font-mono text-xs text-[#8C94A8]">
                        <div>Branch: <span class="text-white font-semibold">{{ active.branch }}</span></div>
                        <div class="mt-0.5">SHA: <span class="text-[#3EB991]">{{ active.commitSha }}</span></div>
                      </div>
                    </div>

                    <!-- Step Workflow Graph -->
                    <div>
                      <h5 class="text-xs font-mono uppercase text-[#8C94A8] mb-2.5">Pipeline Execution Stages</h5>
                      
                      <div class="space-y-2">
                        @for (step of active.steps; track step.name; let idx = $index) {
                          <button 
                            type="button"
                            class="w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer bg-[#0E1015] border-white/5"
                            [class.bg-[#1E212B]]="selectedStepName() === step.name"
                            [class.border-[#3EB991]]="selectedStepName() === step.name"
                            (click)="selectedStepName.set(step.name)">
                            
                            <div class="flex items-center justify-between">
                              <div class="flex items-center space-x-2.5">
                                <!-- Status Icon -->
                                <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs"
                                  [class.bg-[#3EB991]/20]="step.status === 'success'"
                                  [class.text-[#3EB991]]="step.status === 'success'"
                                  [class.bg-[#20B2AA]/20]="step.status === 'running'"
                                  [class.text-[#20B2AA]]="step.status === 'running'"
                                  [class.bg-white/5]="step.status === 'queued'"
                                  [class.text-[#8C94A8]]="step.status === 'queued'"
                                  [class.bg-[#FF4D6D]/20]="step.status === 'failed'"
                                  [class.text-[#FF4D6D]]="step.status === 'failed'">
                                  <mat-icon class="text-sm">
                                    @switch (step.status) {
                                      @case ('success') { check }
                                      @case ('running') { autorenew }
                                      @case ('failed') { error }
                                      @default { schedule }
                                    }
                                  </mat-icon>
                                </div>

                                <div>
                                  <span class="text-xs font-medium text-white">{{ idx + 1 }}. {{ step.label }}</span>
                                  <div class="text-[10px] font-mono text-[#8C94A8]">$ {{ step.command }}</div>
                                </div>
                              </div>

                              <div class="flex items-center space-x-2 text-right">
                                @if (step.durationMs > 0) {
                                  <span class="text-[10px] font-mono text-[#3EB991]">{{ (step.durationMs / 1000).toFixed(1) }}s</span>
                                }
                                <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[#8C94A8]">
                                  {{ step.status }}
                                </span>
                              </div>
                            </div>

                            <!-- Step Terminal Output Logs -->
                            @if (selectedStepName() === step.name || step.status === 'running') {
                              <div class="mt-2.5 p-2 rounded bg-[#08090C] border border-white/10 font-mono text-[11px] text-emerald-400/90 max-h-36 overflow-y-auto space-y-0.5">
                                @for (log of step.logs; track $index) {
                                  <div>{{ log }}</div>
                                }
                                @if (step.logs.length === 0) {
                                  <div class="text-[#8C94A8]">Step queued for execution...</div>
                                }
                              </div>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="flex flex-col items-center justify-center h-64 text-[#8C94A8]">
                      <mat-icon class="text-3xl mb-2">find_in_page</mat-icon>
                      <p class="text-xs">Select a pipeline run from the left panel to inspect details.</p>
                    </div>
                  }
                </div>

              </div>
            </div>
          }

          <!-- TAB 2: STAGING DEPLOYMENT TARGET -->
          @case ('staging') {
            <div class="space-y-4">
              <!-- Staging Environment Hero Card -->
              <div class="bg-gradient-to-r from-[#171B26] via-[#14161C] to-[#1F1728] border border-[#20B2AA]/30 rounded-2xl p-5 shadow-2xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-xl bg-[#20B2AA]/20 border border-[#20B2AA]/40 flex items-center justify-center text-[#20B2AA] shadow-[0_0_20px_rgba(32,178,170,0.3)]">
                      <mat-icon class="text-2xl">cloud_done</mat-icon>
                    </div>
                    <div>
                      <h3 class="font-['Comfortaa'] text-lg font-bold text-white flex items-center space-x-2">
                        <span>{{ cicdService.stagingTarget().targetName }}</span>
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      </h3>
                      <a [href]="cicdService.stagingTarget().url" target="_blank" class="text-xs font-mono text-[#20B2AA] hover:underline flex items-center space-x-1 mt-0.5">
                        <span>{{ cicdService.stagingTarget().url }}</span>
                        <mat-icon class="text-xs">open_in_new</mat-icon>
                      </a>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      (click)="cicdService.rollbackStaging('f32c91a')"
                      class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium border border-white/10 transition-all flex items-center space-x-1 cursor-pointer">
                      <mat-icon class="text-sm">restore</mat-icon>
                      <span>Rollback Staging</span>
                    </button>
                    <button
                      type="button"
                      (click)="triggerNewRun()"
                      class="px-3 py-1.5 rounded-xl bg-[#20B2AA] hover:bg-[#3EB991] active:scale-95 text-[#0E1015] text-xs font-bold transition-all shadow-md flex items-center space-x-1 cursor-pointer">
                      <mat-icon class="text-sm">publish</mat-icon>
                      <span>Redeploy Staging</span>
                    </button>
                  </div>
                </div>

                <!-- Staging Metrics Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div class="bg-[#0E1015]/80 border border-white/10 rounded-xl p-3">
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono">Deployment Target</span>
                    <div class="text-xs font-bold text-white font-mono mt-1">Docker Compose Stack</div>
                    <span class="text-[9px] text-[#8C94A8] font-mono">Port 3080 & 3002</span>
                  </div>

                  <div class="bg-[#0E1015]/80 border border-white/10 rounded-xl p-3">
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono">Active Commit SHA</span>
                    <div class="text-xs font-bold text-[#FF2A9D] font-mono mt-1">{{ cicdService.stagingTarget().activeCommitSha }}</div>
                    <span class="text-[9px] text-[#8C94A8] font-mono">Branch: main</span>
                  </div>

                  <div class="bg-[#0E1015]/80 border border-white/10 rounded-xl p-3">
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono">Staging Latency</span>
                    <div class="text-xs font-bold text-[#3EB991] font-mono mt-1">{{ cicdService.stagingTarget().latencyMs }} ms</div>
                    <span class="text-[9px] text-[#8C94A8] font-mono">HTTP Probe: 200 OK</span>
                  </div>

                  <div class="bg-[#0E1015]/80 border border-white/10 rounded-xl p-3">
                    <span class="text-[10px] text-[#8C94A8] uppercase font-mono">Container Memory</span>
                    <div class="text-xs font-bold text-[#dfb7ff] font-mono mt-1">{{ cicdService.stagingTarget().memoryUsageMb }} MB</div>
                    <span class="text-[9px] text-[#8C94A8] font-mono">CPU: {{ cicdService.stagingTarget().cpuPercent }}%</span>
                  </div>
                </div>
              </div>

              <!-- Staging Topology & Configuration Specs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 class="font-['Comfortaa'] text-sm font-bold text-white flex items-center space-x-2">
                    <mat-icon class="text-[#20B2AA] text-base">dns</mat-icon>
                    <span>Staging Target Services & Reverse Proxy</span>
                  </h4>

                  <div class="space-y-2 text-xs font-mono">
                    <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                      <div>
                        <div class="text-white font-semibold">webos-staging-proxy (Caddy)</div>
                        <div class="text-[10px] text-[#8C94A8]">Port 3080 -> Reverse proxy to API & SSR</div>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">HEALTHY</span>
                    </div>

                    <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                      <div>
                        <div class="text-white font-semibold">webos-staging-ssr (Bun / Node)</div>
                        <div class="text-[10px] text-[#8C94A8]">Port 3002 -> Angular SSR server</div>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">HEALTHY</span>
                    </div>

                    <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                      <div>
                        <div class="text-white font-semibold">webos-staging-api (Go Service)</div>
                        <div class="text-[10px] text-[#8C94A8]">Port 8081 -> Gateway API service</div>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">HEALTHY</span>
                    </div>
                  </div>
                </div>

                <!-- Staging Automated Verification Rules -->
                <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 class="font-['Comfortaa'] text-sm font-bold text-white flex items-center space-x-2">
                    <mat-icon class="text-[#3EB991] text-base">verified_user</mat-icon>
                    <span>Staging Target Validation Policy</span>
                  </h4>

                  <ul class="space-y-2 text-xs text-[#8C94A8] font-light">
                    <li class="flex items-start space-x-2">
                      <mat-icon class="text-sm text-[#3EB991] shrink-0 mt-0.5">check_circle</mat-icon>
                      <span>Every push to <code class="text-[#3EB991] font-mono">main</code> triggers automatic build & deploy to Staging.</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <mat-icon class="text-sm text-[#3EB991] shrink-0 mt-0.5">check_circle</mat-icon>
                      <span>Automated HTTP probe checks <code class="text-[#20B2AA] font-mono">/api/cicd/staging-health</code> after deployment.</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <mat-icon class="text-sm text-[#3EB991] shrink-0 mt-0.5">check_circle</mat-icon>
                      <span>Instant zero-downtime container replacement via Docker compose staging stack.</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <mat-icon class="text-sm text-[#3EB991] shrink-0 mt-0.5">check_circle</mat-icon>
                      <span>One-click instant rollback capability to previous stable git commit SHA.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          }

          <!-- TAB 3: GITHUB ACTIONS SPECIFICATION -->
          @case ('workflow') {
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-['Comfortaa'] text-sm font-bold text-white">CI/CD Pipeline Workflow Specs</h3>
                  <p class="text-xs text-[#8C94A8] font-light">Stored in repository at <code class="text-[#FF2A9D] font-mono">.github/workflows/ci-cd.yml</code></p>
                </div>
              </div>

              <!-- Code Viewer Box -->
              <div class="bg-[#08090C] border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed max-h-[480px]">
                <div class="text-[#8C94A8]"># GitHub Actions CI/CD Pipeline Workflow</div>
                <div>name: WebOS Continuous Integration &amp; Staging Deployment</div>
                <div class="mt-2 text-[#20B2AA]">on:</div>
                <div class="pl-4">push:</div>
                <div class="pl-8">branches: [ "main", "develop", "staging" ]</div>
                <div class="pl-4">pull_request:</div>
                <div class="pl-8">branches: [ "main", "develop", "staging" ]</div>
                <div class="pl-4">workflow_dispatch:</div>
                <div class="mt-2 text-[#3EB991]">jobs:</div>
                <div class="pl-4 text-white">lint-and-test:</div>
                <div class="pl-8">runs-on: ubuntu-latest</div>
                <div class="pl-8">steps:</div>
                <div class="pl-12">- uses: actions/checkout&#64;v4</div>
                <div class="pl-12">- uses: actions/setup-node&#64;v4</div>
                <div class="pl-12">- uses: oven-sh/setup-bun&#64;v2</div>
                <div class="pl-12">- run: bun install</div>
                <div class="pl-12">- run: npm run lint</div>
                <div class="pl-12">- run: npm run test:unit</div>
                <div class="pl-12">- run: npm run test:e2e</div>
                <div class="mt-2 pl-4 text-white">build-artifacts:</div>
                <div class="pl-8">needs: lint-and-test</div>
                <div class="pl-8">runs-on: ubuntu-latest</div>
                <div class="pl-8">steps:</div>
                <div class="pl-12">- run: npm run build</div>
                <div class="pl-12">- run: cd go &amp;&amp; go build -o ../bin/gateway-server ./cmd/server/main.go</div>
                <div class="mt-2 pl-4 text-white">deploy-staging:</div>
                <div class="pl-8">needs: build-artifacts</div>
                <div class="pl-8">if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'</div>
                <div class="pl-8">environment: name: staging, url: https://staging.verdigris-webos.internal</div>
                <div class="pl-8">steps:</div>
                <div class="pl-12">- run: docker compose -f docker-compose.staging.yml up -d --build</div>
                <div class="pl-12">- run: curl -f http://localhost:3080/api/cicd/staging-health</div>
              </div>
            </div>
          }

          <!-- TAB 4: TEST SUITE ANALYTICS -->
          @case ('tests') {
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Vitest Unit Test Suite</span>
                    <mat-icon class="text-[#3EB991] text-base">verified</mat-icon>
                  </div>
                  <div class="text-2xl font-bold font-['Comfortaa'] text-[#3EB991]">17 / 17 Passed</div>
                  <p class="text-[11px] text-[#8C94A8]">Window manager, app launcher, CI/CD pipeline, audit & WOPI specs.</p>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Bun E2E Workflow Specs</span>
                    <mat-icon class="text-[#20B2AA] text-base">fact_check</mat-icon>
                  </div>
                  <div class="text-2xl font-bold font-['Comfortaa'] text-[#20B2AA]">7 / 7 Suites Passed</div>
                  <p class="text-[11px] text-[#8C94A8]">AgentFS, AI Copilot, Appwrite DB & RBAC workflow specs.</p>
                </div>

                <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Angular & ESLint Architecture</span>
                    <mat-icon class="text-[#FF2A9D] text-base">spellcheck</mat-icon>
                  </div>
                  <div class="text-2xl font-bold font-['Comfortaa'] text-[#FF2A9D]">0 Linter Warnings</div>
                  <p class="text-[11px] text-[#8C94A8]">100% strict type safety & zoneless signal compliance.</p>
                </div>
              </div>

              <!-- Test Files Breakdown -->
              <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                <h4 class="font-['Comfortaa'] text-sm font-bold text-white">Unit & E2E Test Suite Manifest</h4>

                <div class="space-y-2 text-xs font-mono">
                  <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-white">tests/unit/cicd-pipeline.service.test.ts</span>
                      <div class="text-[10px] text-[#8C94A8]">CI/CD automated pipeline triggers, step execution & staging rollback</div>
                    </div>
                    <span class="text-[#3EB991]">3 passed (8ms)</span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-white">tests/unit/window-manager.service.test.ts</span>
                      <div class="text-[10px] text-[#8C94A8]">Window bounds, process lifecycle, haptics & gestures</div>
                    </div>
                    <span class="text-[#3EB991]">5 passed (5ms)</span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-white">tests/unit/app-launcher.component.test.ts</span>
                      <div class="text-[10px] text-[#8C94A8]">Application filtering, category sorting & dynamic remote apps</div>
                    </div>
                    <span class="text-[#3EB991]">8 passed (656ms)</span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-white">tests/e2e/agentfs-workflow.e2e.test.ts</span>
                      <div class="text-[10px] text-[#8C94A8]">VFS Inode operations, SQLite integration & file editing</div>
                    </div>
                    <span class="text-[#20B2AA]">Passed (1.2s)</span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-[#0E1015] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-white">tests/e2e/audit-rbac-notification.e2e.test.ts</span>
                      <div class="text-[10px] text-[#8C94A8]">Immutable audit logging, multi-role RBAC enforcement & notifications</div>
                    </div>
                    <span class="text-[#20B2AA]">Passed (1.4s)</span>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>

    </div>
  `
})
export class CicdPipelineComponent {
  @Input() pid?: string;

  protected readonly cicdService = inject(CicdPipelineService);
  public readonly activeTab = signal<'runs' | 'staging' | 'workflow' | 'tests'>('runs');
  public readonly selectedStepName = signal<string>('test_unit');

  public formatTime(ts: number): string {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  public triggerNewRun(): void {
    const branches = ['main', 'develop', 'feature/cicd-pipeline'];
    const randomBranch = branches[Math.floor(Math.random() * branches.length)];
    this.cicdService.triggerPipelineRun(randomBranch, `commit: automated build & test run on ${randomBranch}`);
    this.activeTab.set('runs');
  }
}
