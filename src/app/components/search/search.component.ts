import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { TablerIconComponent } from '../common/tabler-icon.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TablerIconComponent],
  template: `
    @if (searchService.isVisible()) {
      <div 
        class="fixed inset-0 z-[1000] flex items-start justify-center pt-20 bg-black/60 backdrop-blur-md"
        (click)="onBackdropClick($event)"
        (keydown.escape)="searchService.toggle()"
        tabindex="0"
        role="dialog"
        aria-label="Search overlay"
      >
        <div 
          class="w-full max-w-2xl bg-[#14161F]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-4 overflow-hidden"
        >
          <div class="flex items-center px-2 border-b border-white/10 pb-2">
            <app-tabler-icon name="apps" size="20" class="text-[#3EB991] mr-3" />
            <input 
              type="text" 
              placeholder="Search apps, AVF calculus, terminal, commands... (Cmd+Space)"
              class="w-full bg-transparent p-2 text-white text-base font-light outline-none placeholder-white/40"
              [(ngModel)]="query"
              (input)="filterItems()"
            />
          </div>
          <div class="mt-2 max-h-[400px] overflow-y-auto space-y-1">
            @for (item of filteredItems; track item.id) {
              <button 
                type="button"
                class="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/10 text-white transition-all text-left focus:outline-none focus:bg-white/10"
                (click)="item.action(); searchService.toggle()"
                (keydown.enter)="item.action(); searchService.toggle()"
              >
                <div class="w-9 h-9 rounded-xl bg-[#3EB991]/15 border border-[#3EB991]/30 flex items-center justify-center text-[#3EB991] shadow-sm">
                  <app-tabler-icon [name]="item.icon" size="18" />
                </div>
                <div class="flex-1">
                  <div class="text-sm font-semibold text-[#F5FFFA]">{{ item.name }}</div>
                  <div class="text-[11px] text-[#8C94A8] uppercase tracking-wider font-mono">{{ item.type }}</div>
                </div>
                <span class="text-[10px] font-mono text-[#3EB991] px-2 py-0.5 rounded bg-white/5 border border-white/10">Launch</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class SearchComponent {
  searchService = inject(SearchService);
  query = '';
  filteredItems = this.searchService.items();

  filterItems() {
    this.filteredItems = this.searchService.items().filter(item => 
      item.name.toLowerCase().includes(this.query.toLowerCase())
    );
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.searchService.toggle();
    }
  }

  @HostListener('window:keydown.meta.space', ['$event'])
  handleKeyboardEvent(event: Event) {
    const kbEvent = event as KeyboardEvent;
    kbEvent.preventDefault(); // Prevent browser default search/shortcut
    this.searchService.toggle();
  }
}
