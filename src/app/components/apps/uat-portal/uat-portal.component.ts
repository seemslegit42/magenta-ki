import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UatBusinessArea, UatScenarioStatus } from '../../../models/cicd.models';
import { UatService } from '../../../services/uat.service';
import { TablerIconComponent } from '../../common/tabler-icon.component';

@Component({
  selector: 'app-uat-portal',
  imports: [CommonModule, ReactiveFormsModule, TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full gap-5 font-['Lexend'] text-[#F5FFFA] bg-[#0E1015] p-4 md:p-6 overflow-y-auto">
      <!-- Top Bar (Clean 3-Zone Header, Zero Technical Jargon) -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div class="space-y-1">
          <h1 class="font-['Comfortaa'] text-xl md:text-2xl font-bold text-[#F5FFFA] tracking-tight">
            Business Acceptance &amp; Release Sign-Off
          </h1>
          <p class="text-xs md:text-sm text-[#8C94A8]">
            {{ uatService.signOff().releaseLabel }} · Plain-language review for business owners before live launch
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            (click)="downloadReport()"
            class="px-4 py-2 rounded-lg bg-[#1A1C23] hover:bg-[#22252F] border border-white/15 text-xs font-medium text-[#F5FFFA] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <app-tabler-icon name="printer" size="16" class="text-[#20B2AA]" />
            <span>Download Summary Report</span>
          </button>

          @if (standaloneMode()) {
            <a
              href="/"
              class="px-4 py-2 rounded-lg bg-[#20B2AA]/15 hover:bg-[#20B2AA]/25 border border-[#20B2AA]/40 text-xs font-semibold text-[#F5FFFA] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <app-tabler-icon name="apps" size="16" class="text-[#20B2AA]" />
              <span>Return to Workspace</span>
            </a>
          } @else {
            <a
              href="/uat"
              class="px-4 py-2 rounded-lg bg-[#3EB991] hover:bg-[#52caa1] text-xs font-bold text-[#0E1015] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <app-tabler-icon name="clipboard-check" size="16" />
              <span>Open Distraction-Free Link</span>
            </a>
          }
        </div>
      </header>

      <!-- Release Readiness Summary Strip -->
      <section aria-label="Review Progress Summary" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
          <div class="text-xs text-[#8C94A8]">Overall Review Progress</div>
          <div class="font-['Comfortaa'] text-2xl font-bold text-[#F5FFFA] tabular-nums">
            {{ uatService.completionPercent() }}%
          </div>
          <div class="text-xs text-[#8C94A8] tabular-nums">
            {{ uatService.approvedCount() }} of {{ uatService.totalCount() }} approved
          </div>
        </div>

        <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
          <div class="text-xs text-[#8C94A8]">Waiting for Review</div>
          <div class="font-['Comfortaa'] text-2xl font-bold text-[#20B2AA] tabular-nums">
            {{ uatService.pendingCount() }}
          </div>
          <div class="text-xs text-[#8C94A8]">Scenarios remaining</div>
        </div>

        <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
          <div class="text-xs text-[#8C94A8]">Needs Changes or Blocked</div>
          <div class="font-['Comfortaa'] text-2xl font-bold text-[#FFB4AB] tabular-nums">
            {{ uatService.changesRequestedCount() + uatService.blockedCount() }}
          </div>
          <div class="text-xs text-[#8C94A8]">Items flagged for follow-up</div>
        </div>

        <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
          <div class="text-xs text-[#8C94A8]">Release Sign-Off Status</div>
          <div
            class="font-['Comfortaa'] text-lg font-bold capitalize"
            [class.text-[#3EB991]]="uatService.signOff().decision === 'approved'"
            [class.text-[#FFB4AB]]="uatService.signOff().decision === 'rejected'"
            [class.text-[#F5FFFA]]="uatService.signOff().decision === 'pending'"
          >
            {{ formatDecisionLabel(uatService.signOff().decision) }}
          </div>
          <div class="text-xs text-[#8C94A8] truncate">
            {{ uatService.signOff().signedBy ? 'Signed by ' + uatService.signOff().signedBy : 'Awaiting business owner sign-off' }}
          </div>
        </div>
      </section>

      <!-- Plain-Language Instructions & Filters -->
      <section aria-label="Filter Business Scenarios" class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#14161C] border border-white/10 rounded-xl p-3">
        <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by Business Area">
          @for (area of businessAreas; track area) {
            <button
              type="button"
              (click)="uatService.selectedArea.set(area)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#20B2AA]]="uatService.selectedArea() === area"
              [class.text-[#0E1015]]="uatService.selectedArea() === area"
              [class.font-bold]="uatService.selectedArea() === area"
              [class.bg-[#0E1015]]="uatService.selectedArea() !== area"
              [class.text-[#8C94A8]]="uatService.selectedArea() !== area"
              [class.hover:text-[#F5FFFA]]="uatService.selectedArea() !== area"
            >
              {{ area }}
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by Review Status">
          @for (filter of statusFilters; track filter.value) {
            <button
              type="button"
              (click)="uatService.selectedStatus.set(filter.value)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#3EB991]]="uatService.selectedStatus() === filter.value"
              [class.text-[#0E1015]]="uatService.selectedStatus() === filter.value"
              [class.font-bold]="uatService.selectedStatus() === filter.value"
              [class.bg-[#0E1015]]="uatService.selectedStatus() !== filter.value"
              [class.text-[#8C94A8]]="uatService.selectedStatus() !== filter.value"
              [class.hover:text-[#F5FFFA]]="uatService.selectedStatus() !== filter.value"
            >
              {{ filter.label }}
            </button>
          }
        </div>
      </section>

      <!-- Main Split: Scenario Checklist + Executive Sign-Off Form -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <!-- Business Scenarios List (8 cols) -->
        <section aria-label="Business Acceptance Scenarios" class="xl:col-span-8 space-y-4">
          @if (uatService.filteredScenarios().length === 0) {
            <div class="bg-[#14161C] border border-white/10 rounded-xl p-8 text-center space-y-2">
              <p class="font-['Comfortaa'] text-base font-semibold text-[#F5FFFA]">No scenarios match this filter</p>
              <p class="text-xs text-[#8C94A8]">Select "All Areas" and "All" to see every business check.</p>
              <button
                type="button"
                (click)="resetFilters()"
                class="mt-2 px-4 py-2 rounded-lg bg-[#20B2AA]/20 border border-[#20B2AA]/40 text-xs font-semibold text-[#F5FFFA] cursor-pointer"
              >
                Show All Scenarios
              </button>
            </div>
          } @else {
            @for (scenario of uatService.filteredScenarios(); track scenario.id) {
              <article class="bg-[#14161C] border border-white/10 rounded-xl p-5 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2 text-xs text-[#8C94A8]">
                      <span class="font-semibold text-[#20B2AA]">{{ scenario.businessArea }}</span>
                      <span aria-hidden="true">·</span>
                      <span class="tabular-nums">{{ scenario.id }}</span>
                    </div>
                    <h2 class="font-['Comfortaa'] text-base font-bold text-[#F5FFFA]">
                      {{ scenario.title }}
                    </h2>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs font-semibold shrink-0"
                    [class.text-[#3EB991]]="scenario.status === 'approved'"
                    [class.text-[#FBBF24]]="scenario.status === 'changes_requested'"
                    [class.text-[#FFB4AB]]="scenario.status === 'blocked'"
                    [class.text-[#8C94A8]]="scenario.status === 'pending'"
                  >
                    @switch (scenario.status) {
                      @case ('approved') {
                        <app-tabler-icon name="check" size="16" />
                        <span>Approved</span>
                      }
                      @case ('changes_requested') {
                        <app-tabler-icon name="alert-triangle" size="16" />
                        <span>Needs Changes</span>
                      }
                      @case ('blocked') {
                        <app-tabler-icon name="x" size="16" />
                        <span>Blocked</span>
                      }
                      @default {
                        <app-tabler-icon name="clock" size="16" />
                        <span>Waiting Review</span>
                      }
                    }
                  </div>
                </div>

                <p class="text-sm text-[#F5FFFA]/90 leading-relaxed">
                  {{ scenario.plainLanguageGoal }}
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div class="space-y-1.5">
                    <div class="font-semibold text-[#F5FFFA]">What to try</div>
                    <ol class="list-decimal list-inside space-y-1 text-[#8C94A8] leading-relaxed">
                      @for (step of scenario.stepsToVerify; track $index) {
                        <li>{{ step }}</li>
                      }
                    </ol>
                  </div>

                  <div class="space-y-1.5">
                    <div class="font-semibold text-[#F5FFFA]">Expected result</div>
                    <p class="text-[#8C94A8] leading-relaxed">{{ scenario.expectedOutcome }}</p>
                  </div>
                </div>

                <!-- Stakeholder Notes & Verdict Controls -->
                <div class="pt-3 border-t border-white/10 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <label [for]="'note-' + scenario.id" class="sr-only">Notes for {{ scenario.title }}</label>
                    <input
                      [id]="'note-' + scenario.id"
                      type="text"
                      [value]="getDraftNote(scenario.id, scenario.reviewerNote)"
                      (input)="setDraftNote(scenario.id, $any($event.target).value)"
                      placeholder="Optional plain-language note or feedback (e.g., button label was clear)"
                      class="flex-1 px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
                    />
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      (click)="recordVerdict(scenario.id, 'approved')"
                      class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      [class.bg-[#3EB991]]="scenario.status === 'approved'"
                      [class.text-[#0E1015]]="scenario.status === 'approved'"
                      [class.bg-[#0E1015]]="scenario.status !== 'approved'"
                      [class.text-[#3EB991]]="scenario.status !== 'approved'"
                      [class.border]="scenario.status !== 'approved'"
                      [class.border-[#3EB991]/40]="scenario.status !== 'approved'"
                    >
                      <app-tabler-icon name="check" size="15" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      (click)="recordVerdict(scenario.id, 'changes_requested')"
                      class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      [class.bg-[#FBBF24]]="scenario.status === 'changes_requested'"
                      [class.text-[#0E1015]]="scenario.status === 'changes_requested'"
                      [class.bg-[#0E1015]]="scenario.status !== 'changes_requested'"
                      [class.text-[#FBBF24]]="scenario.status !== 'changes_requested'"
                      [class.border]="scenario.status !== 'changes_requested'"
                      [class.border-[#FBBF24]/40]="scenario.status !== 'changes_requested'"
                    >
                      <app-tabler-icon name="alert-triangle" size="15" />
                      <span>Needs Changes</span>
                    </button>

                    <button
                      type="button"
                      (click)="recordVerdict(scenario.id, 'blocked')"
                      class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      [class.bg-[#FF4D6D]]="scenario.status === 'blocked'"
                      [class.text-[#0E1015]]="scenario.status === 'blocked'"
                      [class.bg-[#0E1015]]="scenario.status !== 'blocked'"
                      [class.text-[#FFB4AB]]="scenario.status !== 'blocked'"
                      [class.border]="scenario.status !== 'blocked'"
                      [class.border-[#FF4D6D]/40]="scenario.status !== 'blocked'"
                    >
                      <app-tabler-icon name="x" size="15" />
                      <span>Blocked</span>
                    </button>
                  </div>
                </div>
              </article>
            }
          }
        </section>

        <!-- Executive Release Sign-Off Panel (4 cols) -->
        <aside aria-label="Final Release Sign-Off" class="xl:col-span-4 bg-[#14161C] border border-white/10 rounded-xl p-5 space-y-4">
          <div class="space-y-1 pb-3 border-b border-white/10">
            <h2 class="font-['Comfortaa'] text-lg font-bold text-[#F5FFFA]">Final Release Sign-Off</h2>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              Once you have tested the areas above, record your official business decision for this release.
            </p>
          </div>

          <form [formGroup]="signOffForm" class="space-y-3.5">
            <div class="space-y-1.5">
              <label for="uat-signer-name" class="block text-xs font-medium text-[#F5FFFA]">
                Your Full Name
              </label>
              <input
                id="uat-signer-name"
                type="text"
                formControlName="signedBy"
                placeholder="e.g., Jordan Taylor"
                class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
              />
            </div>

            <div class="space-y-1.5">
              <label for="uat-signer-role" class="block text-xs font-medium text-[#F5FFFA]">
                Role or Department
              </label>
              <input
                id="uat-signer-role"
                type="text"
                formControlName="role"
                placeholder="e.g., Business Owner / Operations Lead"
                class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
              />
            </div>

            <div class="space-y-1.5">
              <label for="uat-summary-note" class="block text-xs font-medium text-[#F5FFFA]">
                Decision Notes (Optional)
              </label>
              <textarea
                id="uat-summary-note"
                rows="3"
                formControlName="summaryNote"
                placeholder="Share any launch conditions, praise, or items to revisit before release..."
                class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
              ></textarea>
            </div>

            @if (uatService.errorMessage()) {
              <div role="alert" class="p-3 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs text-[#FFB4AB]">
                {{ uatService.errorMessage() }}
              </div>
            }

            @if (feedbackBanner()) {
              <div class="p-3 rounded-lg bg-[#3EB991]/15 border border-[#3EB991]/40 text-xs text-[#3EB991]">
                {{ feedbackBanner() }}
              </div>
            }

            <div class="pt-1 flex flex-col gap-2.5">
              <button
                type="button"
                [disabled]="uatService.isSaving()"
                (click)="submitReleaseDecision('approved')"
                class="w-full px-4 py-2.5 rounded-lg bg-[#3EB991] hover:bg-[#52caa1] text-[#0E1015] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <app-tabler-icon name="rocket" size="16" />
                <span>Approve Release for Live Launch</span>
              </button>

              <button
                type="button"
                [disabled]="uatService.isSaving()"
                (click)="submitReleaseDecision('rejected')"
                class="w-full px-4 py-2.5 rounded-lg bg-[#1A1C23] hover:bg-[#22252F] border border-[#FF4D6D]/40 text-[#FFB4AB] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <app-tabler-icon name="alert-triangle" size="16" />
                <span>Hold Release for Fixes</span>
              </button>
            </div>
          </form>

          @if (uatService.signOff().signedAt) {
            <div class="pt-3 border-t border-white/10 text-xs text-[#8C94A8] space-y-1">
              <div class="font-semibold text-[#F5FFFA]">Recorded Decision</div>
              <div>
                {{ formatDecisionLabel(uatService.signOff().decision) }} · {{ uatService.signOff().signedBy }}
              </div>
              <div>{{ uatService.signOff().role }}</div>
            </div>
          }
        </aside>
      </div>
    </div>
  `,
})
export class UatPortalComponent {
  readonly pid = input<string>();
  readonly standaloneMode = input<boolean>(false);

  protected readonly uatService = inject(UatService);

  public readonly businessAreas: (UatBusinessArea | 'All')[] = [
    'All',
    'Project Collaboration',
    'Document Workspace',
    'Billing & Usage',
    'Security & Access',
  ];

  public readonly statusFilters: { value: UatScenarioStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Waiting Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'changes_requested', label: 'Needs Changes' },
    { value: 'blocked', label: 'Blocked' },
  ];

  public readonly signOffForm = new FormGroup({
    signedBy: new FormControl('', { nonNullable: true }),
    role: new FormControl('Business Owner', { nonNullable: true }),
    summaryNote: new FormControl('', { nonNullable: true }),
  });

  public readonly feedbackBanner = signal<string | null>(null);
  private readonly draftNotes = new Map<string, string>();

  constructor() {
    afterNextRender(() => {
      void this.uatService.loadFromServer().then(() => {
        const current = this.uatService.signOff();
        if (current.signedBy) {
          this.signOffForm.patchValue({
            signedBy: current.signedBy,
            role: current.role || 'Business Owner',
            summaryNote: current.summaryNote || '',
          });
        }
      });
    });
  }

  public getDraftNote(scenarioId: string, existingNote: string): string {
    return this.draftNotes.has(scenarioId) ? this.draftNotes.get(scenarioId)! : existingNote;
  }

  public setDraftNote(scenarioId: string, value: string): void {
    this.draftNotes.set(scenarioId, value);
  }

  public async recordVerdict(scenarioId: string, status: UatScenarioStatus): Promise<void> {
    const reviewerName = this.signOffForm.controls.signedBy.value || 'Business Reviewer';
    const note = this.draftNotes.get(scenarioId) ?? '';
    await this.uatService.updateScenarioVerdict(scenarioId, status, reviewerName, note);
    this.feedbackBanner.set(`Saved review decision for ${scenarioId}.`);
  }

  public async submitReleaseDecision(decision: 'approved' | 'rejected'): Promise<void> {
    const { signedBy, role, summaryNote } = this.signOffForm.getRawValue();
    const ok = await this.uatService.submitSignOff(decision, signedBy, role, summaryNote);
    if (ok) {
      this.feedbackBanner.set(
        decision === 'approved'
          ? 'Thank you. Your release approval has been recorded.'
          : 'Release hold recorded. Feedback has been shared with the product team.',
      );
    }
  }

  public resetFilters(): void {
    this.uatService.selectedArea.set('All');
    this.uatService.selectedStatus.set('all');
  }

  public formatDecisionLabel(decision: 'pending' | 'approved' | 'rejected'): string {
    if (decision === 'approved') return 'Approved for Launch';
    if (decision === 'rejected') return 'Held for Fixes';
    return 'Waiting Sign-Off';
  }

  public downloadReport(): void {
    if (typeof document === 'undefined') return;
    const text = this.uatService.generateExecutiveSummaryText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'business-uat-signoff-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  }
}
