import { Injectable, signal, computed } from '@angular/core';
import { WopiDocument } from '../models/webos.models';

@Injectable({ providedIn: 'root' })
export class WopiService {
  private documents = signal<Map<string, WopiDocument>>(new Map([
    ['doc_101', {
      fileId: 'doc_101',
      baseFileName: 'Q3_Strategic_Enterprise_Roadmap.docx',
      ownerId: 'system-enterprise-admin',
      size: 14280,
      userId: 'usr-operator',
      userFriendlyName: 'Authenticated Employee',
      version: '2026100901',
      userCanWrite: true,
      supportsUpdate: true,
      supportsLocks: true,
      content: 'lxvOS notes\n\n- Shell host\n- Native Federation\n- Turso + VFS\n- WOPI',
      fileType: 'document'
    }],
    ['doc_102', {
      fileId: 'doc_102',
      baseFileName: 'Global_Turso_Tenants_Q3.xlsx',
      ownerId: 'system-enterprise-admin',
      size: 8940,
      userId: 'usr-operator',
      userFriendlyName: 'Authenticated Employee',
      version: '2026100902',
      userCanWrite: true,
      supportsUpdate: true,
      supportsLocks: true,
      content: 'Tenant ID\tRegion\tStatus\tStorage (MB)\tActive PIDs\tLatency (ms)\ncorp_alpha\tus-east-1\tActive\t1420\t24\t3.8\ncorp_beta\tEU-Central\tActive\t3890\t52\t4.1\ncorp_gamma\tAP-South\tActive\t840\t12\t4.9',
      fileType: 'spreadsheet'
    }],
    ['doc_103', {
      fileId: 'doc_103',
      baseFileName: 'Pitch_Deck.pptx',
      ownerId: 'system-enterprise-admin',
      size: 24500,
      userId: 'usr-operator',
      userFriendlyName: 'Authenticated Employee',
      version: '2026100903',
      userCanWrite: true,
      supportsUpdate: true,
      supportsLocks: true,
      content: 'Slide 1: lxvOS\nSlide 2: Native Federation\nSlide 3: Shell host\nSlide 4: AgentFS & Turso',
      fileType: 'presentation'
    }]
  ]));

  private activeLocks = signal<Map<string, string>>(new Map());

  public readonly allDocuments = computed(() => Array.from(this.documents().values()));

  public getDocuments(): WopiDocument[] {
    return Array.from(this.documents().values());
  }

  public checkFileInfo(fileId: string): WopiDocument | null {
    return this.documents().get(fileId) || null;
  }

  public getFile(fileId: string): string {
    return this.documents().get(fileId)?.content || '';
  }

  public putFile(fileId: string, content: string, lockToken?: string): boolean {
    const doc = this.documents().get(fileId);
    if (!doc) return false;

    const currentLock = this.activeLocks().get(fileId);
    if (currentLock && lockToken && currentLock !== lockToken) {
      throw new Error('Lock contention failure: document is locked by another session.');
    }

    this.documents.update(map => {
      const updated = new Map(map);
      const target = updated.get(fileId);
      if (target) {
        updated.set(fileId, {
          ...target,
          content,
          size: content.length,
          version: String(Date.now())
        });
      }
      return updated;
    });
    return true;
  }

  public acquireLock(fileId: string): string {
    const lock = `lock_${crypto.randomUUID().slice(0, 8)}`;
    this.activeLocks.update(map => new Map(map).set(fileId, lock));
    return lock;
  }

  public releaseLock(fileId: string): void {
    this.activeLocks.update(map => {
      const updated = new Map(map);
      updated.delete(fileId);
      return updated;
    });
  }
}
