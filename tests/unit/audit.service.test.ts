import { describe, it, expect, beforeEach } from 'bun:test';
import { AuditService } from '../../src/app/services/audit.service';
import { AuthRbacService } from '../../src/app/services/auth-rbac.service';

describe('AuditService', () => {
  let auditService: AuditService;
  let authService: AuthRbacService;

  beforeEach(() => {
    authService = new AuthRbacService();
    auditService = new AuditService();
    auditService.setAuthRbacForTesting(authService);
  });

  it('should initialize with default critical audit events', () => {
    const logs = auditService.allLogs();
    expect(logs.length).toBeGreaterThanOrEqual(5);
    expect(auditService.totalCount()).toBe(logs.length);

    const actions = logs.map(l => l.action);
    expect(actions).toContain('SYSTEM_BOOT');
    expect(actions).toContain('AUTH_SESSION_ESTABLISHED');
    expect(actions).toContain('PERMISSION_BLOCKED');
  });

  it('should log a new user action with active user details and timestamp', () => {
    authService.switchRole('content_creator');
    const initialCount = auditService.totalCount();

    const entry = auditService.logEvent({
      action: 'WOPI_DOCUMENT_SAVED',
      category: 'wopi',
      severity: 'info',
      targetEntity: 'doc_101',
      details: 'Saved updated budget spreadsheet.',
    });

    expect(entry.id.startsWith('aud_')).toBe(true);
    expect(entry.userRole).toBe('content_creator');
    expect(entry.userId).toBe('usr_creator_02');
    expect(entry.action).toBe('WOPI_DOCUMENT_SAVED');
    expect(entry.status).toBe('success');
    expect(auditService.totalCount()).toBe(initialCount + 1);
  });

  it('should correctly count security and critical alerts', () => {
    const initialAlerts = auditService.securityAlertCount();

    auditService.logEvent({
      action: 'TAMPER_ATTEMPT',
      category: 'rbac',
      severity: 'security',
      details: 'Illegal privilege escalation intercepted.',
    });

    expect(auditService.securityAlertCount()).toBe(initialAlerts + 1);
  });

  it('should export audit trail in valid JSON format', () => {
    const jsonStr = auditService.exportAuditLogsJson();
    expect(jsonStr).toBeDefined();

    const parsed = JSON.parse(jsonStr);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(auditService.totalCount());
    expect(parsed[0].id).toBeDefined();
  });

  it('should export audit trail in formatted CSV with headers', () => {
    const csvStr = auditService.exportAuditLogsCsv();
    expect(csvStr).toContain('ID,Timestamp,User ID,Role,Action,Category,Severity,Target Entity,Status,Details,IP Address');
    expect(csvStr.split('\n').length).toBeGreaterThan(5);
  });

  it('should allow administrator to clear logs and record purge action', () => {
    authService.switchRole('administrator');
    auditService.clearLogs();

    // After clear, exactly one AUDIT_LOG_PURGED entry should be created
    expect(auditService.totalCount()).toBe(1);
    expect(auditService.allLogs()[0].action).toBe('AUDIT_LOG_PURGED');
    expect(auditService.allLogs()[0].severity).toBe('critical');
  });

  it('should prevent non-administrator from clearing audit logs', () => {
    authService.switchRole('general_user');

    expect(() => {
      auditService.clearLogs();
    }).toThrow('Only administrators can purge security audit logs.');
  });
});
