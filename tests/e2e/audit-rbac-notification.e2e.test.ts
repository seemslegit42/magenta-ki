import { describe, it, expect } from 'bun:test';
import { AuthRbacService } from '../../ts/apps/host/app/services/auth-rbac.service';
import { AuditService } from '../../ts/apps/host/app/services/audit.service';
import { NotificationService } from '../../ts/apps/host/app/services/notification.service';
import { WopiService } from '../../ts/apps/host/app/services/wopi.service';

describe('E2E: Audit Trail, Notification System & RBAC Governance Flow', () => {
  it('should enforce role boundaries, capture comprehensive audit logs, and trigger real-time notifications', () => {
    // 1. Initialize Core Services
    const auth = new AuthRbacService();
    const audit = new AuditService();
    audit.setAuthRbacForTesting(auth);
    const notifications = new NotificationService();
    const wopi = new WopiService();

    // 2. Administrator Verification
    expect(auth.currentRole()).toBe('administrator');
    expect(auth.hasPermission('rbac:manage')).toBe(true);
    expect(auth.hasPermission('audit:manage')).toBe(true);
    expect(auth.hasPermission('gateway:manage')).toBe(true);

    // Initial audit ledger snapshot
    const initialAuditCount = audit.totalCount();
    expect(initialAuditCount).toBeGreaterThanOrEqual(5);

    // 3. User Role Switch: Switch active session to General User (Sarah Chen)
    auth.switchRole('general_user');
    expect(auth.currentRole()).toBe('general_user');
    expect(auth.currentUser().name).toBe('Sarah Chen');

    // General User has read access to documents
    expect(auth.hasPermission('wopi:read')).toBe(true);
    const docMeta = wopi.checkFileInfo('doc_101')!;
    expect(docMeta).not.toBeNull();

    // Log the read event
    audit.logEvent({
      action: 'WOPI_DOCUMENT_INSPECTED',
      category: 'wopi',
      targetEntity: 'doc_101',
      details: 'General user inspected enterprise roadmap in read-only mode.',
    });

    // 4. RBAC Violation Attempt: General User attempts to acquire exclusive edit lock
    const lockPermissionCheck = auth.checkPermission('wopi:lock');
    expect(lockPermissionCheck.allowed).toBe(false);

    // Security boundary intercepts unauthorized attempt
    const blockedEvent = audit.logEvent({
      action: 'PERMISSION_BLOCKED',
      category: 'rbac',
      severity: 'security',
      targetEntity: 'doc_101',
      status: 'blocked',
      details: lockPermissionCheck.reason || 'General user attempted unauthorized lock acquisition.',
    });

    expect(blockedEvent.status).toBe('blocked');
    expect(blockedEvent.userRole).toBe('general_user');
    expect(blockedEvent.userId).toBe('usr_user_03');
    expect(blockedEvent.severity).toBe('security');

    // Notification system alerts of intercepted privilege attempt
    const alertNotif = notifications.notify({
      title: 'Security Intercept: Unauthorized Action Blocked',
      message: `User ${auth.currentUser().name} was blocked from acquiring document lock on doc_101.`,
      category: 'security',
      priority: 'high',
      sourceApp: 'Security Sentinel',
    });

    expect(alertNotif.category).toBe('security');
    expect(notifications.unreadCount()).toBeGreaterThan(0);
    expect(notifications.toasts().some(t => t.id === alertNotif.id)).toBe(true);

    // 5. User Role Switch: Switch to Content Creator (Marcus Vance)
    auth.switchRole('content_creator');
    expect(auth.currentRole()).toBe('content_creator');
    expect(auth.currentUser().name).toBe('Marcus Vance');

    // Content Creator has lock and edit privileges
    expect(auth.hasPermission('wopi:lock')).toBe(true);
    expect(auth.hasPermission('wopi:edit')).toBe(true);
    // But cannot alter gateway routing or purge audit logs
    expect(auth.hasPermission('gateway:manage')).toBe(false);
    expect(auth.hasPermission('audit:manage')).toBe(false);

    // Content Creator acquires lock and saves document
    const lockToken = wopi.acquireLock('doc_101');
    expect(lockToken.startsWith('lock_')).toBe(true);

    audit.logEvent({
      action: 'WOPI_LOCK_ACQUIRED',
      category: 'wopi',
      targetEntity: 'doc_101',
      details: `Lock token ${lockToken} acquired by Marcus Vance.`,
    });

    const newContent = `${wopi.getFile('doc_101')}\n\n// Strategic edit by Marcus Vance`;
    const saveOk = wopi.putFile('doc_101', newContent, lockToken);
    expect(saveOk).toBe(true);

    audit.logEvent({
      action: 'WOPI_PUT_FILE_COMMITTED',
      category: 'wopi',
      targetEntity: 'doc_101',
      details: 'Document successfully committed via PutFile with valid lock.',
    });

    notifications.notify({
      title: 'Document Saved',
      message: 'Marcus Vance committed revisions to doc_101.',
      category: 'update',
      priority: 'normal',
      sourceApp: 'WOPI Office',
    });

    wopi.releaseLock('doc_101');

    // 6. Administrator Compliance Review & Export
    auth.switchRole('administrator');
    expect(auth.currentRole()).toBe('administrator');

    // Verify Audit Trail Ledger
    expect(audit.totalCount()).toBeGreaterThan(initialAuditCount);
    const recentAudit = audit.allLogs()[0];
    expect(recentAudit).toBeDefined();

    // Export to JSON
    const jsonOutput = audit.exportAuditLogsJson();
    const parsedJson = JSON.parse(jsonOutput);
    expect(parsedJson.length).toBe(audit.totalCount());

    // Export to CSV
    const csvOutput = audit.exportAuditLogsCsv();
    expect(csvOutput).toContain('PERMISSION_BLOCKED');
    expect(csvOutput).toContain('usr_user_03');

    // 7. Notification Preferences Customization
    notifications.updatePreferences({
      desktopToastsEnabled: true,
      soundEnabled: false,
    });
    expect(notifications.currentPreferences().soundEnabled).toBe(false);

    // Dismiss notifications & verify cleanup
    notifications.markAllAsRead();
    expect(notifications.unreadCount()).toBe(0);
  });
});
