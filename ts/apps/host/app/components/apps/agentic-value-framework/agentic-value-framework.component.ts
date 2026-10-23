import { Component, ChangeDetectionStrategy, inject, signal, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AvfService } from '../../../services/avf.service';
import { TablerIconComponent } from '../../common/tabler-icon.component';
import { AvfDomain } from '../../../models/avf.models';

@Component({
  selector: 'app-agentic-value-framework',
  standalone: true,
  imports: [DecimalPipe, TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full space-y-4 font-body text-on-surface select-text">
      <!-- Executive Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-linear-to-tr from-tertiary to-secondary flex items-center justify-center text-surface-lowest shadow-lg shadow-tertiary/20">
              <app-tabler-icon name="network" size="20" class="text-surface-lowest" />
            </div>
            <h2 class="font-display text-xl font-bold tracking-tight text-on-surface">
              The Agentic Value Framework <span class="text-tertiary font-mono text-sm">(AVF)</span>
            </h2>
          </div>
          <p class="text-xs text-on-surface-variant mt-1 font-light">
            A New Calculus for Revenue & Valuation in the Age of the Autonomous Enterprise.
          </p>
        </div>

        <!-- Executive Telemetry Strip -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
          <div class="px-3 py-1.5 rounded-xl bg-surface-low border border-tertiary/30 text-tertiary flex items-center space-x-1.5 font-mono shadow-xs">
            <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span>Yr 5 Rev: &#36;{{ avf.fiveYearProjection()[4].projectedRevenue | number }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-surface-low border border-secondary/30 text-secondary flex items-center space-x-1.5 font-mono shadow-xs">
            <app-tabler-icon name="network" size="14" class="text-secondary" />
            <span>ROIC: {{ avf.roicMetrics().currentRoic }}x</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary-muted/30 text-primary-muted flex items-center space-x-1.5 font-mono shadow-xs">
            <app-tabler-icon name="clock" size="14" class="text-primary-muted" />
            <span>Flywheel: {{ avf.roicMetrics().flywheelRpm }} RPM</span>
          </div>
        </div>
      </header>

      <!-- Navigation Tabs (Crystalline Canon Tabler Glyphs) -->
      <nav aria-label="AVF Module Navigation" class="flex items-center flex-wrap gap-1.5 bg-surface-deep/90 border border-white/10 rounded-xl p-1.5">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'calc'"
          [class.text-surface-lowest]="activeTab() === 'calc'"
          [class.font-bold]="activeTab() === 'calc'"
          [class.shadow-md]="activeTab() === 'calc'"
          [class.text-on-surface-variant]="activeTab() !== 'calc'"
          [class.hover:text-on-surface]="activeTab() !== 'calc'"
          (click)="activeTab.set('calc')">
          <app-tabler-icon name="apps" size="14" />
          <span>Revenue Calculus</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'flywheel'"
          [class.text-surface-lowest]="activeTab() === 'flywheel'"
          [class.font-bold]="activeTab() === 'flywheel'"
          [class.shadow-md]="activeTab() === 'flywheel'"
          [class.text-on-surface-variant]="activeTab() !== 'flywheel'"
          [class.hover:text-on-surface]="activeTab() !== 'flywheel'"
          (click)="activeTab.set('flywheel')">
          <app-tabler-icon name="network" size="14" />
          <span>Compounding Flywheel</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'uav'"
          [class.text-surface-lowest]="activeTab() === 'uav'"
          [class.font-bold]="activeTab() === 'uav'"
          [class.shadow-md]="activeTab() === 'uav'"
          [class.text-on-surface-variant]="activeTab() !== 'uav'"
          [class.hover:text-on-surface]="activeTab() !== 'uav'"
          (click)="activeTab.set('uav')">
          <app-tabler-icon name="store" size="14" />
          <span>UAV Domain Matrix</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'governance'"
          [class.text-surface-lowest]="activeTab() === 'governance'"
          [class.font-bold]="activeTab() === 'governance'"
          [class.shadow-md]="activeTab() === 'governance'"
          [class.text-on-surface-variant]="activeTab() !== 'governance'"
          [class.hover:text-on-surface]="activeTab() !== 'governance'"
          (click)="activeTab.set('governance')">
          <app-tabler-icon name="shield" size="14" />
          <span>Agent Fleet Registry</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'benchmark'"
          [class.text-surface-lowest]="activeTab() === 'benchmark'"
          [class.font-bold]="activeTab() === 'benchmark'"
          [class.shadow-md]="activeTab() === 'benchmark'"
          [class.text-on-surface-variant]="activeTab() !== 'benchmark'"
          [class.hover:text-on-surface]="activeTab() !== 'benchmark'"
          (click)="activeTab.set('benchmark')">
          <app-tabler-icon name="terminal" size="14" />
          <span>Legacy vs. AVF</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none"
          [class.bg-tertiary]="activeTab() === 'roic'"
          [class.text-surface-lowest]="activeTab() === 'roic'"
          [class.font-bold]="activeTab() === 'roic'"
          [class.shadow-md]="activeTab() === 'roic'"
          [class.text-on-surface-variant]="activeTab() !== 'roic'"
          [class.hover:text-on-surface]="activeTab() !== 'roic'"
          (click)="activeTab.set('roic')">
          <app-tabler-icon name="hexagon" size="14" />
          <span>Intelligence Moat</span>
        </button>
      </nav>

      <!-- Main Stage -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-4">
        
        <!-- ========================================== -->
        <!-- TAB 1: REVENUE CALCULUS & 5-YEAR PROJECTIONS -->
        <!-- ========================================== -->
        @if (activeTab() === 'calc') {
          <div class="space-y-4">
            <!-- Formula Banner -->
            <div class="bg-linear-to-r from-surface-deep via-surface-high to-surface-deep border border-tertiary/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="space-y-1">
                <span class="text-[10px] font-mono uppercase tracking-widest text-tertiary">The Generalized AVF Calculus</span>
                <div class="font-display text-lg md:text-xl font-bold text-on-surface flex items-center space-x-2">
                  <span>Revenue</span>
                  <span class="text-tertiary">=</span>
                  <span class="text-secondary">V<sub class="text-xs">base</sub></span>
                  <span class="text-white/40">×</span>
                  <span class="text-magenta">N<sub class="text-xs">agents</sub></span>
                  <span class="text-white/40">×</span>
                  <span class="text-primary-muted">M<sub class="text-xs">c</sub></span>
                  <span class="text-white/40">×</span>
                  <span class="text-warning">F<sub class="text-xs">adopt</sub></span>
                </div>
                <p class="text-[11px] text-on-surface-variant">
                  Base economic value multiplied by autonomous fleet scale, compounding learning velocity, and network adoption.
                </p>
              </div>

              <!-- Presets -->
              <div class="flex items-center flex-wrap gap-1.5 self-start md:self-center">
                <span class="text-[11px] text-on-surface-variant mr-1">Presets:</span>
                <button (click)="avf.applyPreset('table3')" class="px-2.5 py-1 text-[11px] rounded-lg bg-surface-high hover:bg-tertiary hover:text-surface-lowest border border-white/10 transition-colors">Table 3 Baseline</button>
                <button (click)="avf.applyPreset('logistics')" class="px-2.5 py-1 text-[11px] rounded-lg bg-surface-high hover:bg-secondary hover:text-surface-lowest border border-white/10 transition-colors">Logistics Fleet</button>
                <button (click)="avf.applyPreset('fintech')" class="px-2.5 py-1 text-[11px] rounded-lg bg-surface-high hover:bg-primary-muted hover:text-surface-lowest border border-white/10 transition-colors">Fintech AML</button>
                <button (click)="avf.applyPreset('hyper_growth')" class="px-2.5 py-1 text-[11px] rounded-lg bg-surface-high hover:bg-magenta hover:text-white border border-white/10 transition-colors">Hyper-Growth</button>
              </div>
            </div>

            <!-- Interactive Parameters Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <!-- V_base -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="v-base-input" class="text-xs font-semibold text-secondary">Base Value (V_base)</label>
                  <span class="text-xs font-mono text-on-surface font-bold">&#36;{{ avf.params().baseValueUav }} USD</span>
                </div>
                <input 
                  id="v-base-input"
                  type="range" 
                  min="10" 
                  max="5000" 
                  step="10"
                  [value]="avf.params().baseValueUav"
                  (input)="avf.updateParams({ baseValueUav: +$any($event.target).value })"
                  class="w-full accent-secondary"
                  aria-label="Base Value V_base"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Non-compounded baseline worth of a single autonomous goal completion.</p>
              </div>

              <!-- N_agents -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="n-agents-input" class="text-xs font-semibold text-magenta">Active Agents (N_agents)</label>
                  <span class="text-xs font-mono text-on-surface font-bold">{{ avf.params().initialAgents }} units</span>
                </div>
                <input 
                  id="n-agents-input"
                  type="range" 
                  min="5" 
                  max="1000" 
                  step="5"
                  [value]="avf.params().initialAgents"
                  (input)="avf.updateParams({ initialAgents: +$any($event.target).value })"
                  class="w-full accent-magenta"
                  aria-label="Active Agents N_agents"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Total deployed value-generating agents in the operational fleet.</p>
              </div>

              <!-- Compounding Multiplier M_c -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="mc-input" class="text-xs font-semibold text-primary-muted">Compounding Multiplier (M_c)</label>
                  <span class="text-xs font-mono text-on-surface font-bold">{{ avf.params().compoundingMultiplier }}x</span>
                </div>
                <input 
                  id="mc-input"
                  type="range" 
                  min="1.01" 
                  max="1.50" 
                  step="0.01"
                  [value]="avf.params().compoundingMultiplier"
                  (input)="avf.updateParams({ compoundingMultiplier: +$any($event.target).value })"
                  class="w-full accent-primary-muted"
                  aria-label="Compounding Multiplier M_c"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Quantifies exponential value gain derived from data feedback loops.</p>
              </div>

              <!-- Annual Growth Rate -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="growth-input" class="text-xs font-semibold text-tertiary">Annual Agent Growth</label>
                  <span class="text-xs font-mono text-on-surface font-bold">{{ avf.params().annualAgentGrowthPct }}% YoY</span>
                </div>
                <input 
                  id="growth-input"
                  type="range" 
                  min="10" 
                  max="200" 
                  step="5"
                  [value]="avf.params().annualAgentGrowthPct"
                  (input)="avf.updateParams({ annualAgentGrowthPct: +$any($event.target).value })"
                  class="w-full accent-tertiary"
                  aria-label="Annual Agent Growth"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Compound expansion of autonomous digital labor pool.</p>
              </div>

              <!-- Adoption Factor F_adopt -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="adopt-input" class="text-xs font-semibold text-warning">Initial Adoption (F_adopt)</label>
                  <span class="text-xs font-mono text-on-surface font-bold">{{ avf.params().initialAdoptionFactor }}</span>
                </div>
                <input 
                  id="adopt-input"
                  type="range" 
                  min="0.01" 
                  max="0.50" 
                  step="0.01"
                  [value]="avf.params().initialAdoptionFactor"
                  (input)="avf.updateParams({ initialAdoptionFactor: +$any($event.target).value })"
                  class="w-full accent-warning"
                  aria-label="Initial Adoption Factor F_adopt"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Network penetration and multi-agent interaction density.</p>
              </div>

              <!-- Years to Full Adoption -->
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label for="years-input" class="text-xs font-semibold text-white/80">Maturity Horizon</label>
                  <span class="text-xs font-mono text-on-surface font-bold">{{ avf.params().yearsToFullAdoption }} Years</span>
                </div>
                <input 
                  id="years-input"
                  type="range" 
                  min="2" 
                  max="10" 
                  step="1"
                  [value]="avf.params().yearsToFullAdoption"
                  (input)="avf.updateParams({ yearsToFullAdoption: +$any($event.target).value })"
                  class="w-full accent-white"
                  aria-label="Years to Full Adoption"
                />
                <p class="text-[10px] text-on-surface-variant font-light">Duration until enterprise network effects reach saturated density.</p>
              </div>
            </div>

            <!-- Table 3: 5-Year Dynamic Projection Schedule -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div class="p-3 bg-surface-chrome border-b border-white/10 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <app-tabler-icon name="apps" size="16" class="text-tertiary" />
                  <h3 class="font-display text-sm font-bold text-on-surface">Table 3: Multi-Year Revenue Trajectory (AVF Baseline)</h3>
                </div>
                
                <div class="flex items-center space-x-2 text-xs">
                  <button (click)="copyReport()" class="px-2.5 py-1 rounded bg-surface-high hover:bg-white/10 text-on-surface border border-white/10 flex items-center space-x-1 transition-colors">
                    <app-tabler-icon name="terminal" size="12" />
                    <span>{{ copyStatus() }}</span>
                  </button>
                  <button (click)="downloadJson()" class="px-2.5 py-1 rounded bg-surface-high hover:bg-white/10 text-tertiary border border-tertiary/30 flex items-center space-x-1 transition-colors">
                    <span>JSON</span>
                  </button>
                  <button (click)="downloadCsv()" class="px-2.5 py-1 rounded bg-surface-high hover:bg-white/10 text-secondary border border-secondary/30 flex items-center space-x-1 transition-colors">
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-surface-lowest text-on-surface-variant font-mono uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th class="py-2.5 px-3">Horizon</th>
                      <th class="py-2.5 px-3">Fleet (N)</th>
                      <th class="py-2.5 px-3">Compounding (M_c)</th>
                      <th class="py-2.5 px-3">Adoption (F)</th>
                      <th class="py-2.5 px-3 text-right">Linear Scale</th>
                      <th class="py-2.5 px-3 text-right text-tertiary">AVF Revenue</th>
                      <th class="py-2.5 px-3 text-right text-primary-muted">Intelligence Premium</th>
                      <th class="py-2.5 px-4">Strategic Narrative</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    @for (row of avf.fiveYearProjection(); track row.year) {
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-3 px-3 font-bold text-on-surface">Year {{ row.year }}</td>
                        <td class="py-3 px-3">{{ row.agentCount | number }} units</td>
                        <td class="py-3 px-3 text-primary-muted">{{ row.compoundingMultiplier }}x</td>
                        <td class="py-3 px-3 text-warning">{{ row.adoptionFactor }}</td>
                        <td class="py-3 px-3 text-right text-white/50">&#36;{{ row.linearRevenue | number }}</td>
                        <td class="py-3 px-3 text-right text-tertiary font-bold">&#36;{{ row.projectedRevenue | number }}</td>
                        <td class="py-3 px-3 text-right text-primary-muted font-semibold">+&#36;{{ row.intelligencePremium | number }}</td>
                        <td class="py-3 px-4 font-sans text-[11px] text-on-surface-variant max-w-xs">{{ row.commentary }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Visual Compounding Inflection Comparison -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 class="font-display text-xs font-bold text-on-surface flex items-center justify-between">
                <span>Exponential Inflection: Linear Work vs. AVF Compounded Intelligence</span>
                <span class="text-[10px] font-mono text-tertiary font-normal">Green = Intelligence Premium (Appreciating Asset)</span>
              </h3>
              
              <div class="space-y-2">
                @for (row of avf.fiveYearProjection(); track row.year) {
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[11px] font-mono">
                      <span>Year {{ row.year }}</span>
                      <span class="text-tertiary font-bold">&#36;{{ row.projectedRevenue | number }} USD</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                      <!-- Linear baseline bar -->
                      <div 
                        class="h-full bg-white/20 transition-all duration-500" 
                        [style.width.%]="(row.linearRevenue / avf.fiveYearProjection()[4].projectedRevenue) * 100">
                      </div>
                      <!-- Intelligence Premium bar (green) -->
                      <div 
                        class="h-full bg-linear-to-r from-tertiary to-secondary transition-all duration-500" 
                        [style.width.%]="(row.intelligencePremium / avf.fiveYearProjection()[4].projectedRevenue) * 100">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Table 2 Reference Scenarios Toggle -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <button 
                (click)="showTable2.set(!showTable2())" 
                class="w-full flex items-center justify-between font-display text-xs font-bold text-on-surface focus:outline-none">
                <span class="flex items-center space-x-2">
                  <app-tabler-icon name="network" size="14" class="text-secondary" />
                  <span>Inspect Blueprint Table 2 Scenarios (Low / Med / High Sensitivity)</span>
                </span>
                <span class="text-[10px] text-secondary font-mono">{{ showTable2() ? 'Hide Scenarios ▲' : 'Expand Scenarios ▼' }}</span>
              </button>

              @if (showTable2()) {
                <div class="overflow-x-auto pt-2">
                  <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-surface-lowest text-on-surface-variant text-[10px] uppercase">
                      <tr>
                        <th class="py-2 px-3">Horizon</th>
                        <th class="py-2 px-3">Scenario</th>
                        <th class="py-2 px-3">V_base</th>
                        <th class="py-2 px-3">N_agents</th>
                        <th class="py-2 px-3">M_c</th>
                        <th class="py-2 px-3">F_adopt</th>
                        <th class="py-2 px-3 text-right">Projected Revenue</th>
                        <th class="py-2 px-3 font-sans">Commentary</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                      @for (s of avf.table2Scenarios(); track s.year + s.scenario) {
                        <tr class="hover:bg-white/5">
                          <td class="py-2 px-3 font-bold">Year {{ s.year }}</td>
                          <td class="py-2 px-3 font-semibold" [class.text-tertiary]="s.scenario === 'High'" [class.text-secondary]="s.scenario === 'Medium'" [class.text-white/60]="s.scenario === 'Low'">{{ s.scenario }}</td>
                          <td class="py-2 px-3">&#36;{{ s.vBase }}</td>
                          <td class="py-2 px-3">{{ s.nAgents | number }}</td>
                          <td class="py-2 px-3">{{ s.mc }}x</td>
                          <td class="py-2 px-3">{{ s.fAdopt }}</td>
                          <td class="py-2 px-3 text-right font-bold text-tertiary">&#36;{{ s.projectedRevenue | number }}</td>
                          <td class="py-2 px-3 font-sans text-[10px] text-on-surface-variant">{{ s.commentary }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 2: COMPOUNDING FLYWHEEL & EXPERIMENTATION -->
        <!-- ========================================== -->
        @if (activeTab() === 'flywheel') {
          <div class="space-y-4">
            <!-- 4-Stage Flywheel Engine Visualizer -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-display text-base font-bold text-on-surface flex items-center space-x-2">
                    <app-tabler-icon name="network" size="18" class="text-tertiary" />
                    <span>The Autonomous Intelligence Flywheel</span>
                  </h3>
                  <p class="text-xs text-on-surface-variant font-light mt-0.5">
                    Self-reinforcing feedback architecture: Each completed UAV generates proprietary training data, tightening learning latency.
                  </p>
                </div>

                <button 
                  (click)="avf.simulateMicroExperiment()" 
                  class="px-3.5 py-2 rounded-xl bg-linear-to-r from-tertiary to-secondary hover:from-tertiary hover:to-secondary text-surface-lowest font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-tertiary/20 cursor-pointer active:scale-95 transition-all">
                  <app-tabler-icon name="clock" size="14" class="text-surface-lowest" />
                  <span>Execute Micro-Experiment Cycle</span>
                </button>
              </div>

              <!-- 4 Stages Grid -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <!-- Stage 1 -->
                <div class="bg-surface-chrome border border-secondary/30 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                  <div class="w-6 h-6 rounded-lg bg-secondary/20 text-secondary font-mono text-xs flex items-center justify-center font-bold">1</div>
                  <h4 class="font-semibold text-xs text-secondary">Capture Proprietary Data</h4>
                  <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Autonomous agents automate live processes, streaming operational trace logs and invariant validations.
                  </p>
                  <span class="text-[10px] font-mono text-white/50 block pt-1 border-t border-white/5">Input: Millions of real-time machine telemetry vectors</span>
                </div>

                <!-- Stage 2 -->
                <div class="bg-surface-chrome border border-tertiary/30 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                  <div class="w-6 h-6 rounded-lg bg-tertiary/20 text-tertiary font-mono text-xs flex items-center justify-center font-bold">2</div>
                  <h4 class="font-semibold text-xs text-tertiary">Accelerate Learning Loop</h4>
                  <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Thousands of simultaneous autonomous micro-experiments compress months of human testing into hours.
                  </p>
                  <span class="text-[10px] font-mono text-emerald-400 block pt-1 border-t border-white/5">Rate: {{ avf.roicMetrics().experimentVelocityPerHour }} tests/hr</span>
                </div>

                <!-- Stage 3 -->
                <div class="bg-surface-chrome border border-primary-muted/30 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                  <div class="w-6 h-6 rounded-lg bg-primary-muted/20 text-primary-muted font-mono text-xs flex items-center justify-center font-bold">3</div>
                  <h4 class="font-semibold text-xs text-primary-muted">Deliver Superior Value</h4>
                  <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Compounded intelligence creates hyper-personalized outcomes, near-zero error rates, and lower unit friction.
                  </p>
                  <span class="text-[10px] font-mono text-primary-muted block pt-1 border-t border-white/5">Output: Verified UAV completion</span>
                </div>

                <!-- Stage 4 -->
                <div class="bg-surface-chrome border border-magenta/30 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                  <div class="w-6 h-6 rounded-lg bg-magenta/20 text-magenta font-mono text-xs flex items-center justify-center font-bold">4</div>
                  <h4 class="font-semibold text-xs text-magenta">Attract More Density</h4>
                  <p class="text-[11px] text-on-surface-variant leading-relaxed">
                    Superior outcomes attract multi-enterprise network participants, generating richer cross-agent datasets.
                  </p>
                  <span class="text-[10px] font-mono text-magenta-glow block pt-1 border-t border-white/5">Momentum: {{ avf.roicMetrics().flywheelRpm }} RPM</span>
                </div>
              </div>
            </div>

            <!-- Interactive Personalization & Multi-Agent Network Dynamics -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 class="font-display text-xs font-bold text-on-surface flex items-center space-x-2">
                  <app-tabler-icon name="network" size="14" class="text-tertiary" />
                  <span>Dynamic Personalization at Scale</span>
                </h4>
                <p class="text-xs text-on-surface-variant leading-relaxed">
                  Unlike static rules, an autonomous agent senses customer nuance instantly. The feedback from each engagement is immediately back-propagated into the model weights, making the next interaction statistically more accurate.
                </p>
                <div class="p-3 rounded-xl bg-surface-chrome border border-white/5 space-y-2 font-mono text-xs">
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Feedback Loop Latency:</span>
                    <span class="text-emerald-400">12.4 minutes (vs 90 days human review)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Model Invariance Score:</span>
                    <span class="text-secondary">99.82% certified</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Zero-Shot Adaptation Rate:</span>
                    <span class="text-primary-muted">94.1% without human retuning</span>
                  </div>
                </div>
              </div>

              <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 class="font-display text-xs font-bold text-on-surface flex items-center space-x-2">
                  <app-tabler-icon name="store" size="14" class="text-secondary" />
                  <span>Non-Linear Multi-Agent Ecosystem Scaling</span>
                </h4>
                <p class="text-xs text-on-surface-variant leading-relaxed">
                  When logistics, manufacturer, and retailer agents join a unified mesh, collective system intelligence expands exponentially through Metcalfe-like multi-agent network density.
                </p>
                <div class="p-3 rounded-xl bg-surface-chrome border border-white/5 space-y-2 font-mono text-xs">
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Mesh Node Density (Agents):</span>
                    <span class="text-on-surface">{{ avf.agentRegistry().length * 140 }} active nodes</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Synergy Coefficient:</span>
                    <span class="text-emerald-400">3.4x over isolated siloed agents</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-on-surface-variant">Marginal Deployment Cost:</span>
                    <span class="text-secondary">&#36;0.00012 per autonomous cycle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 3: UNIT OF AGENTIC VALUE (UAV) MATRIX  -->
        <!-- ========================================== -->
        @if (activeTab() === 'uav') {
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-deep/90 border border-white/10 rounded-2xl p-4">
              <div>
                <h3 class="font-display text-sm font-bold text-on-surface flex items-center space-x-2">
                  <app-tabler-icon name="store" size="16" class="text-secondary" />
                  <span>The Unit of Agentic Value (UAV) Registry</span>
                </h3>
                <p class="text-xs text-on-surface-variant mt-0.5 font-light">
                  The foundational quantum of economic output: discrete, verifiable, goal-oriented outcomes completed autonomously.
                </p>
              </div>

              <div class="flex items-center space-x-3 text-xs font-mono">
                <div class="px-3 py-1.5 rounded-xl bg-surface-chrome border border-tertiary/30 text-tertiary">
                  Total Value: &#36;{{ avf.totalValueCreated() | number }}
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-surface-chrome border border-secondary/30 text-secondary">
                  Human Savings: &#36;{{ avf.totalHumanSavings() | number }}
                </div>
              </div>
            </div>

            <!-- UAV Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (uav of avf.uavDefinitions(); track uav.id) {
                <div class="bg-surface-deep/90 border border-white/10 hover:border-tertiary/40 rounded-xl p-3.5 space-y-3 transition-all flex flex-col justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider"
                        [class.bg-tertiary/15]="uav.domain === 'logistics'"
                        [class.text-tertiary]="uav.domain === 'logistics'"
                        [class.bg-secondary/15]="uav.domain === 'customer_support'"
                        [class.text-secondary]="uav.domain === 'customer_support'"
                        [class.bg-primary-muted/15]="uav.domain === 'compliance'"
                        [class.text-primary-muted]="uav.domain === 'compliance'"
                        [class.bg-magenta/15]="uav.domain === 'marketing' || uav.domain === 'healthcare'"
                        [class.text-magenta-glow]="uav.domain === 'marketing' || uav.domain === 'healthcare'">
                        {{ uav.domain.replace('_', ' ') }}
                      </span>
                      <span class="text-xs font-mono text-tertiary font-bold">&#36;{{ uav.baseValue }} V_base</span>
                    </div>

                    <h4 class="font-display text-xs font-bold text-on-surface leading-snug">{{ uav.name }}</h4>
                    <p class="text-[11px] text-on-surface-variant line-clamp-2 font-light leading-relaxed">{{ uav.description }}</p>
                  </div>

                  <div class="pt-2 border-t border-white/5 space-y-1.5 text-[10px] font-mono text-on-surface-variant">
                    <div class="flex justify-between">
                      <span>Verification Invariant:</span>
                      <span class="text-secondary truncate max-w-[130px]">{{ uav.verificationProof }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Verified Completions:</span>
                      <span class="text-white font-bold">{{ uav.completedCount | number }} units</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Human Equivalent Cost:</span>
                      <span class="text-white/60 line-through">&#36;{{ uav.humanAlternativeCost }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Form: Define Custom UAV -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <h4 class="font-display text-xs font-bold text-on-surface flex items-center space-x-2">
                <app-tabler-icon name="apps" size="14" class="text-tertiary" />
                <span>Forge New Unit of Agentic Value (UAV) Definition</span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label for="uav-name" class="text-[10px] text-on-surface-variant uppercase block mb-1">Goal Name</label>
                  <input 
                    id="uav-name"
                    [value]="newUavName()" (input)="newUavName.set($any($event.target).value)" 
                    placeholder="e.g. Autonomous Invoice Reconciliation" 
                    class="w-full bg-surface-chrome border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-tertiary outline-none"
                  />
                </div>
                <div>
                  <label for="uav-domain" class="text-[10px] text-on-surface-variant uppercase block mb-1">Domain</label>
                  <select 
                    id="uav-domain"
                    [value]="newUavDomain()" (change)="newUavDomain.set($any($event.target).value)" 
                    class="w-full bg-surface-chrome border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-tertiary outline-none">
                    <option value="logistics">Logistics</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="marketing">Marketing</option>
                    <option value="compliance">Compliance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="supply_chain">Supply Chain</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label for="uav-value" class="text-[10px] text-on-surface-variant uppercase block mb-1">Base Value (V_base USD)</label>
                  <input 
                    id="uav-value"
                    type="number" 
                    [value]="newUavValue()" (input)="newUavValue.set(+$any($event.target).value)" 
                    placeholder="250" 
                    class="w-full bg-surface-chrome border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-tertiary outline-none"
                  />
                </div>
                <div>
                  <label for="uav-proof" class="text-[10px] text-on-surface-variant uppercase block mb-1">Verification Proof</label>
                  <input 
                    id="uav-proof"
                    [value]="newUavProof()" (input)="newUavProof.set($any($event.target).value)" 
                    placeholder="e.g. ERP Ledger Hash Consensus" 
                    class="w-full bg-surface-chrome border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-tertiary outline-none"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button 
                  (click)="handleCreateUav()" 
                  class="px-3.5 py-1.5 rounded-lg bg-tertiary hover:bg-tertiary text-surface-lowest font-semibold text-xs transition-colors flex items-center space-x-1">
                  <span>Register UAV Protocol</span>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 4: AGENT REGISTRY & ANTI-SPRAWL        -->
        <!-- ========================================== -->
        @if (activeTab() === 'governance') {
          <div class="space-y-4">
            <!-- Section 6 Mitigation Banner -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 class="font-display text-sm font-bold text-on-surface flex items-center space-x-2">
                  <app-tabler-icon name="shield" size="16" class="text-primary-muted" />
                  <span>Centralized Fleet Registry & Anti-Sprawl Governance</span>
                </h3>
                <p class="text-xs text-on-surface-variant font-light mt-0.5">
                  Mitigating Section 6 "Unmanaged Agentic Sprawl": Immutable inventory, active boundaries, alignment checks, and emergency kill switches.
                </p>
              </div>

              <div class="flex items-center space-x-2 text-xs font-mono">
                <div class="px-3 py-1.5 rounded-xl bg-surface-chrome border border-white/10 text-white">
                  Active: {{ avf.fleetHealth().active }} / {{ avf.fleetHealth().total }}
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-surface-chrome border border-tertiary/30 text-tertiary">
                  Alignment: {{ avf.fleetHealth().avgAlignment }}%
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-surface-chrome border border-error/30 text-error">
                  Bias Risk: {{ avf.fleetHealth().avgBiasRisk }}%
                </div>
              </div>
            </div>

            <!-- Agent Registry Table -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs font-mono">
                  <thead class="bg-surface-lowest text-on-surface-variant text-[10px] uppercase border-b border-white/5">
                    <tr>
                      <th class="py-2.5 px-3">Agent ID & Name</th>
                      <th class="py-2.5 px-3">Role & Domain</th>
                      <th class="py-2.5 px-3">Autonomy Tier</th>
                      <th class="py-2.5 px-3">Status</th>
                      <th class="py-2.5 px-3">Learning Rate</th>
                      <th class="py-2.5 px-3">Alignment</th>
                      <th class="py-2.5 px-3 text-right">Emergency Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    @for (agent of avf.agentRegistry(); track agent.id) {
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-3 px-3">
                          <div class="font-bold text-on-surface font-sans">{{ agent.name }}</div>
                          <div class="text-[10px] text-on-surface-variant">{{ agent.id }}</div>
                        </td>
                        <td class="py-3 px-3">
                          <div class="text-white">{{ agent.role }}</div>
                          <div class="text-[10px] text-secondary uppercase">{{ agent.domain }}</div>
                        </td>
                        <td class="py-3 px-3">
                          <span class="text-[10px] px-2 py-0.5 rounded-full border"
                            [class.border-emerald-500/40]="agent.autonomy === 'fully_autonomous'"
                            [class.text-emerald-400]="agent.autonomy === 'fully_autonomous'"
                            [class.border-secondary/40]="agent.autonomy === 'semi_autonomous'"
                            [class.text-secondary]="agent.autonomy === 'semi_autonomous'"
                            [class.border-amber-500/40]="agent.autonomy === 'supervised'"
                            [class.text-amber-400]="agent.autonomy === 'supervised'">
                            {{ agent.autonomy.replace('_', ' ') }}
                          </span>
                        </td>
                        <td class="py-3 px-3">
                          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            [class.bg-emerald-500/20]="agent.status === 'active' && !agent.killSwitchEngaged"
                            [class.text-emerald-400]="agent.status === 'active' && !agent.killSwitchEngaged"
                            [class.bg-error/20]="agent.killSwitchEngaged || agent.status === 'locked'"
                            [class.text-error]="agent.killSwitchEngaged || agent.status === 'locked'">
                            {{ agent.killSwitchEngaged ? 'KILLSWITCH ENGAGED' : agent.status.toUpperCase() }}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-primary-muted">{{ agent.learningVelocity }} exp/hr</td>
                        <td class="py-3 px-3 text-tertiary">{{ agent.alignmentScorePct }}%</td>
                        <td class="py-3 px-3 text-right">
                          <button 
                            (click)="avf.toggleAgentKillSwitch(agent.id)" 
                            class="px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer"
                            [class.bg-error/15]="!agent.killSwitchEngaged"
                            [class.text-error]="!agent.killSwitchEngaged"
                            [class.border-error/40]="!agent.killSwitchEngaged"
                            [class.hover:bg-error/30]="!agent.killSwitchEngaged"
                            [class.bg-emerald-500/20]="agent.killSwitchEngaged"
                            [class.text-emerald-400]="agent.killSwitchEngaged"
                            [class.border-emerald-500/40]="agent.killSwitchEngaged">
                            {{ agent.killSwitchEngaged ? 'Unlock Agent' : 'Kill-Switch' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 5: LEGACY BENCHMARK COMPARISON         -->
        <!-- ========================================== -->
        @if (activeTab() === 'benchmark') {
          <div class="space-y-4">
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 shadow-xl">
              <h3 class="font-display text-sm font-bold text-on-surface flex items-center space-x-2">
                <app-tabler-icon name="terminal" size="16" class="text-tertiary" />
                <span>Table 1: Critical Analysis of Legacy Frameworks vs. The AVF</span>
              </h3>
              <p class="text-xs text-on-surface-variant font-light mt-0.5">
                Applying SaaS or transactional metrics to autonomous agents is a category error. Software depreciates; agentic intelligence compounds.
              </p>
            </div>

            <!-- Table 1 Matrix -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-surface-lowest text-on-surface-variant font-mono uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th class="py-2.5 px-3">Revenue Model</th>
                      <th class="py-2.5 px-3">Core Concept</th>
                      <th class="py-2.5 px-3">Key Metrics</th>
                      <th class="py-2.5 px-3">Scalability Model</th>
                      <th class="py-2.5 px-3">Agentic Fitness</th>
                      <th class="py-2.5 px-4">Critical Category Flaw</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    @for (m of avf.legacyComparisons; track m.id) {
                      <tr class="hover:bg-white/5 transition-colors" [class.bg-tertiary/5]="m.fitnessForAgentic === 'High'">
                        <td class="py-3 px-3 font-bold font-sans" [class.text-tertiary]="m.fitnessForAgentic === 'High'" [class.text-on-surface]="m.fitnessForAgentic !== 'High'">
                          {{ m.model }}
                        </td>
                        <td class="py-3 px-3 text-on-surface-variant font-light">{{ m.coreConcept }}</td>
                        <td class="py-3 px-3 font-mono text-[11px] text-secondary">
                          {{ m.keyMetrics.join(' • ') }}
                        </td>
                        <td class="py-3 px-3 font-mono text-[11px] text-on-surface-variant">{{ m.scalabilityModel }}</td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                            [class.bg-emerald-500/20]="m.fitnessForAgentic === 'High'"
                            [class.text-emerald-400]="m.fitnessForAgentic === 'High'"
                            [class.bg-amber-500/20]="m.fitnessForAgentic === 'Low'"
                            [class.text-amber-400]="m.fitnessForAgentic === 'Low'"
                            [class.bg-red-500/20]="m.fitnessForAgentic === 'Incompatible'"
                            [class.text-red-400]="m.fitnessForAgentic === 'Incompatible'">
                            {{ m.fitnessForAgentic }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-[11px] font-light leading-relaxed" [class.text-emerald-300]="m.fitnessForAgentic === 'High'" [class.text-error-soft]="m.fitnessForAgentic !== 'High'">
                          {{ m.criticalFlaw }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Deep Dive on 3 Core Blind Spots -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3.5 space-y-1.5">
                <h4 class="font-display text-xs font-bold text-error-soft">1. Static Value Assumption</h4>
                <p class="text-[11px] text-on-surface-variant font-light leading-relaxed">
                  Legacy SaaS assumes utility is static across subscription terms. An autonomous agent that navigates a freight disruption becomes inherently more valuable with every disruption it encounters.
                </p>
              </div>

              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3.5 space-y-1.5">
                <h4 class="font-display text-xs font-bold text-error-soft">2. Inability to Model Compounding</h4>
                <p class="text-[11px] text-on-surface-variant font-light leading-relaxed">
                  Customer Lifetime Value (LTV) relies on historical linear churn rates. It cannot mathematically capture exponential returns generated by an agent's real-time micro-experimentation loops.
                </p>
              </div>

              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-3.5 space-y-1.5">
                <h4 class="font-display text-xs font-bold text-error-soft">3. Human-Centric Action Bias</h4>
                <p class="text-[11px] text-on-surface-variant font-light leading-relaxed">
                  Advertising and per-seat models measure clicks and user headcounts. They fail to monetize millions of background autonomous machine-to-machine interactions that produce high enterprise yield.
                </p>
              </div>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- TAB 6: ROIC & INTELLIGENCE MOAT            -->
        <!-- ========================================== -->
        @if (activeTab() === 'roic') {
          <div class="space-y-4">
            <div class="bg-linear-to-r from-surface-deep via-surface-high to-surface-deep border border-secondary/30 rounded-2xl p-5 shadow-xl space-y-3">
              <span class="text-[10px] font-mono uppercase tracking-widest text-secondary">Strategic Valuation Metric</span>
              <h3 class="font-display text-base font-bold text-on-surface flex items-center space-x-2">
                <span>Return on Intelligence Compounded (ROIC)</span>
                <span class="text-tertiary font-mono text-sm">={{ avf.roicMetrics().currentRoic }}x</span>
              </h3>
              <p class="text-xs text-on-surface-variant font-light leading-relaxed">
                ROIC measures the velocity of learning—the slope of the system's intelligence curve relative to capital invested in data pipelines and feedback mechanisms.
              </p>
            </div>

            <!-- ROIC Breakdown Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-4 space-y-1">
                <span class="text-[10px] text-on-surface-variant uppercase">Learning Infrastructure Spend</span>
                <div class="text-lg font-bold text-white">&#36;{{ avf.roicMetrics().infrastructureInvestment | number }}</div>
                <p class="font-sans text-[10px] text-on-surface-variant">Pipelines, telemetry, and feedback instrumentation</p>
              </div>

              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-4 space-y-1">
                <span class="text-[10px] text-on-surface-variant uppercase">Delivered Economic Value</span>
                <div class="text-lg font-bold text-tertiary">&#36;{{ avf.roicMetrics().accumulatedUavGain | number }}</div>
                <p class="font-sans text-[10px] text-on-surface-variant">Cumulative value generated by compounded autonomous cycles</p>
              </div>

              <div class="bg-surface-deep/90 border border-white/10 rounded-xl p-4 space-y-1">
                <span class="text-[10px] text-on-surface-variant uppercase">ROIC Yield Multiple</span>
                <div class="text-lg font-bold text-secondary">{{ avf.roicMetrics().currentRoic }}x Multiple</div>
                <p class="font-sans text-[10px] text-on-surface-variant">Net economic appreciation per dollar invested in learning</p>
              </div>
            </div>

            <!-- The Intelligence Moat Defensibility Analysis -->
            <div class="bg-surface-deep/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <h4 class="font-display text-xs font-bold text-on-surface flex items-center space-x-2">
                <app-tabler-icon name="shield" size="14" class="text-tertiary" />
                <span>The Uncopyable Defensibility Moat</span>
              </h4>
              <p class="text-xs text-on-surface-variant leading-relaxed font-light">
                Base LLM models are rapidly becoming commoditized. The true moat in the Agentic Era is not the underlying model weights, but the <strong class="text-white">cumulative, path-dependent intelligence compounded over millions of operational cycles</strong>. A competitor cannot replicate this moat with capital; they would be forced to re-live the enterprise's entire learning history, during which your flywheel has accelerated to even higher velocity.
              </p>
            </div>
          </div>
        }

      </div>

      <!-- Bottom Signature Stamp -->
      <footer class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
        <div>ΛΞV Inc • The Future Needs Context</div>
        <div class="text-tertiary">INNOVΛTΞ. ΛUTOMΛTΞ. DOMINΛTΞ.</div>
      </footer>
    </div>
  `
})
export class AgenticValueFrameworkComponent {
  readonly pid = input<string>();
  readonly avf = inject(AvfService);

  readonly activeTab = signal<'calc' | 'flywheel' | 'uav' | 'governance' | 'benchmark' | 'roic'>('calc');
  readonly showTable2 = signal<boolean>(false);
  readonly copyStatus = signal<string>('Copy Summary');

  // Form fields for new UAV
  newUavName = signal('');
  newUavDomain = signal<AvfDomain>('logistics');
  newUavValue = signal(250);
  newUavProof = signal('');

  handleCreateUav() {
    if (!this.newUavName().trim()) return;
    this.avf.addUavDefinition({
      name: this.newUavName(),
      domain: this.newUavDomain(),
      description: `Autonomously verified ${this.newUavName()} operations.`,
      baseValue: this.newUavValue() || 100,
      measurementUnit: 'Per Verified Autonomous Cycle',
      verificationProof: this.newUavProof() || 'Cryptographic Consensus Attestation',
      compoundingRate: 15.0,
      humanAlternativeCost: (this.newUavValue() || 100) * 2.5
    });
    this.newUavName.set('');
    this.newUavProof.set('');
  }

  downloadJson() {
    const json = this.avf.exportJsonReport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVF_Executive_Model_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadCsv() {
    const csv = this.avf.exportCsvReport();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVF_5Year_Projections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyReport() {
    const summary = `THE AGENTIC VALUE FRAMEWORK (AVF) EXECUTIVE SUMMARY
Generated: ${new Date().toLocaleDateString()}
Formula: Revenue = V_base * N_agents * M_c * F_adopt
Year 1 Projected Revenue: $${this.avf.fiveYearProjection()[0].projectedRevenue.toLocaleString()}
Year 5 Projected Revenue: $${this.avf.fiveYearProjection()[4].projectedRevenue.toLocaleString()}
Return on Intelligence Compounded (ROIC): ${this.avf.roicMetrics().currentRoic}x
Verified Economic Value Delivered: $${this.avf.totalValueCreated().toLocaleString()}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(() => {
        this.copyStatus.set('Copied!');
        setTimeout(() => this.copyStatus.set('Copy Summary'), 2000);
      });
    }
  }
}
