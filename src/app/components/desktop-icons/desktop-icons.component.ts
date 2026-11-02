import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DesktopIconsService } from '../../services/desktop-icons.service';
import { WindowManagerService } from '../../services/window-manager.service';
import { DesktopShortcut } from '../../models/webos.models';
import { RecycleBinService } from '../../services/recycle-bin.service';
import { NotificationService } from '../../services/notification.service';

interface DragState {
  shortcutId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  hasMoved: boolean;
}

@Component({
  selector: 'app-desktop-icons',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
  template: `
    <div
      class="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      (contextmenu)="onContextMenu($event, null)">
      
      <!-- Shortcut Icons -->
      @for (sc of iconsService.shortcuts(); track sc.id) {
        <div
          role="button"
          tabindex="0"
          [attr.aria-label]="sc.title + ' Desktop Shortcut'"
          class="absolute pointer-events-auto flex flex-col items-center justify-center p-2 rounded-xl group transition-[box-shadow,border-color,transform] duration-150 select-none cursor-pointer outline-none w-24 touch-none"
          [style.left.px]="sc.x"
          [style.top.px]="sc.y"
          [class.bg-white/10]="iconsService.selectedId() === sc.id"
          [class.border]="iconsService.selectedId() === sc.id || (sc.id === 'recycle-bin' && hoveringOverTrash())"
          [class.border-[#E0218A]/60]="iconsService.selectedId() === sc.id && !(sc.id === 'recycle-bin' && hoveringOverTrash())"
          [class.shadow-[0_0_20px_rgba(224,33,138,0.25)]]="iconsService.selectedId() === sc.id && !(sc.id === 'recycle-bin' && hoveringOverTrash())"
          [class.border-[#FF4D6D]]="sc.id === 'recycle-bin' && hoveringOverTrash()"
          [class.shadow-[0_0_28px_rgba(255,77,109,0.7)]]="sc.id === 'recycle-bin' && hoveringOverTrash()"
          [class.scale-110]="sc.id === 'recycle-bin' && hoveringOverTrash()"
          (mousedown)="onPointerDown($event, sc)"
          (touchstart)="onTouchStart($event, sc)"
          (dblclick)="launchShortcut(sc)"
          (keydown.enter)="launchShortcut(sc)"
          (keydown.space)="launchShortcut(sc)"
          (contextmenu)="onContextMenu($event, sc)">
          
          <!-- Icon Glyph Badge with Frosted Glow -->
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95 border relative"
            [style.background-color]="sc.color + '1a'"
            [style.border-color]="sc.id === 'recycle-bin' && hoveringOverTrash() ? '#FF4D6D' : sc.color + '55'"
            [style.color]="sc.id === 'recycle-bin' && hoveringOverTrash() ? '#FF4D6D' : sc.color">
            <!-- Ambient Underglow -->
            <div
              class="absolute inset-0 rounded-2xl blur-md opacity-30 group-hover:opacity-75 transition-opacity"
              [style.background-color]="sc.color"></div>
            
            <mat-icon class="text-2xl relative z-10">
              {{ sc.id === 'recycle-bin' ? (recycleBin.isEmpty() ? 'delete_outline' : 'delete') : sc.icon }}
            </mat-icon>

            <!-- Recycle Bin Item Count Badge -->
            @if (sc.id === 'recycle-bin' && !recycleBin.isEmpty()) {
              <span
                class="absolute -top-1.5 -right-1.5 z-20 min-w-5 h-5 px-1 rounded-full bg-[#FF4D6D] border-2 border-[#0E1015] text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                {{ recycleBin.itemCount() > 99 ? '99+' : recycleBin.itemCount() }}
              </span>
            }
          </div>

          <!-- Label with Dark Frosted Backing for Optimal Legibility -->
          <span
            class="mt-1.5 px-2 py-0.5 rounded-md font-['Comfortaa'] text-[11px] font-medium text-[#F5FFFA] text-center leading-tight line-clamp-2 max-w-full bg-[#08090C]/80 backdrop-blur-md border border-white/10 shadow-sm group-hover:border-white/30 transition-colors">
            {{ sc.title }}
          </span>
        </div>
      }

      <!-- Custom Desktop Context Menu -->
      @if (showMenu()) {
        <div
          class="absolute pointer-events-auto z-50 bg-[#151922]/95 backdrop-blur-xl border border-white/15 p-1.5 rounded-xl shadow-2xl min-w-48 text-xs font-['Lexend'] text-white animate-in fade-in zoom-in-95 duration-150"
          [style.left.px]="menuX()"
          [style.top.px]="menuY()">
          
          @if (menuTarget(); as target) {
            <!-- Menu For A Specific Shortcut -->
            <div class="px-2.5 py-1 text-[10px] text-[#8C94A8] font-mono border-b border-white/10 mb-1 truncate">
              {{ target.title }}
            </div>

            <button
              type="button"
              class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2 cursor-pointer"
              (click)="launchShortcut(target); showMenu.set(false)">
              <mat-icon class="text-sm text-[#20B2AA]">open_in_new</mat-icon>
              <span>Open</span>
            </button>

            @if (target.id !== 'recycle-bin') {
              <button
                type="button"
                class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#FF4D6D]/20 text-[#FF4D6D] transition-colors flex items-center space-x-2 cursor-pointer"
                (click)="moveTargetToTrash(target)">
                <mat-icon class="text-sm">delete_outline</mat-icon>
                <span>Move to Trash</span>
              </button>
            } @else {
              <button
                type="button"
                [disabled]="recycleBin.isEmpty()"
                class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#FF4D6D]/20 disabled:opacity-40 disabled:pointer-events-none text-[#FF4D6D] transition-colors flex items-center space-x-2 cursor-pointer"
                (click)="recycleBin.emptyBin(); showMenu.set(false)">
                <mat-icon class="text-sm">delete_sweep</mat-icon>
                <span>Empty Recycle Bin</span>
              </button>
            }
          } @else {
            <!-- Menu For Empty Desktop Canvas -->
            <button
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-[#E0218A]/20 hover:text-[#FF2A9D] transition-colors flex items-center space-x-2 cursor-pointer"
              (click)="resetDesktopGrid()">
              <mat-icon class="text-sm">grid_view</mat-icon>
              <span>Reset Icon Grid</span>
            </button>

            <button
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2 cursor-pointer"
              (click)="openRecycleBin()">
              <mat-icon class="text-sm text-[#FF4D6D]">{{ recycleBin.isEmpty() ? 'delete_outline' : 'delete' }}</mat-icon>
              <span>Open Recycle Bin</span>
            </button>
          }
        </div>
      }
    </div>
  `
})
export class DesktopIconsComponent {
  protected readonly iconsService = inject(DesktopIconsService);
  protected readonly windowManager = inject(WindowManagerService);
  protected readonly recycleBin = inject(RecycleBinService);
  protected readonly notifications = inject(NotificationService);

