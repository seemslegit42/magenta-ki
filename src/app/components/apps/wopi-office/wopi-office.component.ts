import { Component, Input, inject, signal } from '@angular/core';
import { WopiService } from '../../../services/wopi.service';
import { AuthRbacService } from '../../../services/auth-rbac.service';
import { AuditService } from '../../../services/audit.service';
import { NotificationService } from '../../../services/notification.service';
import { WopiDocument, AuditCategory, AuditSeverity } from '../../../models/webos.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wopi-office',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#E0218A]">description</span>
            <span>WOPI Office Suite & Collaborative Authoring</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1">Web Application Open Platform Interface (WOPI) protocol with atomic locks, GetFile/PutFile, and real-time co-authoring.</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-[#E0218A]/10 text-[#FF2A9D] border border-[#E0218A]/20 font-mono">
            Role: {{ authRbac.currentRole() }}
          </span>
          <span class="text-xs px-2.5 py-1 rounded-full bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/20 font-mono">
            WOPI Host: Go Engine
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Document Sidebar List -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-3">
          <h3 class="font-display text-sm font-semibold text-white">Enterprise Documents</h3>
          <div class="space-y-2">
            @for (doc of documents; track doc.fileId) {
              <div 
                role="button"
                tabindex="0"
                class="p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 outline-none focus:ring-2 focus:ring-[#E0218A]"
                [class.bg-[#E0218A]/15]="selectedDoc()?.fileId === doc.fileId"
                [class.border-[#E0218A]]="selectedDoc()?.fileId === doc.fileId"
                [class.bg-white/5]="selectedDoc()?.fileId !== doc.fileId"
                [class.border-white/5]="selectedDoc()?.fileId !== doc.fileId"
                (click)="selectDocument(doc)"
                (keydown.enter)="selectDocument(doc)">
                <span class="material-icons text-xl text-[#20B2AA]">
                  @switch (doc.fileType) {
                    @case ('spreadsheet') { table_chart }
                    @case ('presentation') { slides }
                    @default { description }
                  }
                </span>
                <div class="overflow-hidden">
                  <p class="font-display text-xs font-semibold text-white truncate">{{ doc.baseFileName }}</p>
                  <p class="text-[10px] text-[#8C94A8] font-mono">v{{ doc.version }} • {{ doc.size }} B</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Document Editor & WOPI Inspector -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-4 space-y-4 lg:col-span-3">
          @if (selectedDoc(); as doc) {
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="font-display text-base font-semibold text-white">{{ doc.baseFileName }}</h3>
                <p class="text-[11px] text-[#8C94A8] font-mono">Owner: {{ doc.ownerId }} | User: {{ doc.userFriendlyName }}</p>
              </div>
              <div class="flex items-center space-x-2">
                @if (!canEdit()) {
                  <span class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                    READ-ONLY (General User)
                  </span>
                }
                <button
                  class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center space-x-1"
                  [disabled]="!canLock()"
                  [class.opacity-50]="!canLock()"
                  (click)="toggleLock(doc.fileId)">
                  <span class="material-icons text-xs">{{ isLocked() ? 'lock' : 'lock_open' }}</span>
                  <span>{{ isLocked() ? 'Release Lock' : 'Acquire X-WOPI-Lock' }}</span>
                </button>
                <button
                  class="px-3.5 py-1.5 rounded-lg bg-[#E0218A] hover:bg-[#FF2A9D] text-white text-xs font-medium transition-colors flex items-center space-x-1 shadow-lg"
                  [disabled]="!canEdit()"
                  [class.opacity-50]="!canEdit()"
                  (click)="saveChanges(doc.fileId)">
                  <span class="material-icons text-xs">save</span>
                  <span>PutFile Save</span>
                </button>
              </div>
            </div>

            <textarea
              class="w-full h-80 bg-[#0E1015] border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-[#E0218A] leading-relaxed"
              [(ngModel)]="editableContent"
              [disabled]="!canEdit() || (isLocked() && !myLockToken)"></textarea>

            @if (saveMessage()) {
              <div class="p-3 rounded-lg bg-[#3EB991]/10 border border-[#3EB991]/30 text-[#3EB991] text-xs font-mono">
                {{ saveMessage() }}
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class WopiOfficeComponent {
  @Input({ required: true }) pid!: string;
  private wopi = inject(WopiService);
  protected authRbac = inject(AuthRbacService);
  protected auditService = inject(AuditService);
  protected notificationService = inject(NotificationService);

  protected documents: WopiDocument[] = this.wopi.getDocuments();
  protected selectedDoc = signal<WopiDocument | null>(this.documents[0] || null);
  protected editableContent = '';
  protected myLockToken: string | null = null;
  protected saveMessage = signal('');

  constructor() {
    if (this.selectedDoc()) {
      this.editableContent = this.selectedDoc()?.content || '';
    }
  }

  public canEdit(): boolean {
    return this.authRbac.hasPermission('wopi:edit');
  }

  public canLock(): boolean {
    return this.authRbac.hasPermission('wopi:lock');
  }

  public selectDocument(doc: WopiDocument): void {
    this.selectedDoc.set(doc);
    this.editableContent = doc.content || '';
    this.saveMessage.set('');
    this.auditService.logEvent({
      action: 'WOPI_DOCUMENT_INSPECTED',
      category: AuditCategory.WOPI,
      targetEntity: doc.fileId,
      details: `Document "${doc.baseFileName}" opened for viewing.`,
    });
  }

  public isLocked(): boolean {
    return this.myLockToken !== null;
  }

  public toggleLock(fileId: string): void {
    const check = this.authRbac.checkPermission('wopi:lock');
    if (!check.allowed) {
      this.auditService.logEvent({
        action: 'PERMISSION_BLOCKED',
        category: AuditCategory.RBAC,
        severity: AuditSeverity.SECURITY,
        targetEntity: fileId,
        status: 'blocked',
        details: check.reason || 'Unauthorized lock attempt.',
      });
      this.notificationService.notify({
        title: 'Access Denied',
        message: check.reason || 'You lack permission to acquire document locks.',
        category: 'security',
        priority: 'high',
      });
      return;
    }

    if (this.myLockToken) {
      this.wopi.releaseLock(fileId);
      this.myLockToken = null;
      this.saveMessage.set('X-WOPI-Lock released successfully.');
      this.auditService.logEvent({
        action: 'WOPI_LOCK_RELEASED',
        category: AuditCategory.WOPI,
        targetEntity: fileId,
        details: 'Exclusive lock token released for document.',
      });
    } else {
      this.myLockToken = this.wopi.acquireLock(fileId);
      this.saveMessage.set(`Acquired lock token: ${this.myLockToken}`);
      this.auditService.logEvent({
        action: 'WOPI_LOCK_ACQUIRED',
        category: AuditCategory.WOPI,
        targetEntity: fileId,
        details: `Exclusive lock token ${this.myLockToken} acquired.`,
      });
      this.notificationService.notify({
        title: 'Lock Acquired',
        message: `Acquired exclusive edit lock on ${this.selectedDoc()?.baseFileName}.`,
        category: 'lock',
        priority: 'normal',
      });
    }
  }

  public saveChanges(fileId: string): void {
    const check = this.authRbac.checkPermission('wopi:edit');
    if (!check.allowed) {
      this.auditService.logEvent({
        action: 'PERMISSION_BLOCKED',
        category: AuditCategory.RBAC,
        severity: AuditSeverity.SECURITY,
        targetEntity: fileId,
        status: 'blocked',
        details: check.reason || 'Unauthorized save attempt.',
      });
      this.notificationService.notify({
        title: 'Save Forbidden',
        message: check.reason || 'You do not have write access to this document.',
        category: 'security',
        priority: 'high',
      });
      return;
    }

    try {
      this.wopi.putFile(fileId, this.editableContent, this.myLockToken || undefined);
      this.saveMessage.set(`PutFile synchronized successfully at ${new Date().toLocaleTimeString()}`);
      this.auditService.logEvent({
        action: 'WOPI_PUT_FILE_COMMITTED',
        category: AuditCategory.WOPI,
        targetEntity: fileId,
        details: `Updated ${fileId} (${this.editableContent.length} bytes) via PutFile.`,
      });
      this.notificationService.notify({
        title: 'Document Saved',
        message: `${this.selectedDoc()?.baseFileName} saved to edge storage mesh.`,
        category: 'update',
        priority: 'normal',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown save error';
      this.saveMessage.set(`Error: ${errorMessage}`);
      this.auditService.logEvent({
        action: 'WOPI_SAVE_FAILED',
        category: AuditCategory.WOPI,
        severity: AuditSeverity.WARNING,
        targetEntity: fileId,
        status: 'failure',
        details: errorMessage,
      });
    }
  }
}
