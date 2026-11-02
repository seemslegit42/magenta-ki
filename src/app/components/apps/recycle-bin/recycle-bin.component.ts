import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecycleBinService } from '../../../services/recycle-bin.service';
import { RecycledItem } from '../../../models/webos.models';

@Component({
  selector: 'app-recycle-bin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
  template: `
    <div class="flex flex-col h-full space-y-3 font-['Lexend'] text-[#F5FFFA] p-1 select-none">
      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 flex items-center justify-center text-[#FF4D6D] shadow-md">
            <mat-icon>{{ recycleBin.isEmpty() ? 'delete_outline' : 'delete' }}</mat-icon>
          </div>
          <div>
            <h2 class="font-['Comfortaa'] text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <span>Recycle Bin</span>
              @if (!recycleBin.isEmpty()) {
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40 font-mono">
                  {{ recycleBin.itemCount() }} {{ recycleBin.itemCount() === 1 ? 'item' : 'items' }}
                </span>
              }
            </h2>
            <p class="text-xs text-[#8C94A8] mt-0.5">
              @if (recycleBin.isEmpty()) {
                All systems clean. No recycled items in storage.
              } @else {
                {{ (recycleBin.totalSizeBytes() / 1024).toFixed(1) }} KB in temporary storage. Items can be restored or purged.
              }
            </p>
          </div>
        </div>

        <!-- Global Bin Actions -->
        <div class="flex items-center space-x-2">
          <button
            type="button"
            [disabled]="recycleBin.isEmpty()"
            (click)="onRestoreAll()"
            class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm">
            <mat-icon class="text-xs">restore_page</mat-icon>
            <span>Restore All</span>
          </button>

          <button
            type="button"
            [disabled]="recycleBin.isEmpty()"
            (click)="confirmEmptyBin.set(true)"
            class="px-3.5 py-1.5 rounded-lg bg-[#FF4D6D] hover:bg-[#ff2a55] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md shadow-[#FF4D6D]/20">
            <mat-icon class="text-xs">delete_sweep</mat-icon>
            <span>Empty Recycle Bin</span>
          </button>
        </div>
      </header>

      <!-- Search & Category Filters -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 bg-[#14161C] border border-white/10 rounded-xl p-2.5">
        <div class="relative flex-1 min-w-[180px]">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94A8] text-sm">search</mat-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search recycled items..."
            class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white placeholder-[#8C94A8] focus:outline-none focus:border-[#20B2AA]"
          />
        </div>

        <div class="flex items-center space-x-1.5 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedTypeFilter === 'all'"
            [class.text-[#0E1015]]="selectedTypeFilter === 'all'"
            [class.border-[#20B2AA]]="selectedTypeFilter === 'all'"
            [class.bg-white/5]="selectedTypeFilter !== 'all'"
            [class.text-[#8C94A8]]="selectedTypeFilter !== 'all'"
            [class.border-white/10]="selectedTypeFilter !== 'all'"
            (click)="selectedTypeFilter = 'all'">
            All ({{ recycleBin.itemCount() }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedTypeFilter === 'shortcut'"
            [class.text-[#0E1015]]="selectedTypeFilter === 'shortcut'"
            [class.border-[#20B2AA]]="selectedTypeFilter === 'shortcut'"
            [class.bg-white/5]="selectedTypeFilter !== 'shortcut'"
            [class.text-[#8C94A8]]="selectedTypeFilter !== 'shortcut'"
            [class.border-white/10]="selectedTypeFilter !== 'shortcut'"
            (click)="selectedTypeFilter = 'shortcut'">
            Shortcuts
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedTypeFilter === 'file'"
            [class.text-[#0E1015]]="selectedTypeFilter === 'file'"
            [class.border-[#20B2AA]]="selectedTypeFilter === 'file'"
            [class.bg-white/5]="selectedTypeFilter !== 'file'"
            [class.text-[#8C94A8]]="selectedTypeFilter !== 'file'"
            [class.border-white/10]="selectedTypeFilter !== 'file'"
            (click)="selectedTypeFilter = 'file'">
            Files & Documents
          </button>
        </div>
      </div>

      <!-- Main Contents Area -->
      <div class="flex-1 overflow-y-auto min-h-[220px]">
        @if (recycleBin.isEmpty()) {
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center h-full min-h-[260px] text-center p-8 bg-[#14161C]/50 rounded-2xl border border-white/5 border-dashed">
            <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8C94A8] mb-3">
              <mat-icon class="text-3xl">auto_delete</mat-icon>
            </div>
            <h3 class="font-['Comfortaa'] text-base font-semibold text-white">Recycle Bin is Empty</h3>
            <p class="text-xs text-[#8C94A8] max-w-sm mt-1 leading-relaxed">
              Drag desktop shortcuts onto the Recycle Bin icon or delete files in File Explorer. Items moved here can be restored at any time.
            </p>
          </div>
        } @else if (filteredItems().length === 0) {
          <!-- Search / Filter No Matches State -->
          <div class="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6 text-[#8C94A8]">
            <mat-icon class="text-2xl mb-1">search_off</mat-icon>
            <p class="text-xs font-medium">No recycled items match your search filter.</p>
          </div>
        } @else {
          <!-- Items List Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            @for (item of filteredItems(); track item.id) {
              <div
                class="group flex flex-col justify-between p-3.5 rounded-xl bg-[#14161C] border border-white/10 hover:border-white/20 transition-all shadow-sm">
                
                <div class="flex items-start space-x-3">
                  <!-- Item Glyph Badge -->
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    [class.bg-[#E0218A]/15]="item.type === 'shortcut'"
                    [class.border-[#E0218A]/30]="item.type === 'shortcut'"
                    [class.text-[#E0218A]]="item.type === 'shortcut'"
                    [class.bg-[#20B2AA]/15]="item.type === 'file' || item.type === 'document'"
                    [class.border-[#20B2AA]/30]="item.type === 'file' || item.type === 'document'"
                    [class.text-[#20B2AA]]="item.type === 'file' || item.type === 'document'">
                    <mat-icon class="text-xl">{{ item.icon || 'drafts' }}</mat-icon>
                  </div>

                  <!-- Details -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h4 class="text-xs font-bold text-white truncate max-w-[180px]" [title]="item.name">{{ item.name }}</h4>
                      <span class="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase tracking-wider font-semibold"
                        [class.bg-[#E0218A]/20]="item.type === 'shortcut'"
                        [class.text-[#FF2A9D]]="item.type === 'shortcut'"
                        [class.bg-[#20B2AA]/20]="item.type !== 'shortcut'"
                        [class.text-[#20B2AA]]="item.type !== 'shortcut'">
                        {{ item.type }}
                      </span>
                    </div>

                    <p class="text-[11px] text-[#8C94A8] mt-1 flex items-center space-x-1">
                      <mat-icon class="text-[12px]">location_on</mat-icon>
                      <span class="truncate">{{ item.originalLocation }}</span>
                    </p>

                    <div class="flex items-center space-x-2 text-[10px] text-[#8C94A8] font-mono mt-1">
                      <span>{{ item.deletedAt | date:'medium' }}</span>
                      <span>·</span>
                      <span>{{ (item.sizeBytes / 1024).toFixed(1) }} KB</span>
                    </div>
                  </div>
                </div>

                <!-- Action Controls -->
                <div class="flex items-center justify-end space-x-2 pt-3 mt-2 border-t border-white/5">
                  <button
                    type="button"
                    (click)="onRestoreItem(item.id)"
                    class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#20B2AA]/20 hover:text-[#20B2AA] text-white text-[11px] font-medium transition-colors flex items-center space-x-1 cursor-pointer">
                    <mat-icon class="text-xs">restore</mat-icon>
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    (click)="promptPermanentDelete(item)"
                    class="px-2.5 py-1 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/30 text-[#FF4D6D] text-[11px] font-medium transition-colors flex items-center space-x-1 cursor-pointer">
                    <mat-icon class="text-xs">delete_forever</mat-icon>
                    <span>Delete Forever</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer Telemetry -->
      <footer class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8C94A8] font-mono">
        <span class="flex items-center space-x-1">
          <mat-icon class="text-xs text-[#20B2AA]">security</mat-icon>
          <span>Recycle Bin Inode Storage: Isolated & Encrypted</span>
        </span>
        <span>Audit Trail Synced</span>
      </footer>

      <!-- Confirmation Modal: Empty Bin -->
      @if (confirmEmptyBin()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div class="bg-[#14161C] border border-[#FF4D6D]/40 rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl text-white">
            <div class="flex items-center space-x-3 text-[#FF4D6D]">
              <div class="w-10 h-10 rounded-xl bg-[#FF4D6D]/20 flex items-center justify-center">
                <mat-icon class="text-xl">warning</mat-icon>
              </div>
              <h3 class="font-['Comfortaa'] text-base font-bold">Empty Recycle Bin?</h3>
            </div>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              Are you sure you want to permanently delete all <strong class="text-white">{{ recycleBin.itemCount() }}</strong> items? This action cannot be undone and will purge them from storage.
            </p>
            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                (click)="confirmEmptyBin.set(false)"
                class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="onEmptyBin()"
                class="px-3.5 py-1.5 rounded-lg bg-[#FF4D6D] hover:bg-[#ff2a55] text-xs font-bold shadow-md cursor-pointer">
                Yes, Empty Bin
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Modal: Delete Single Item Permanently -->
      @if (itemToDelete(); as target) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div class="bg-[#14161C] border border-[#FF4D6D]/40 rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl text-white">
            <div class="flex items-center space-x-3 text-[#FF4D6D]">
              <div class="w-10 h-10 rounded-xl bg-[#FF4D6D]/20 flex items-center justify-center">
                <mat-icon class="text-xl">delete_forever</mat-icon>
              </div>
              <h3 class="font-['Comfortaa'] text-base font-bold">Delete Permanently?</h3>
            </div>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              Are you sure you want to permanently delete <strong class="text-white">"{{ target.name }}"</strong>? This file or shortcut will be purged permanently.
            </p>
            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                (click)="itemToDelete.set(null)"
                class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="onConfirmDeletePermanently()"
                class="px-3.5 py-1.5 rounded-lg bg-[#FF4D6D] hover:bg-[#ff2a55] text-xs font-bold shadow-md cursor-pointer">
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RecycleBinComponent {
  @Input() pid!: string;

  protected readonly recycleBin = inject(RecycleBinService);

  protected searchQuery = '';
  protected selectedTypeFilter: 'all' | 'shortcut' | 'file' = 'all';

  public readonly confirmEmptyBin = signal<boolean>(false);
  public readonly itemToDelete = signal<RecycledItem | null>(null);

  protected readonly filteredItems = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    const typeFilter = this.selectedTypeFilter;
    const items = this.recycleBin.trashedItems();

    return items.filter(item => {
      const matchType = typeFilter === 'all' || item.type === typeFilter || (typeFilter === 'file' && item.type === 'document');
      const matchQuery = !query || item.name.toLowerCase().includes(query) || item.originalLocation.toLowerCase().includes(query);
      return matchType && matchQuery;
    });
  });

  public onRestoreItem(id: string): void {
    this.recycleBin.restoreItem(id);
  }

  public onRestoreAll(): void {
    this.recycleBin.restoreAll();
  }

  public promptPermanentDelete(item: RecycledItem): void {
    this.itemToDelete.set(item);
  }

  public onConfirmDeletePermanently(): void {
    const target = this.itemToDelete();
    if (target) {
      this.recycleBin.deletePermanently(target.id);
      this.itemToDelete.set(null);
    }
  }

  public onEmptyBin(): void {
    this.recycleBin.emptyBin();
    this.confirmEmptyBin.set(false);
  }
}
