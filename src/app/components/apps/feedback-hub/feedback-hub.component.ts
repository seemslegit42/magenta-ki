import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
  FeedbackCategory,
  FeedbackRating,
  FeedbackSentiment,
  FeedbackStatus,
} from '../../../models/feedback.models';
import { FeedbackService } from '../../../services/feedback.service';
import { StarRatingComponent } from '../../common/star-rating.component';
import { TablerIconComponent } from '../../common/tabler-icon.component';

type FeedbackTab = 'submit' | 'insights' | 'strategy';

const CATEGORY_OPTIONS: Array<{ id: FeedbackCategory; label: string; icon: string }> = [
  { id: 'bug_report', label: 'Bug Report', icon: 'bug' },
  { id: 'feature_request', label: 'Feature Request', icon: 'bulb' },
  { id: 'usability_ux', label: 'Usability & UX', icon: 'apps' },
  { id: 'performance', label: 'Performance', icon: 'gauge' },
  { id: 'integration_api', label: 'APIs & Sync', icon: 'plug' },
  { id: 'praise', label: 'Praise', icon: 'thumb-up' },
];

const PRODUCT_AREAS = [
  'Document Workspace',
  'Project Collaboration',
  'Business Acceptance (UAT)',
  'Control Plane & Gateway',
  'APIs & Integrations',
  'General Workspace',
];

