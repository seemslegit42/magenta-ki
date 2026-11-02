import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RecycledItem, DesktopShortcut, VfsInode, AuditCategory } from '../models/webos.models';
import { AgentFSService } from './agentfs.service';
import { DesktopIconsService } from './desktop-icons.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const TRASH_STORAGE_KEY = 'vev_recycle_bin_v1';

@Injectable({ providedIn: 'root' })
export class RecycleBinService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly agentFs = inject(AgentFSService);
  private readonly desktopIcons = inject(DesktopIconsService);
  private readonly audit = inject(AuditService);
  private readonly notification = inject(NotificationService);

  public readonly trashedItems = signal<RecycledItem[]>([]);
  public readonly selectedItemId = signal<string | null>(null);

  public readonly itemCount = computed(() => this.trashedItems().length);
  public readonly isEmpty = computed(() => this.itemCount() === 0);
  public readonly totalSizeBytes = computed(() =>
    this.trashedItems().reduce((sum, item) => sum + (item.sizeBytes || 0), 0)
  );

  constructor() {
    this.loadSavedBin();

    // Dynamically update the recycle bin desktop icon glyph (empty vs full)
    effect(() => {
      const hasItems = !this.isEmpty();
      this.desktopIcons.updateShortcutIcon('recycle-bin', hasItems ? 'delete' : 'delete_outline');
    });
  }

  private loadSavedBin(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(TRASH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RecycledItem[];
        if (Array.isArray(parsed)) {
          this.trashedItems.set(parsed);
        }
      }
    } catch {
      // Fallback to empty
    }
  }

  private persistBin(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(this.trashedItems()));
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Move an item (Desktop shortcut, AgentFS file, document) into the recycling bin.
   */
  public moveToTrash(item: Omit<RecycledItem, 'id' | 'deletedAt'>): RecycledItem {
    const recycled: RecycledItem = {
      ...item,
      id: `trash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deletedAt: Date.now()
    };

    this.trashedItems.update(current => [recycled, ...current]);
    this.persistBin();

    this.audit.logEvent({
      action: 'RECYCLE_BIN_MOVE',
      category: AuditCategory.FILESYSTEM,
      targetEntity: recycled.name,
      details: `Moved "${recycled.name}" (${recycled.type}) from ${recycled.originalLocation} to Recycling Bin.`
    });

    this.notification.notify({
      title: 'Moved to Recycle Bin',
      message: `"${recycled.name}" was placed in the Recycling Bin.`,
      category: 'task',
      priority: 'normal'
    });

    return recycled;
  }

  /**
   * Restore a single recycled item to its original location.
   */
  public restoreItem(id: string): boolean {
    const item = this.trashedItems().find(i => i.id === id);
    if (!item) return false;

    try {
      if (item.type === 'shortcut' && item.data) {
        this.desktopIcons.addShortcut(item.data as DesktopShortcut);
      } else if (item.type === 'file' && item.data) {
        const inodeData = item.data as VfsInode;
        if (inodeData && typeof inodeData.id === 'number') {
          this.agentFs.restoreFile(inodeData);
        }
      }

      this.trashedItems.update(current => current.filter(i => i.id !== id));
      if (this.selectedItemId() === id) {
        this.selectedItemId.set(null);
      }
      this.persistBin();

      this.audit.logEvent({
        action: 'RECYCLE_BIN_RESTORE',
        category: AuditCategory.FILESYSTEM,
        targetEntity: item.name,
        details: `Restored "${item.name}" (${item.type}) back to ${item.originalLocation}.`
      });

      this.notification.notify({
        title: 'Item Restored',
        message: `"${item.name}" was restored to ${item.originalLocation}.`,
        category: 'update',
        priority: 'normal'
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restore all items in the recycling bin back to their original locations.
   */
  public restoreAll(): number {
    const items = [...this.trashedItems()];
    let restoredCount = 0;

    for (const item of items) {
      if (this.restoreItem(item.id)) {
        restoredCount++;
      }
    }

    if (restoredCount > 0) {
      this.notification.notify({
        title: 'All Items Restored',
        message: `Restored ${restoredCount} items back to their original locations.`,
        category: 'update',
        priority: 'normal'
      });
    }

    return restoredCount;
  }

  /**
   * Permanently purge an item from the recycling bin.
   */
  public deletePermanently(id: string): boolean {
    const item = this.trashedItems().find(i => i.id === id);
    if (!item) return false;

    this.trashedItems.update(current => current.filter(i => i.id !== id));
    if (this.selectedItemId() === id) {
      this.selectedItemId.set(null);
    }
    this.persistBin();

    this.audit.logEvent({
      action: 'RECYCLE_BIN_PERMANENT_DELETE',
      category: AuditCategory.FILESYSTEM,
      targetEntity: item.name,
      details: `Permanently purged "${item.name}" (${item.type}, ${item.sizeBytes} bytes) from Recycling Bin.`
    });

    this.notification.notify({
      title: 'Item Permanently Deleted',
      message: `"${item.name}" was permanently purged from the system.`,
      category: 'security',
      priority: 'normal'
    });

    return true;
  }

  /**
   * Empty the entire recycling bin, permanently purging all items.
   */
  public emptyBin(): number {
    const count = this.itemCount();
    const bytes = this.totalSizeBytes();
    if (count === 0) return 0;

    this.trashedItems.set([]);
    this.selectedItemId.set(null);
    this.persistBin();

    this.audit.logEvent({
      action: 'RECYCLE_BIN_EMPTY',
      category: AuditCategory.FILESYSTEM,
      targetEntity: 'RecycleBin',
      details: `Emptied Recycling Bin. Permanently purged ${count} items (${(bytes / 1024).toFixed(1)} KB freed).`
    });

    this.notification.notify({
      title: 'Recycle Bin Emptied',
      message: `Permanently removed ${count} items. ${(bytes / 1024).toFixed(1)} KB reclaimed.`,
      category: 'update',
      priority: 'normal'
    });

    return count;
  }

  public select(id: string | null): void {
    this.selectedItemId.set(id);
  }
}
