import { Component, ChangeDetectionStrategy, input, inject, signal, computed } from '@angular/core';
import { AgentFSService } from '../../../services/agentfs.service';
import { DatePipe } from '@angular/common';
import { VfsInode } from '../../../models/webos.models';

@Component({
  selector: 'app-agentfs-explorer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-secondary">folder_special</span>
            <span>AgentFS Virtual Filesystem</span>
          </h2>
          <p class="text-xs text-on-surface-variant mt-1">SQLite/OPFS sandboxed filesystem with Copy-on-Write (CoW) snapshots & append-only tool audit logs.</p>
        </div>
        <button
          class="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-on-tertiary text-xs font-semibold transition-colors flex items-center space-x-1"
          (click)="createSnapshot()">
          <span class="material-icons text-xs">camera</span>
          <span>Create CoW Snapshot</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Inodes Tree -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-4 space-y-3">
          <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
            <span class="material-icons text-xs text-magenta">dns</span>
            <span>Filesystem Inodes (SQLite)</span>
          </h3>
          <div class="space-y-2">
            @for (entry of inodesList(); track entry[0]) {
              <div 
                role="button"
                tabindex="0"
                class="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between outline-none focus:ring-2 focus:ring-magenta"
                (click)="selectedInode.set(entry[1])"
                (keydown.enter)="selectedInode.set(entry[1])">
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-xs text-tertiary">
                    {{ entry[1].mode === 16877 ? 'folder' : 'insert_drive_file' }}
                  </span>
                  <span class="font-mono text-xs text-white">inode_#{{ entry[0] }}</span>
                </div>
                <span class="text-[10px] text-on-surface-variant">{{ entry[1].size }} B</span>
              </div>
            }
          </div>
        </div>

        <!-- Inode Content Editor / Inspector -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-4 space-y-3 lg:col-span-2">
          <h3 class="font-display text-sm font-semibold text-white flex items-center space-x-2">
            <span class="material-icons text-xs text-magenta-glow">code</span>
            <span>Inode Data Payload & Tool Audit Logs</span>
          </h3>

          @if (selectedInode(); as node) {
            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs text-on-surface-variant bg-white/5 p-2 rounded">
                <span>Mode: {{ node.mode }}</span>
                <span>Modified: {{ node.mtime | date:'medium' }}</span>
              </div>
              <textarea
                class="w-full h-36 bg-surface border border-white/10 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-magenta"
                [value]="node.data || ''"
                (input)="updateNodeData($event)"></textarea>
            </div>
          }

          <div class="mt-6 pt-4 border-t border-white/10 space-y-2">
            <h4 class="font-display text-xs font-semibold text-white">Append-Only Tool Execution Log (tool_calls)</h4>
            <div class="max-h-48 overflow-y-auto space-y-2">
              @for (call of toolCalls()(); track call.id) {
                <div class="p-2 rounded bg-white/5 border border-white/5 text-[11px] font-mono flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 rounded-full" [class.bg-tertiary]="call.completedAt" [class.bg-amber-400]="!call.completedAt"></span>
                    <strong class="text-white">{{ call.toolName }}</strong>
                    <span class="text-on-surface-variant">({{ call.id }})</span>
                  </div>
                  <span class="text-on-surface-variant">{{ call.startedAt | date:'mediumTime' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AgentFsExplorerComponent {
  readonly pid = input.required<string>();
  private agentFs = inject(AgentFSService);

  protected inodesList = computed(() => Array.from(this.agentFs.allInodes()().entries()));
  protected toolCalls = this.agentFs.allToolCalls;
  protected selectedInode = signal<VfsInode | null>(null);

  constructor() {
    const entries = Array.from(this.agentFs.allInodes()().values());
    if (entries.length > 0) {
      this.selectedInode.set(entries[1] || entries[0]);
    }
  }

  public updateNodeData(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    const node = this.selectedInode();
    if (node) {
      this.agentFs.writeFile(Number(node.id), val);
      this.selectedInode.set({ ...node, data: val, size: val.length });
    }
  }

  public async createSnapshot(): Promise<void> {
    await this.agentFs.executeMonitoredTool('cow_snapshot_create', { sandbox: 'user_overlay' }, async () => {
      return this.agentFs.createCowSnapshot('workspace_overlay');
    });
  }
}