  private drag: DragState | null = null;
  public readonly hoveringOverTrash = signal<boolean>(false);
  public readonly showMenu = signal<boolean>(false);
  public readonly menuX = signal<number>(0);
  public readonly menuY = signal<number>(0);
  public readonly menuTarget = signal<DesktopShortcut | null>(null);

  public onPointerDown(event: MouseEvent, shortcut: DesktopShortcut): void {
    if (event.button !== 0) return; // Only primary button
    this.iconsService.select(shortcut.id);
    this.startDrag(shortcut.id, event.clientX, event.clientY, shortcut.x, shortcut.y);

    const onMouseMove = (moveEvt: MouseEvent) => {
      this.handleDragMove(moveEvt.clientX, moveEvt.clientY);
    };

    const onMouseUp = () => {
      this.endDrag();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  public onTouchStart(event: TouchEvent, shortcut: DesktopShortcut): void {
    const touch = event.touches[0];
    if (!touch) return;
    this.iconsService.select(shortcut.id);
    this.startDrag(shortcut.id, touch.clientX, touch.clientY, shortcut.x, shortcut.y);

    const onTouchMove = (moveEvt: TouchEvent) => {
      const t = moveEvt.touches[0];
      if (t) this.handleDragMove(t.clientX, t.clientY);
    };

    const onTouchEnd = () => {
      if (this.drag && !this.drag.hasMoved) {
        // Tap on touch device launches shortcut
        this.launchShortcut(shortcut);
      }
      this.endDrag();
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  private startDrag(shortcutId: string, clientX: number, clientY: number, origX: number, origY: number): void {
    this.drag = {
      shortcutId,
      startX: clientX,
      startY: clientY,
      origX,
      origY,
      hasMoved: false
    };
    this.showMenu.set(false);
  }

  private handleDragMove(clientX: number, clientY: number): void {
    if (!this.drag) return;
    const dx = clientX - this.drag.startX;
    const dy = clientY - this.drag.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      this.drag.hasMoved = true;
    }

    if (this.drag.hasMoved) {
      const newX = Math.max(12, Math.min(window.innerWidth - 100, this.drag.origX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - 140, this.drag.origY + dy));
      this.iconsService.updatePosition(this.drag.shortcutId, newX, newY);

      // Detect hover over Recycle Bin (if dragging another shortcut)
      if (this.drag.shortcutId !== 'recycle-bin') {
        const bin = this.iconsService.shortcuts().find(s => s.id === 'recycle-bin');
        if (bin) {
          const binCenterX = bin.x + 48;
          const binCenterY = bin.y + 48;
          const iconCenterX = newX + 48;
          const iconCenterY = newY + 48;
          const dist = Math.hypot(iconCenterX - binCenterX, iconCenterY - binCenterY);
          this.hoveringOverTrash.set(dist < 64);
        }
      }
    }
  }

  private endDrag(): void {
    if (this.drag && this.drag.hasMoved && this.hoveringOverTrash() && this.drag.shortcutId !== 'recycle-bin') {
      // User dropped icon directly onto the Recycle Bin!
      const targetShortcut = this.iconsService.shortcuts().find(s => s.id === this.drag!.shortcutId);
      if (targetShortcut) {
        this.iconsService.removeShortcut(targetShortcut.id);
        this.recycleBin.moveToTrash({
          name: targetShortcut.title,
          type: 'shortcut',
          icon: targetShortcut.icon,
          originalLocation: 'Desktop',
          sizeBytes: 1024,
          data: targetShortcut
        });
        this.windowManager.triggerHaptic(25);
      }
    }
    this.hoveringOverTrash.set(false);
    this.drag = null;
  }

  public launchShortcut(shortcut: DesktopShortcut): void {
    this.windowManager.openApp({
      id: shortcut.id,
      title: shortcut.title,
      icon: shortcut.icon,
      entryComponent: shortcut.entryComponent,
      category: shortcut.category
    });
    this.windowManager.triggerHaptic(12);
  }

  public onContextMenu(event: MouseEvent, target: DesktopShortcut | null): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuTarget.set(target);
    this.menuX.set(Math.min(event.clientX, window.innerWidth - 200));
    this.menuY.set(Math.min(event.clientY, window.innerHeight - 120));
    this.showMenu.set(true);
  }

  public onDocumentClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('[role="button"]')) return;
    this.iconsService.select(null);
    this.showMenu.set(false);
  }

  public moveTargetToTrash(target: DesktopShortcut): void {
    this.iconsService.removeShortcut(target.id);
    this.recycleBin.moveToTrash({
      name: target.title,
      type: 'shortcut',
      icon: target.icon,
      originalLocation: 'Desktop',
      sizeBytes: 1024,
      data: target
    });
    this.showMenu.set(false);
    this.windowManager.triggerHaptic(15);
  }

  public openRecycleBin(): void {
    this.windowManager.openApp({
      id: 'recycle-bin',
      title: 'Recycle Bin',
      icon: 'delete',
      entryComponent: 'RecycleBinComponent',
      category: 'system'
    });
    this.showMenu.set(false);
  }

  public resetDesktopGrid(): void {
    this.iconsService.resetGrid();
    this.showMenu.set(false);
    this.windowManager.triggerHaptic(10);
  }
}
