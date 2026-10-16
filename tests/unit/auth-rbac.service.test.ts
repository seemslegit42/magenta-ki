import { describe, it, expect, beforeEach } from 'bun:test';
import { AuthRbacService } from '../../src/app/services/auth-rbac.service';

describe('AuthRbacService', () => {
  let service: AuthRbacService;

  beforeEach(() => {
    service = new AuthRbacService();
  });

  it('should initialize with administrator profile by default', () => {
    const user = service.currentUser();
    expect(user.id).toBe('usr_admin_01');
    expect(user.role).toBe('administrator');
    expect(service.currentRole()).toBe('administrator');
    expect(user.permissions).toContain('audit:manage');
    expect(user.permissions).toContain('gateway:manage');
  });

  it('should verify all predefined roles and their descriptions', () => {
    const roles = service.availableRoles.map(r => r.role);
    expect(roles).toContain('administrator');
    expect(roles).toContain('content_creator');
    expect(roles).toContain('general_user');
  });

  it('should switch users by profile ID and adapt permissions', () => {
    // Switch to Content Creator
    service.switchUser('usr_creator_02');
    expect(service.currentUser().name).toBe('Marcus Vance');
    expect(service.currentRole()).toBe('content_creator');
    expect(service.hasPermission('wopi:edit')).toBe(true);
    expect(service.hasPermission('gateway:manage')).toBe(false);

    // Switch to General User
    service.switchUser('usr_user_03');
    expect(service.currentUser().name).toBe('Sarah Chen');
    expect(service.currentRole()).toBe('general_user');
    expect(service.hasPermission('wopi:read')).toBe(true);
    expect(service.hasPermission('wopi:edit')).toBe(false);
    expect(service.hasPermission('wopi:lock')).toBe(false);
  });

  it('should switch role directly using switchRole', () => {
    service.switchRole('general_user');
    expect(service.currentRole()).toBe('general_user');

    service.switchRole('content_creator');
    expect(service.currentRole()).toBe('content_creator');
  });

  it('should check permissions and return informative denial reasons', () => {
    service.switchRole('general_user');

    const allowedCheck = service.checkPermission('wopi:read');
    expect(allowedCheck.allowed).toBe(true);

    const deniedCheck = service.checkPermission('gateway:manage');
    expect(deniedCheck.allowed).toBe(false);
    expect(deniedCheck.reason).toContain('gateway:manage');
    expect(deniedCheck.reason).toContain('general_user');
  });

  it('should allow updating user roles dynamically', () => {
    service.updateUserRole('usr_user_03', 'content_creator');
    const updated = service.allProfiles().find(p => p.id === 'usr_user_03')!;
    expect(updated.role).toBe('content_creator');
    expect(updated.permissions).toContain('wopi:edit');
  });
});
