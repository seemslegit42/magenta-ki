import { Injectable, signal, computed, inject } from '@angular/core';
import { AuditLogEntry, AuditCategory, AuditSeverity } from '../models/webos.models';
import { AuthRbacService } from './auth-rbac.service';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private authRbac: AuthRbacService;

  constructor() {
    let resolvedAuth: AuthRbacService | null = null;
    try {
      resolvedAuth = inject(AuthRbacService, { optional: true });
    } catch {
      resolvedAuth = null;
    }
    this.authRbac = resolvedAuth ?? new AuthRbacService();
  }

  public setAuthRbacForTesting(auth: AuthRbacService): void {
    this.authRbac = auth;
  }

  private auditLogs = signal<AuditLogEntry[]>([
    {
      id: 'aud_9001',
      timestamp: Date.now() - 7200000,
      userId: 'usr_admin_01',
      userRole: 'administrator',
      action: 'SYSTEM_BOOT',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      targetEntity: 'kernel:microkernel',
      status: 'success',
      details: 'Desktop microkernel initialized in zoneless Angular Signals mode.',
      ipAddress: '10.240.0.12',
    },
    {
      id: 'aud_9002',
      timestamp: Date.now() - 5400000,
      userId: 'usr_admin_01',
      userRole: 'administrator',
      action: 'AUTH_SESSION_ESTABLISHED',
      category: AuditCategory.AUTH,
      severity: AuditSeverity.INFO,
      targetEntity: 'appwrite:directory',
      status: 'success',
      details: 'SAML 2.0 authentication confirmed for tenant "default_enterprise_corp".',
      ipAddress: '192.168.1.45',
    },
    {
      id: 'aud_9003',
      timestamp: Date.now() - 3600000,
      userId: 'usr_creator_02',
      userRole: 'content_creator',
      action: 'WOPI_LOCK_ACQUIRED',
      category: AuditCategory.WOPI,
      severity: AuditSeverity.INFO,
      targetEntity: 'doc_101',
      status: 'success',
      details: 'Lock token acquired on Q3_Strategic_Enterprise_Roadmap.docx for authoring.',
      ipAddress: '192.168.1.88',
    },
    {
      id: 'aud_9004',
      timestamp: Date.now() - 1800000,
      userId: 'usr_user_03',
      userRole: 'general_user',
      action: 'PERMISSION_BLOCKED',
      category: AuditCategory.RBAC,
      severity: AuditSeverity.SECURITY,
      targetEntity: 'gateway:admin_route',
      status: 'blocked',
      details: 'Unauthorized attempt to modify tenant edge gateway connection routing.',
      ipAddress: '192.168.1.99',
    },
    {
      id: 'aud_9005',
      timestamp: Date.now() - 900000,
      userId: 'usr_creator_02',
      userRole: 'content_creator',
      action: 'AGENTFS_COW_SNAPSHOT',
      category: AuditCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      targetEntity: 'vfs:inode_2',
      status: 'success',
      details: 'Created isolated Copy-on-Write overlay "sandbox_refactor_v1".',
      ipAddress: '192.168.1.88',
    },
  ]);

  public readonly allLogs = computed(() => this.auditLogs());

  public readonly totalCount = computed(() => this.auditLogs().length);

  public readonly securityAlertCount = computed(() =>
    this.auditLogs().filter(l => l.severity === 'security' || l.severity === 'critical').length
  );

  public logEvent(event: {
    action: string;
    category: AuditCategory;
    severity?: AuditSeverity;
    targetEntity?: string;
    status?: 'success' | 'failure' | 'blocked';
    details: string;
  }): AuditLogEntry {
    const user = this.authRbac.currentUser();
    const entry: AuditLogEntry = {
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
      action: event.action,
      category: event.category,
      severity: event.severity || 'info',
      targetEntity: event.targetEntity,
      status: event.status || 'success',
      details: event.details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 100 + 10),
    };

    this.auditLogs.update(logs => [entry, ...logs]);
    return entry;
  }

  public exportAuditLogsJson(): string {
    return JSON.stringify(this.auditLogs(), null, 2);
  }

  public exportAuditLogsCsv(): string {
    const headers = ['ID', 'Timestamp', 'User ID', 'Role', 'Action', 'Category', 'Severity', 'Target Entity', 'Status', 'Details', 'IP Address'];
    const rows = this.auditLogs().map(l => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.userId,
      l.userRole,
      `"${l.action}"`,
      l.category,
      l.severity,
      `"${l.targetEntity || ''}"`,
      l.status,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public clearLogs(): void {
    const user = this.authRbac.currentUser();
    if (user.role !== 'administrator') {
      throw new Error('Only administrators can purge security audit logs.');
    }
    this.auditLogs.set([]);
    this.logEvent({
      action: 'AUDIT_LOG_PURGED',
      category: AuditCategory.SYSTEM,
      severity: 'critical',
      details: `Security audit logs were purged by administrator ${user.name} (${user.id}).`,
    });
  }
}
