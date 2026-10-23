import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { TablerIconComponent } from '../common/tabler-icon.component';

@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.meta.space)': 'handleKeyboardEvent($event)',
  },
  imports: [TablerIconComponent],
  template: `
    @if (searchService.isVisible()) {
      <div
        class="fixed inset-0 z-[1000] flex items-start justify-center pt-20 bg-black/55"
        (click)="onBackdropClick($event)"
        (keydown.escape)="searchService.toggle()"
        tabindex="0"
        role="dialog"
        aria-label="Search overlay"
      >
        <div
          class="w-full max-w-2xl bg-surface-low border border-white/15 rounded-xl p-3 overflow-hidden"
        >
          <div class="flex items-center px-2 border-b border-white/10 pb-2">
            <app-tabler-icon name="apps" size="20" class="text-tertiary mr-3" />
            <input
              type="text"
              placeholder="Search apps, AVF calculus, terminal, commands… (Cmd+Space)"
              class="w-full bg-transparent p-2 text-white text-base font-light outline-none placeholder-white/40"
              [value]="query()"
              (input)="onQueryInput($event)"
            />
          </div>
          <div class="mt-2 max-h-[400px] overflow-y-auto space-y-0.5">
            @for (item of filteredItems(); track item.id) {
              <button
                type="button"
                class="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/8 text-white transition-colors text-left focus:outline-none focus-visible:bg-white/8"
                (click)="launch(item)"
              >
                <div class="w-9 h-9 rounded-lg bg-tertiary/12 border border-tertiary/25 flex items-center justify-center text-tertiary">
                  <app-tabler-icon [name]="item.icon" size="18" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-on-surface truncate">{{ item.name }}</div>
                  <div class="text-[11px] text-on-surface-variant uppercase tracking-wider font-mono">{{ item.type }}</div>
                </div>
                <span class="text-[10px] font-mono text-tertiary">Launch</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class SearchComponent {
  readonly searchService = inject(SearchService);
  readonly query = signal('');

  readonly filteredItems = computed(() => {
    const q = this.query().toLowerCase();
    return this.searchService.items().filter((item) => item.name.toLowerCase().includes(q));
  });

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  launch(item: { action: () => void }): void {
    item.action();
    this.searchService.toggle();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.searchService.toggle();
    }
  }

  handleKeyboardEvent(event: Event): void {
    event.preventDefault();
    this.searchService.toggle();
  }
}
