import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AgentFSService } from '../../../services/agentfs.service';
import { WopiService } from '../../../services/wopi.service';
import { AuditService } from '../../../services/audit.service';
import { NotificationService } from '../../../services/notification.service';
import { VfsInode, WopiDocument, AuditCategory } from '../../../models/webos.models';
import { RecycleBinService } from '../../../services/recycle-bin.service';
import { WindowManagerService } from '../../../services/window-manager.service';

export interface ManagedFileItem {
  uid: string;
  name: string;
  type: 'document' | 'code' | 'json' | 'text' | 'folder';
  size: number;
  mtime: number;
  content: string;
  source: 'agentfs' | 'wopi';
  originalId: string | number;
}

@Component({
  selector: 'app-agentfs-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
  template: `
    <div class="flex flex-col h-full space-y-4 font-['Lexend'] text-[#F5FFFA] p-1">
      <!-- Explorer Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <h2 class="font-['Comfortaa'] text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
            <mat-icon class="text-[#20B2AA]">folder_open</mat-icon>
            <span>OS File Explorer & Document Manager</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-0.5">
            View, edit, and save document files, markdown notes, code blocks, and SQLite VFS inodes directly.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            (click)="openNewFileDialog()">
            <mat-icon class="text-xs">note_add</mat-icon>
            <span>New File</span>
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-[#20B2AA] hover:bg-[#3EB991] text-[#00201E] text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer shadow-md"
            (click)="createSnapshot()">
            <mat-icon class="text-xs">camera</mat-icon>
            <span>CoW Snapshot</span>
          </button>
        </div>
      </header>

      <!-- Search & Filter Bar -->
      <div class="flex items-center justify-between gap-3 bg-[#151922] border border-white/10 rounded-xl p-2.5">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94A8] text-sm">search</mat-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search files by name or content..."
            class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white placeholder-[#8C94A8] focus:outline-none focus:border-[#20B2AA]"
          />
        </div>
        <div class="flex items-center space-x-1.5 text-xs">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedFilter === 'all'"
            [class.text-[#0E1015]]="selectedFilter === 'all'"
            [class.border-[#20B2AA]]="selectedFilter === 'all'"
            [class.bg-white/5]="selectedFilter !== 'all'"
            [class.text-[#8C94A8]]="selectedFilter !== 'all'"
            [class.border-white/10]="selectedFilter !== 'all'"
            (click)="selectedFilter = 'all'">
            All
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedFilter === 'document'"
            [class.text-[#0E1015]]="selectedFilter === 'document'"
            [class.border-[#20B2AA]]="selectedFilter === 'document'"
            [class.bg-white/5]="selectedFilter !== 'document'"
            [class.text-[#8C94A8]]="selectedFilter !== 'document'"
            [class.border-white/10]="selectedFilter !== 'document'"
            (click)="selectedFilter = 'document'">
            Docs
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
            [class.bg-[#20B2AA]]="selectedFilter === 'code'"
            [class.text-[#0E1015]]="selectedFilter === 'code'"
            [class.border-[#20B2AA]]="selectedFilter === 'code'"
            [class.bg-white/5]="selectedFilter !== 'code'"
            [class.text-[#8C94A8]]="selectedFilter !== 'code'"
            [class.border-white/10]="selectedFilter !== 'code'"
            (click)="selectedFilter = 'code'">
            Code
          </button>
        </div>
      </div>

      <!-- Main Split View: File List & Editor / Previewer -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[380px]">
        <!-- File Tree Sidebar (4 cols) -->
        <div class="lg:col-span-4 bg-[#151922] border border-white/10 rounded-xl p-3 flex flex-col space-y-2 overflow-y-auto max-h-[460px] lg:max-h-none">
          <div class="flex items-center justify-between text-xs text-[#8C94A8] px-1 font-mono">
            <span>NAME / TYPE</span>
            <span>SIZE</span>
          </div>
          <div class="space-y-1.5">
            @for (file of filteredFiles(); track file.uid) {
              <div
                role="button"
                tabindex="0"
                class="p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group outline-none focus:ring-1 focus:ring-[#20B2AA]"
                [class.bg-[#20B2AA]/15]="selectedFile()?.uid === file.uid"
                [class.border-[#20B2AA]]="selectedFile()?.uid === file.uid"
                [class.bg-white/5]="selectedFile()?.uid !== file.uid"
                [class.border-white/5]="selectedFile()?.uid !== file.uid"
                [class.hover:border-white/20]="selectedFile()?.uid !== file.uid"
                (click)="selectFile(file)"
                (keydown.enter)="selectFile(file)">
                <div class="flex items-center space-x-2.5 overflow-hidden">
                  <mat-icon class="text-sm shrink-0"
                    [class.text-[#3EB991]]="file.type === 'document'"
                    [class.text-[#20B2AA]]="file.type === 'code'"
                    [class.text-[#E0218A]]="file.type === 'json'"
                    [class.text-amber-400]="file.type === 'text'">
                    @switch (file.type) {
                      @case ('document') { description }
                      @case ('code') { code }
                      @case ('json') { data_object }
                      @default { insert_drive_file }
                    }
                  </mat-icon>
                  <div class="overflow-hidden">
                    <p class="font-display text-xs font-semibold text-white truncate">{{ file.name }}</p>
                    <p class="text-[10px] text-[#8C94A8] font-mono capitalize">{{ file.source }} • {{ file.type }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                  <span class="text-[10px] text-[#8C94A8] font-mono">{{ file.size }} B</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- File Editor & Inspector Panel (8 cols) -->
        <div class="lg:col-span-8 bg-[#151922] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-4">
          @if (selectedFile(); as file) {
            <div class="space-y-3 flex-1 flex flex-col">
              <!-- Header with File Info & Save Action -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="font-display text-sm font-semibold text-white">{{ file.name }}</h3>
                    @if (isDirty()) {
                      <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                        Modified (Unsaved)
                      </span>
                    }
                  </div>
                  <p class="text-[11px] text-[#8C94A8] font-mono mt-0.5">
                    Storage: <span class="uppercase text-white font-semibold">{{ file.source }}</span> | Last Modified: {{ file.mtime | date:'medium' }}
                  </p>
                </div>

                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/30 text-[#FF4D6D] text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    (click)="moveFileToTrash(file)">
                    <mat-icon class="text-xs">delete_outline</mat-icon>
                    <span>Move to Trash</span>
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                    (click)="downloadFile(file)">
                    <mat-icon class="text-xs">download</mat-icon>
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    class="px-3.5 py-1.5 rounded-lg bg-[#20B2AA] hover:bg-[#3EB991] text-[#00201E] text-xs font-bold transition-colors flex items-center space-x-1 shadow-lg cursor-pointer disabled:opacity-50"
                    [disabled]="!isDirty()"
                    (click)="saveFile()">
                    <mat-icon class="text-xs">save</mat-icon>
                    <span>Save File</span>
                  </button>
                </div>
              </div>

              <!-- Editable Textarea / Code Area -->
              <div class="flex-1 flex flex-col space-y-1">
                <textarea
                  class="w-full h-72 sm:h-80 bg-[#0E1015] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#20B2AA] leading-relaxed resize-none flex-1"
                  [(ngModel)]="editableContent"
                  (input)="onContentChange()"></textarea>
                <div class="flex items-center justify-between text-[10px] text-[#8C94A8] font-mono px-1">
                  <span>Characters: {{ editableContent.length }} | Lines: {{ editableContent.split('\\n').length }}</span>
                  @if (saveMessage()) {
                    <span class="text-[#3EB991] font-semibold">{{ saveMessage() }}</span>
                  }
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
              <mat-icon class="text-4xl text-[#8C94A8] mb-2">folder_zip</mat-icon>
              <p class="text-sm font-semibold text-white">No file selected</p>
              <p class="text-xs text-[#8C94A8] mt-1">Select a file from the left explorer tree to view, edit, and save its contents.</p>
            </div>
          }

          <!-- Tool Audit & System Footer -->
          <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8C94A8]">
            <span class="font-mono">AgentFS VFS & WOPI Mesh Active</span>
            <button
              type="button"
              (click)="openRecycleBin()"
              class="flex items-center space-x-1 text-[#FF4D6D] hover:underline cursor-pointer font-mono text-[11px]">
              <mat-icon class="text-xs">delete_outline</mat-icon>
              <span>Recycle Bin ({{ recycleBin.itemCount() }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- New File Modal Dialog -->
      @if (showNewFileDialog) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div class="bg-[#151922] border border-white/15 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 class="font-display text-base font-bold text-white flex items-center space-x-2">
              <mat-icon class="text-[#20B2AA]">note_add</mat-icon>
              <span>Create New Document File</span>
            </h3>
            <div class="space-y-3">
              <label class="block text-xs text-[#8C94A8] font-mono">
                File Name
                <input
                  type="text"
                  [(ngModel)]="newFileName"
                  placeholder="e.g. project_notes.md"
                  class="w-full mt-1 px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white focus:outline-none focus:border-[#20B2AA]"
                />
              </label>
              <label class="block text-xs text-[#8C94A8] font-mono">
                File Type / Format
                <select
                  [(ngModel)]="newFileType"
                  class="w-full mt-1 px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white focus:outline-none focus:border-[#20B2AA]">
                  <option value="document">Markdown Document (.md)</option>
                  <option value="code">Source Code (.ts / .py)</option>
                  <option value="json">JSON Configuration (.json)</option>
                  <option value="text">Plain Text (.txt)</option>
                </select>
              </label>
              <label class="block text-xs text-[#8C94A8] font-mono">
                Initial Content
                <textarea
                  [(ngModel)]="newFileContent"
                  rows="4"
                  placeholder="Enter initial document content..."
                  class="w-full mt-1 px-3 py-2 rounded-lg bg-[#0E1015] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#20B2AA]"></textarea>
              </label>
            </div>
            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                class="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
                (click)="showNewFileDialog = false">
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-[#20B2AA] hover:bg-[#3EB991] text-[#00201E] text-xs font-bold shadow-md cursor-pointer"
                (click)="createNewFile()">
                Create & Save
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AgentFsExplorerComponent {
  @Input({ required: true }) pid!: string;

  private agentFs = inject(AgentFSService);
  private wopi = inject(WopiService);
  private auditService = inject(AuditService);
  private notificationService = inject(NotificationService);
  protected readonly recycleBin = inject(RecycleBinService);
  private windowMgr = inject(WindowManagerService);

  protected searchQuery = '';
  protected selectedFilter: 'all' | 'document' | 'code' | 'json' = 'all';

  protected showNewFileDialog = false;
  protected newFileName = '';
  protected newFileType: 'document' | 'code' | 'json' | 'text' = 'document';
  protected newFileContent = '';

  protected selectedFile = signal<ManagedFileItem | null>(null);
  protected editableContent = '';
  protected isDirty = signal(false);
  protected saveMessage = signal('');

  // Combined unified file list from AgentFS and WOPI
  protected filesList = computed<ManagedFileItem[]>(() => {
    const list: ManagedFileItem[] = [];

    // 1. AgentFS Inodes
    const inodesMap = this.agentFs.allInodes()();
    inodesMap.forEach((inode: VfsInode, id: number) => {
      const name = inode.name || (id === 2 ? 'workspace.md' : (id === 3 ? 'config.json' : `inode_${id}.txt`));
      let type: ManagedFileItem['type'] = 'text';
      if (name.endsWith('.md') || id === 2) type = 'document';
      else if (name.endsWith('.json') || id === 3) type = 'json';
      else if (name.endsWith('.ts') || name.endsWith('.go')) type = 'code';

      list.push({
        uid: `agentfs_${id}`,
        name,
        type,
        size: inode.size || (inode.data?.length || 0),
        mtime: inode.mtime || Date.now(),
        content: inode.data || '',
        source: 'agentfs',
        originalId: id
      });
    });

    // 2. WOPI Documents
    const wopiDocs = this.wopi.allDocuments();
    wopiDocs.forEach((doc: WopiDocument) => {
      let type: ManagedFileItem['type'] = 'document';
      if (doc.baseFileName.endsWith('.xlsx') || doc.fileType === 'spreadsheet') type = 'json';
      else if (doc.baseFileName.endsWith('.pptx')) type = 'document';

      list.push({
        uid: `wopi_${doc.fileId}`,
        name: doc.baseFileName,
        type,
        size: doc.size || (doc.content?.length || 0),
        mtime: doc.updatedAt || Date.now(),
        content: doc.content || '',
        source: 'wopi',
        originalId: doc.fileId
      });
    });

    return list;
  });

  protected filteredFiles = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    const filter = this.selectedFilter;
    return this.filesList().filter(file => {
      const matchFilter = filter === 'all' || file.type === filter || (filter === 'document' && file.type === 'document');
      const matchQuery = !query || file.name.toLowerCase().includes(query) || file.content.toLowerCase().includes(query);
      return matchFilter && matchQuery;
    });
  });

  constructor() {
    const files = this.filesList();
    if (files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  public selectFile(file: ManagedFileItem): void {
    this.selectedFile.set(file);
    this.editableContent = file.content;
    this.isDirty.set(false);
    this.saveMessage.set('');
  }

  public onContentChange(): void {
    const cur = this.selectedFile();
    if (cur) {
      this.isDirty.set(this.editableContent !== cur.content);
    }
  }

  public saveFile(): void {
    const file = this.selectedFile();
    if (!file) return;

    try {
      if (file.source === 'agentfs') {
        this.agentFs.writeFile(Number(file.originalId), this.editableContent);
      } else {
        this.wopi.putFile(String(file.originalId), this.editableContent);
      }

      // Update local selected file content
      const updated = { ...file, content: this.editableContent, size: this.editableContent.length, mtime: Date.now() };
      this.selectedFile.set(updated);
      this.isDirty.set(false);
      this.saveMessage.set('File saved successfully.');

      this.auditService.logEvent({
        action: 'FILE_MANAGER_SAVE',
        category: AuditCategory.FILESYSTEM,
        targetEntity: file.name,
        details: `Saved ${file.name} (${file.source}) with ${this.editableContent.length} bytes.`,
      });

      this.notificationService.notify({
        title: 'File Saved',
        message: `${file.name} successfully saved to ${file.source.toUpperCase()} storage.`,
        category: 'update',
        priority: 'normal',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown save error';
      this.saveMessage.set(`Error: ${msg}`);
      this.notificationService.notify({
        title: 'Save Failed',
        message: msg,
        category: 'security',
        priority: 'high',
      });
    }
  }

  public openNewFileDialog(): void {
    this.newFileName = '';
    this.newFileContent = '# New Document\n\nEnter content here...';
    this.newFileType = 'document';
    this.showNewFileDialog = true;
  }

  public createNewFile(): void {
    if (!this.newFileName.trim()) return;
    const name = this.newFileName.trim();
    const content = this.newFileContent;
    const newInodeId = Math.floor(Math.random() * 90000) + 100;

    this.agentFs.writeFile(newInodeId, content);
    this.showNewFileDialog = false;

    this.auditService.logEvent({
      action: 'FILE_MANAGER_CREATE',
      category: AuditCategory.FILESYSTEM,
      targetEntity: name,
      details: `Created new file ${name} in AgentFS.`,
    });

    this.notificationService.notify({
      title: 'File Created',
      message: `Created new file "${name}" successfully.`,
      category: 'task',
      priority: 'normal',
    });

    // Select newly created file
    const newFile: ManagedFileItem = {
      uid: `agentfs_${newInodeId}`,
      name,
      type: this.newFileType,
      size: content.length,
      mtime: Date.now(),
      content,
      source: 'agentfs',
      originalId: newInodeId
    };
    this.selectFile(newFile);
  }

  public downloadFile(file: ManagedFileItem): void {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);

    this.notificationService.notify({
      title: 'File Downloaded',
      message: `Downloaded ${file.name} to local device.`,
      category: 'update',
      priority: 'normal',
    });
  }

  public async createSnapshot(): Promise<void> {
    await this.agentFs.executeMonitoredTool('cow_snapshot_create', { sandbox: 'user_overlay' }, async () => {
      return this.agentFs.createCowSnapshot('workspace_overlay');
    });
    this.notificationService.notify({
      title: 'CoW Snapshot Created',
      message: 'Copy-on-Write snapshot successfully generated on AgentFS.',
      category: 'system',
      priority: 'normal',
    });
  }

  public moveFileToTrash(file: ManagedFileItem): void {
    if (file.source === 'agentfs') {
      const deleted = this.agentFs.deleteFile(Number(file.originalId));
      this.recycleBin.moveToTrash({
        name: file.name,
        type: file.type === 'document' ? 'document' : 'file',
        icon: file.type === 'document' ? 'description' : (file.type === 'code' ? 'code' : 'text_snippet'),
        originalLocation: `AgentFS Inode #${file.originalId}`,
        sizeBytes: file.size,
        data: deleted || { id: Number(file.originalId), name: file.name, data: file.content, size: file.size, mtime: file.mtime, mode: 33188 }
      });
    } else {
      this.recycleBin.moveToTrash({
        name: file.name,
        type: 'document',
        icon: 'description',
        originalLocation: `WOPI Document /${file.name}`,
        sizeBytes: file.size,
        data: { id: file.originalId, name: file.name, content: file.content, size: file.size }
      });
    }
    this.selectedFile.set(null);
  }

  public openRecycleBin(): void {
    this.windowMgr.openApp({
      id: 'recycle-bin',
      title: 'Recycle Bin',
      icon: 'delete',
      entryComponent: 'RecycleBinComponent',
      category: 'system'
    });
  }
}