@Component({
  selector: 'app-feedback-hub',
  imports: [CommonModule, ReactiveFormsModule, TablerIconComponent, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full gap-5 font-['Lexend'] text-[#F5FFFA] bg-[#0E1015] p-4 md:p-6 overflow-y-auto">
      <!-- Clean 3-Zone Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div class="space-y-1">
          <h1 class="font-['Comfortaa'] text-xl md:text-2xl font-bold text-[#F5FFFA] tracking-tight flex items-center gap-2.5">
            <app-tabler-icon name="message-report" size="24" class="text-[#3EB991]" />
            <span>Feedback &amp; API Strategy Hub</span>
          </h1>
          <p class="text-xs md:text-sm text-[#8C94A8]">
            Submit product feedback, prioritize categorized insights, and audit resilient external API integrations.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            (click)="exportInsights()"
            class="px-3.5 py-2 rounded-lg bg-[#1A1C23] hover:bg-[#22252F] border border-white/15 text-xs font-medium text-[#F5FFFA] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <app-tabler-icon name="download" size="16" class="text-[#20B2AA]" />
            <span>Export JSON Insights</span>
          </button>

          @if (standaloneMode()) {
            <a
              href="/"
              class="px-3.5 py-2 rounded-lg bg-[#20B2AA]/15 hover:bg-[#20B2AA]/25 border border-[#20B2AA]/40 text-xs font-semibold text-[#F5FFFA] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <app-tabler-icon name="apps" size="16" class="text-[#20B2AA]" />
              <span>Return to Workspace</span>
            </a>
          } @else {
            <a
              href="/feedback"
              class="px-3.5 py-2 rounded-lg bg-[#3EB991] hover:bg-[#52caa1] text-xs font-bold text-[#0E1015] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <app-tabler-icon name="message-report" size="16" />
              <span>Open Standalone View</span>
            </a>
          }
        </div>
      </header>

      <!-- Tab Navigation -->
      <nav aria-label="Feedback Hub Sections" class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          (click)="activeTab.set('submit')"
          class="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          [class.bg-[#3EB991]]="activeTab() === 'submit'"
          [class.text-[#0E1015]]="activeTab() === 'submit'"
          [class.bg-[#14161C]]="activeTab() !== 'submit'"
          [class.text-[#8C94A8]]="activeTab() !== 'submit'"
          [class.hover:text-[#F5FFFA]]="activeTab() !== 'submit'"
        >
          <app-tabler-icon name="send" size="15" />
          <span>Submit Feedback</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('insights')"
          class="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          [class.bg-[#20B2AA]]="activeTab() === 'insights'"
          [class.text-[#0E1015]]="activeTab() === 'insights'"
          [class.bg-[#14161C]]="activeTab() !== 'insights'"
          [class.text-[#8C94A8]]="activeTab() !== 'insights'"
          [class.hover:text-[#F5FFFA]]="activeTab() !== 'insights'"
        >
          <app-tabler-icon name="activity" size="15" />
          <span class="tabular-nums">Product Insights ({{ feedbackService.analytics().totalSubmissions }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('strategy')"
          class="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          [class.bg-[#6A0DAD]]="activeTab() === 'strategy'"
          [class.text-[#F5FFFA]]="activeTab() === 'strategy'"
          [class.bg-[#14161C]]="activeTab() !== 'strategy'"
          [class.text-[#8C94A8]]="activeTab() !== 'strategy'"
          [class.hover:text-[#F5FFFA]]="activeTab() !== 'strategy'"
        >
          <app-tabler-icon name="plug" size="15" />
          <span class="tabular-nums">API Integration Strategy ({{ feedbackService.integrations().length }})</span>
        </button>
      </nav>

      @if (feedbackService.errorMessage()) {
        <div
          role="alert"
          class="p-3.5 rounded-xl bg-[#93000a]/30 border border-[#FFB4AB]/40 text-xs text-[#FFB4AB] flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2">
            <app-tabler-icon name="alert-triangle" size="16" />
            <span>{{ feedbackService.errorMessage() }}</span>
          </div>
          <button
            type="button"
            (click)="feedbackService.errorMessage.set(null)"
            class="text-[#FFB4AB] hover:text-white cursor-pointer"
            aria-label="Dismiss error"
          >
            <app-tabler-icon name="x" size="14" />
          </button>
        </div>
      }

      <!-- TAB 1: SUBMIT FEEDBACK -->
      @if (activeTab() === 'submit') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section
            aria-label="Feedback Submission Form"
            class="xl:col-span-7 bg-[#14161C] border border-white/10 rounded-xl p-5 space-y-5"
          >
            <div class="space-y-1 pb-3 border-b border-white/10">
              <h2 class="font-['Comfortaa'] text-lg font-bold text-[#F5FFFA]">Share Product Feedback</h2>
              <p class="text-xs text-[#8C94A8]">
                Every submission is automatically categorized, sentiment-scored, and prioritized for the engineering roadmap.
              </p>
            </div>

            <form [formGroup]="feedbackForm" (ngSubmit)="submitForm()" class="space-y-4">
              <div class="space-y-1.5">
                <span class="block text-xs font-medium text-[#F5FFFA]">Overall Experience Rating</span>
                <app-star-rating
                  [value]="selectedRating()"
                  iconSize="22"
                  (ratingChange)="onRatingSelected($event)"
                />
              </div>

              <div class="space-y-2">
                <span class="block text-xs font-medium text-[#F5FFFA]">Category Hint (Optional — auto-detected on save)</span>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  @for (cat of categoryOptions; track cat.id) {
                    <button
                      type="button"
                      (click)="toggleCategoryHint(cat.id)"
                      class="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors cursor-pointer text-left"
                      [class.bg-[#3EB991]/15]="selectedCategoryHint() === cat.id"
                      [class.border-[#3EB991]]="selectedCategoryHint() === cat.id"
                      [class.text-[#F5FFFA]]="selectedCategoryHint() === cat.id"
                      [class.bg-[#0E1015]]="selectedCategoryHint() !== cat.id"
                      [class.border-white/10]="selectedCategoryHint() !== cat.id"
                      [class.text-[#8C94A8]]="selectedCategoryHint() !== cat.id"
                    >
                      <app-tabler-icon [name]="cat.icon" size="15" class="text-[#20B2AA] shrink-0" />
                      <span class="truncate">{{ cat.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label for="fb-area" class="block text-xs font-medium text-[#F5FFFA]">Product Area</label>
                  <select
                    id="fb-area"
                    formControlName="area"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] focus:outline-none focus:border-[#3EB991]"
                  >
                    @for (area of productAreas; track area) {
                      <option [value]="area">{{ area }}</option>
                    }
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label for="fb-submitted-by" class="block text-xs font-medium text-[#F5FFFA]">Your Name</label>
                  <input
                    id="fb-submitted-by"
                    type="text"
                    formControlName="submittedBy"
                    placeholder="e.g., Alex Rivera"
                    class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label for="fb-title" class="block text-xs font-medium text-[#F5FFFA]">Headline Summary</label>
                <input
                  id="fb-title"
                  type="text"
                  formControlName="title"
                  placeholder="Briefly summarize your experience, issue, or idea"
                  class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
                />
              </div>

              <div class="space-y-1.5">
                <label for="fb-comment" class="block text-xs font-medium text-[#F5FFFA]">Details</label>
                <textarea
                  id="fb-comment"
                  rows="4"
                  formControlName="comment"
                  placeholder="Describe what worked well, what slowed you down, or how we can improve..."
                  class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
                ></textarea>
              </div>

              <div class="space-y-1.5">
                <label for="fb-email" class="block text-xs font-medium text-[#F5FFFA]">Follow-up Email (Optional)</label>
                <input
                  id="fb-email"
                  type="email"
                  formControlName="contactEmail"
                  placeholder="name@company.com"
                  class="w-full px-3 py-2 rounded-lg bg-[#0E1015] border border-white/15 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 focus:outline-none focus:border-[#3EB991]"
                />
              </div>

              @if (submitSuccessMessage()) {
                <div class="p-3 rounded-lg bg-[#3EB991]/15 border border-[#3EB991]/40 text-xs text-[#3EB991] flex items-center gap-2">
                  <app-tabler-icon name="check" size="16" />
                  <span>{{ submitSuccessMessage() }}</span>
                </div>
              }

              <div class="pt-1 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  [disabled]="feedbackService.isSubmitting()"
                  class="px-5 py-2.5 rounded-lg bg-[#3EB991] hover:bg-[#52caa1] text-[#0E1015] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <app-tabler-icon name="send" size="16" />
                  <span>{{ feedbackService.isSubmitting() ? 'Submitting...' : 'Submit Feedback' }}</span>
                </button>
              </div>
            </form>
          </section>

          <!-- Automated Categorization Preview & Live Queue Info -->
          <aside class="xl:col-span-5 space-y-4">
            @if (feedbackService.lastSubmittedEntry(); as latest) {
              <div class="bg-[#14161C] border border-[#3EB991]/35 rounded-xl p-5 space-y-3">
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <h3 class="font-['Comfortaa'] text-sm font-bold text-[#F5FFFA]">Latest Triage Result</h3>
                  <span class="text-xs font-semibold text-[#3EB991] tabular-nums">
                    Priority {{ latest.analysis.priorityScore }}/100
                  </span>
                </div>

                <div class="text-sm font-semibold text-[#F5FFFA]">{{ latest.title }}</div>

                <div class="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <div class="text-[#8C94A8]">Detected Category</div>
                    <div class="font-semibold text-[#20B2AA]">{{ formatCategoryLabel(latest.analysis.category) }}</div>
                  </div>
                  <div>
                    <div class="text-[#8C94A8]">Sentiment &amp; Urgency</div>
                    <div class="font-semibold text-[#F5FFFA] capitalize">
                      {{ latest.analysis.sentiment }} · {{ latest.analysis.urgency }}
                    </div>
                  </div>
                </div>

                <div class="text-xs space-y-1 pt-2 border-t border-white/10">
                  <div class="font-semibold text-[#F5FFFA]">Recommended Engineering Action</div>
                  <p class="text-[#8C94A8] leading-relaxed">{{ latest.analysis.actionRecommendation }}</p>
                </div>
              </div>
            }

            <div class="bg-[#14161C] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 class="font-['Comfortaa'] text-sm font-bold text-[#F5FFFA]">How Your Feedback Drives Roadmap</h3>
              <ul class="space-y-2 text-xs text-[#8C94A8] leading-relaxed">
                <li class="flex items-start gap-2">
                  <app-tabler-icon name="bolt" size="15" class="text-[#3EB991] shrink-0 mt-0.5" />
                  <span>Deterministic backend NLP scores category, sentiment (-1 to +1), urgency, and recurring themes instantly.</span>
                </li>
                <li class="flex items-start gap-2">
                  <app-tabler-icon name="sparkles" size="15" class="text-[#20B2AA] shrink-0 mt-0.5" />
                  <span>Product owners can trigger server-side Gemini deep review when credentials are active.</span>
                </li>
                <li class="flex items-start gap-2">
                  <app-tabler-icon name="shield-check" size="15" class="text-[#dfb7ff] shrink-0 mt-0.5" />
                  <span>Every submission and triage status transition is recorded in the enterprise Audit Trail.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      }

      <!-- TAB 2: PRODUCT INSIGHTS & TRIAGE -->
      @if (activeTab() === 'insights') {
        <div class="space-y-5">
          <!-- KPI Strip -->
          <section aria-label="Feedback Analytics KPIs" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
              <div class="text-xs text-[#8C94A8]">Total Submissions</div>
              <div class="font-['Comfortaa'] text-2xl font-bold text-[#F5FFFA] tabular-nums">
                {{ feedbackService.analytics().totalSubmissions }}
              </div>
              <div class="text-xs text-[#8C94A8]">Categorized &amp; indexed</div>
            </div>

            <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
              <div class="text-xs text-[#8C94A8]">Average Rating</div>
              <div class="font-['Comfortaa'] text-2xl font-bold text-[#3EB991] tabular-nums">
                {{ feedbackService.analytics().averageRating }} / 5
              </div>
              <div class="text-xs text-[#8C94A8] tabular-nums">
                {{ feedbackService.analytics().positiveCount }} positive · {{ feedbackService.analytics().negativeCount }} negative
              </div>
            </div>

            <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
              <div class="text-xs text-[#8C94A8]">Net Promoter Score</div>
              <div class="font-['Comfortaa'] text-2xl font-bold text-[#20B2AA] tabular-nums">
                {{ feedbackService.analytics().npsScore }}
              </div>
              <div class="text-xs text-[#8C94A8]">Scale -100 to +100</div>
            </div>

            <div class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-1">
              <div class="text-xs text-[#8C94A8]">Open Action Items</div>
              <div class="font-['Comfortaa'] text-2xl font-bold text-[#FBBF24] tabular-nums">
                {{ feedbackService.analytics().openActionCount }}
              </div>
              <div class="text-xs text-[#8C94A8]">Unresolved non-praise queue</div>
            </div>
          </section>

          <!-- Category Distribution + Recurring Themes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section aria-label="Category Distribution" class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
              <h2 class="font-['Comfortaa'] text-sm font-bold text-[#F5FFFA]">Category Distribution</h2>
              <div class="space-y-2.5">
                @for (cat of feedbackService.analytics().categoryBreakdown; track cat.category) {
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-[#F5FFFA]">{{ cat.label }}</span>
                      <span class="text-[#8C94A8] tabular-nums">
                        {{ cat.count }} items · Avg {{ cat.averageRating }}/5 · Priority {{ cat.averagePriority }}
                      </span>
                    </div>
                    <div class="h-1.5 rounded-full bg-[#0E1015] overflow-hidden">
                      <div
                        class="h-full bg-[#20B2AA] rounded-full transition-all"
                        [style.width.%]="categoryPercent(cat.count)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </section>

            <section aria-label="Top Recurring Themes" class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
              <h2 class="font-['Comfortaa'] text-sm font-bold text-[#F5FFFA]">Top Recurring Themes</h2>
              @if (feedbackService.analytics().topThemes.length === 0) {
                <p class="text-xs text-[#8C94A8]">Submit additional feedback to aggregate recurring product themes.</p>
              } @else {
                <div class="space-y-2">
                  @for (theme of feedbackService.analytics().topThemes; track theme.theme) {
                    <div class="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-b-0">
                      <span class="font-medium text-[#F5FFFA]">{{ theme.theme }}</span>
                      <span class="text-[#8C94A8] tabular-nums">
                        {{ theme.count }} mentions · {{ theme.averageRating }}/5 avg
                      </span>
                    </div>
                  }
                </div>
              }
            </section>
          </div>

          <!-- Filter Bar -->
          <section aria-label="Filter Triage Queue" class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#14161C] border border-white/10 rounded-xl p-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                (click)="feedbackService.categoryFilter.set('all')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                [class.bg-[#20B2AA]]="feedbackService.categoryFilter() === 'all'"
                [class.text-[#0E1015]]="feedbackService.categoryFilter() === 'all'"
                [class.bg-[#0E1015]]="feedbackService.categoryFilter() !== 'all'"
                [class.text-[#8C94A8]]="feedbackService.categoryFilter() !== 'all'"
              >
                All Categories
              </button>
              @for (cat of categoryOptions; track cat.id) {
                <button
                  type="button"
                  (click)="feedbackService.categoryFilter.set(cat.id)"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  [class.bg-[#20B2AA]]="feedbackService.categoryFilter() === cat.id"
                  [class.text-[#0E1015]]="feedbackService.categoryFilter() === cat.id"
                  [class.bg-[#0E1015]]="feedbackService.categoryFilter() !== cat.id"
                  [class.text-[#8C94A8]]="feedbackService.categoryFilter() !== cat.id"
                >
                  {{ cat.label }}
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              @for (sent of sentimentFilters; track sent.id) {
                <button
                  type="button"
                  (click)="feedbackService.sentimentFilter.set(sent.id)"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  [class.bg-[#3EB991]]="feedbackService.sentimentFilter() === sent.id"
                  [class.text-[#0E1015]]="feedbackService.sentimentFilter() === sent.id"
                  [class.bg-[#0E1015]]="feedbackService.sentimentFilter() !== sent.id"
                  [class.text-[#8C94A8]]="feedbackService.sentimentFilter() !== sent.id"
                >
                  {{ sent.label }}
                </button>
              }
            </div>
          </section>

          <!-- Prioritized Feedback Queue -->
          <section aria-label="Prioritized Feedback Entries" class="space-y-3">
            @for (entry of sortedFilteredEntries(); track entry.id) {
              <article class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2 text-xs text-[#8C94A8]">
                      <span class="font-semibold text-[#20B2AA]">{{ formatCategoryLabel(entry.analysis.category) }}</span>
                      <span aria-hidden="true">·</span>
                      <span>{{ entry.area }}</span>
                      <span aria-hidden="true">·</span>
                      <span class="capitalize">{{ entry.analysis.urgency }} urgency</span>
                      <span aria-hidden="true">·</span>
                      <span class="tabular-nums text-[#F5FFFA] font-semibold">Priority {{ entry.analysis.priorityScore }}</span>
                    </div>
                    <h3 class="font-['Comfortaa'] text-sm md:text-base font-bold text-[#F5FFFA]">
                      {{ entry.title }}
                    </h3>
                  </div>

                  <app-star-rating [value]="entry.rating" [readonly]="true" [showLabel]="false" iconSize="16" />
                </div>

                <p class="text-xs md:text-sm text-[#F5FFFA]/90 leading-relaxed">{{ entry.comment }}</p>

                <div class="text-xs text-[#8C94A8] bg-[#0E1015] border border-white/10 rounded-lg p-3">
                  <span class="font-semibold text-[#F5FFFA]">Recommended Action: </span>
                  <span>{{ entry.analysis.actionRecommendation }}</span>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div class="text-xs text-[#8C94A8]">
                    By {{ entry.submittedBy }} · Analyzer: {{ entry.analysis.analyzerEngine }}
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5">
                    @for (statusOpt of statusOptions; track statusOpt.id) {
                      <button
                        type="button"
                        (click)="setStatus(entry.id, statusOpt.id)"
                        class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        [class.bg-[#3EB991]]="entry.status === statusOpt.id"
                        [class.text-[#0E1015]]="entry.status === statusOpt.id"
                        [class.font-bold]="entry.status === statusOpt.id"
                        [class.bg-[#0E1015]]="entry.status !== statusOpt.id"
                        [class.text-[#8C94A8]]="entry.status !== statusOpt.id"
                      >
                        {{ statusOpt.label }}
                      </button>
                    }

                    <button
                      type="button"
                      (click)="runAiEnrichment(entry.id)"
                      class="px-2.5 py-1.5 rounded-lg bg-[#6A0DAD]/40 hover:bg-[#6A0DAD]/70 border border-[#dfb7ff]/30 text-xs font-semibold text-[#dfb7ff] flex items-center gap-1.5 cursor-pointer"
                    >
                      <app-tabler-icon name="sparkles" size="14" />
                      <span>AI Deep Review</span>
                    </button>
                  </div>
                </div>
              </article>
            }
          </section>
        </div>
      }

      <!-- TAB 3: API INTEGRATION STRATEGY -->
      @if (activeTab() === 'strategy') {
        <div class="space-y-4">
          <section class="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="space-y-1">
              <h2 class="font-['Comfortaa'] text-base font-bold text-[#F5FFFA]">
                External Integration Contracts, Resilience &amp; Security Matrix
              </h2>
              <p class="text-xs text-[#8C94A8]">
                Every outbound connector enforces HTTPS, host allowlists (SSRF defense), AbortSignal timeouts, jittered retries, and 3-failure circuit breaking.
              </p>
            </div>
            <button
              type="button"
              (click)="feedbackService.loadIntegrationStrategy()"
              class="px-3.5 py-2 rounded-lg bg-[#1A1C23] hover:bg-[#22252F] border border-white/15 text-xs font-medium text-[#F5FFFA] flex items-center gap-2 cursor-pointer shrink-0"
            >
              <app-tabler-icon name="refresh" size="15" class="text-[#20B2AA]" />
              <span>Refresh Circuits</span>
            </button>
          </section>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (svc of feedbackService.integrations(); track svc.id) {
              <article class="bg-[#14161C] border border-white/10 rounded-xl p-4 space-y-3">
                <div class="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div class="space-y-0.5">
                    <h3 class="font-['Comfortaa'] text-base font-bold text-[#F5FFFA]">{{ svc.name }}</h3>
                    <p class="text-xs text-[#8C94A8]">{{ svc.purpose }}</p>
                  </div>

                  <div
                    class="flex items-center gap-1.5 text-xs font-semibold capitalize shrink-0"
                    [class.text-[#3EB991]]="svc.circuitState === 'closed'"
                    [class.text-[#FBBF24]]="svc.circuitState === 'half-open'"
                    [class.text-[#FFB4AB]]="svc.circuitState === 'open'"
                  >
                    <app-tabler-icon
                      [name]="svc.circuitState === 'closed' ? 'shield-check' : 'alert-triangle'"
                      size="15"
                    />
                    <span>Circuit {{ svc.circuitState }}</span>
                  </div>
                </div>

                <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt class="text-[#8C94A8]">Protocol</dt>
                    <dd class="text-[#F5FFFA] font-medium">{{ svc.protocol }}</dd>
                  </div>
                  <div>
                    <dt class="text-[#8C94A8]">Timeout / Retries</dt>
                    <dd class="text-[#20B2AA] font-semibold tabular-nums">
                      {{ svc.timeoutMs }}ms · {{ svc.maxRetries }} retries
                    </dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-[#8C94A8]">Data Formats</dt>
                    <dd class="text-[#F5FFFA]">{{ svc.dataFormats }}</dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-[#8C94A8]">Authentication &amp; Secret Boundary</dt>
                    <dd class="text-[#F5FFFA] flex items-center gap-1.5">
                      <app-tabler-icon name="lock" size="13" class="text-[#dfb7ff] shrink-0" />
                      <span>{{ svc.authScheme }}</span>
                    </dd>
                  </div>
                </dl>

                <div class="space-y-1 text-xs pt-2 border-t border-white/10">
                  <div class="font-semibold text-[#F5FFFA]">Security Controls &amp; Rate Policy</div>
                  <p class="text-[#8C94A8]">{{ svc.rateLimitPolicy }}</p>
                  <ul class="space-y-1 text-[#8C94A8]">
                    @for (ctrl of svc.securityControls; track $index) {
                      <li class="flex items-start gap-1.5">
                        <app-tabler-icon name="check" size="13" class="text-[#3EB991] shrink-0 mt-0.5" />
                        <span>{{ ctrl }}</span>
                      </li>
                    }
                  </ul>
                </div>

                <div class="pt-2 flex items-center justify-between gap-2 text-xs">
                  <span class="text-[#8C94A8] tabular-nums">
                    @if (svc.lastLatencyMs !== null) {
                      Last probe: {{ svc.lastLatencyMs }}ms ({{ svc.consecutiveFailures }} failures)
                    } @else {
                      Ready for health probe
                    }
                  </span>

                  <button
                    type="button"
                    (click)="probeService(svc.id)"
                    class="px-3 py-1.5 rounded-lg bg-[#20B2AA]/15 hover:bg-[#20B2AA]/25 border border-[#20B2AA]/40 text-xs font-semibold text-[#F5FFFA] flex items-center gap-1.5 cursor-pointer"
                  >
                    <app-tabler-icon name="activity" size="14" class="text-[#20B2AA]" />
                    <span>Probe Connectivity</span>
                  </button>
                </div>
              </article>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class FeedbackHubComponent {
  readonly pid = input<string>();
  readonly standaloneMode = input<boolean>(false);

  protected readonly feedbackService = inject(FeedbackService);

  public readonly activeTab = signal<FeedbackTab>('submit');
  public readonly selectedRating = signal<FeedbackRating>(5);
  public readonly selectedCategoryHint = signal<FeedbackCategory | undefined>(undefined);
  public readonly submitSuccessMessage = signal<string | null>(null);

  public readonly categoryOptions = CATEGORY_OPTIONS;
  public readonly productAreas = PRODUCT_AREAS;

  public readonly sentimentFilters: Array<{ id: FeedbackSentiment | 'all'; label: string }> = [
    { id: 'all', label: 'All Sentiment' },
    { id: 'positive', label: 'Positive' },
    { id: 'neutral', label: 'Neutral' },
    { id: 'negative', label: 'Negative' },
  ];

  public readonly statusOptions: Array<{ id: FeedbackStatus; label: string }> = [
    { id: 'new', label: 'New' },
    { id: 'triaged', label: 'Triaged' },
    { id: 'planned', label: 'Planned' },
    { id: 'resolved', label: 'Resolved' },
  ];

  public readonly feedbackForm = new FormGroup({
    area: new FormControl('Document Workspace', { nonNullable: true }),
    submittedBy: new FormControl('', { nonNullable: true }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    contactEmail: new FormControl('', { nonNullable: true }),
  });

  public readonly sortedFilteredEntries = computed(() =>
    [...this.feedbackService.filteredEntries()].sort(
      (a, b) => b.analysis.priorityScore - a.analysis.priorityScore,
    ),
  );

  constructor() {
    afterNextRender(() => {
      void this.feedbackService.loadFeedback();
      void this.feedbackService.loadIntegrationStrategy();
    });
  }

  public onRatingSelected(rating: number): void {
    const clamped = Math.max(1, Math.min(5, rating)) as FeedbackRating;
    this.selectedRating.set(clamped);
  }

  public toggleCategoryHint(category: FeedbackCategory): void {
    this.selectedCategoryHint.update((current) => (current === category ? undefined : category));
  }

  public async submitForm(): Promise<void> {
    this.submitSuccessMessage.set(null);
    const raw = this.feedbackForm.getRawValue();
    const created = await this.feedbackService.submitFeedback({
      rating: this.selectedRating(),
      area: raw.area,
      submittedBy: raw.submittedBy || 'Workspace Member',
      title: raw.title,
      comment: raw.comment,
      contactEmail: raw.contactEmail || undefined,
      userCategoryHint: this.selectedCategoryHint(),
    });

    if (created) {
      this.submitSuccessMessage.set(
        `Feedback "${created.title}" recorded as ${this.formatCategoryLabel(created.analysis.category)} (priority ${created.analysis.priorityScore}).`,
      );
      this.feedbackForm.patchValue({ title: '', comment: '', contactEmail: '' });
      this.selectedCategoryHint.set(undefined);
    }
  }

  public async setStatus(id: string, status: FeedbackStatus): Promise<void> {
    await this.feedbackService.updateStatus(id, status);
  }

  public async runAiEnrichment(id: string): Promise<void> {
    await this.feedbackService.enrichWithAi(id);
  }

  public async probeService(serviceId: string): Promise<void> {
    await this.feedbackService.probeIntegration(serviceId);
  }

  public categoryPercent(count: number): number {
    const total = this.feedbackService.analytics().totalSubmissions;
    if (total <= 0) return 0;
    return Math.round((count / total) * 100);
  }

  public formatCategoryLabel(category: FeedbackCategory): string {
    const found = CATEGORY_OPTIONS.find((c) => c.id === category);
    return found ? found.label : category;
  }

  public exportInsights(): void {
    if (typeof document === 'undefined') return;
    const json = this.feedbackService.exportInsightsJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'verdigris-feedback-insights.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
