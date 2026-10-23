import { Injectable, signal, computed } from '@angular/core';
import { UserProfile, UserRole, Permission } from '../models/webos.models';

const ADMIN_PERMISSIONS: Permission[] = [
  'audit:read',
  'audit:export',
  'audit:manage',
  'gateway:manage',
  'gateway:query',
  'wopi:read',
  'wopi:edit',
  'wopi:lock',
  'agentfs:read',
  'agentfs:write',
  'agentfs:snapshot',
  'process:spawn',
  'process:kill',
  'settings:manage',
  'rbac:manage',
  'database:read',
  'database:create',
  'database:manage',
];

const CREATOR_PERMISSIONS: Permission[] = [
  'wopi:read',
  'wopi:edit',
  'wopi:lock',
  'agentfs:read',
  'agentfs:write',
  'agentfs:snapshot',
  'process:spawn',
  'database:read',
  'database:create',
];

const GENERAL_PERMISSIONS: Permission[] = [
  'wopi:read',
  'agentfs:read',
  'process:spawn',
  'database:read',
];

@Injectable({ providedIn: 'root' })
export class AuthRbacService {
  private profiles = signal<UserProfile[]>([
    {
      id: 'usr_admin_01',
      name: 'Elena Rostova',
      email: 'elena@lxvos.local',
      role: 'administrator',
      avatar: 'shield',
      department: 'Platform Engineering & SecOps',
      permissions: ADMIN_PERMISSIONS,
    },
    {
      id: 'usr_creator_02',
      name: 'Marcus Vance',
      email: 'marcus@lxvos.local',
      role: 'content_creator',
      avatar: 'palette',
      department: 'Digital Strategy & Content Ops',
      permissions: CREATOR_PERMISSIONS,
    },
    {
      id: 'usr_user_03',
      name: 'Sarah Chen',
      email: 'sarah@lxvos.local',
      role: 'general_user',
      avatar: 'person',
      department: 'Business Analytics & Audit',
      permissions: GENERAL_PERMISSIONS,
    },
  ]);

  private activeUserId = signal<string>('usr_admin_01');

  public readonly allProfiles = computed(() => this.profiles());

  public readonly currentUser = computed(() => {
    const active = this.profiles().find(p => p.id === this.activeUserId());
    return active || this.profiles()[0];
  });

  public readonly currentRole = computed(() => this.currentUser().role);

  public readonly availableRoles: { role: UserRole; title: string; description: string; badgeColor: string }[] = [
    {
      role: 'administrator',
      title: 'Administrator',
      description: 'Unrestricted root authority: gateway routing, audit exports, IAM governance, security policies.',
      badgeColor: '#E0218A',
    },
    {
      role: 'content_creator',
      title: 'Content Creator',
      description: 'Authoring privileges: WOPI document write/locks, AgentFS file editing, sandboxed executions.',
      badgeColor: '#20B2AA',
    },
    {
      role: 'general_user',
      title: 'General User',
      description: 'View-only access: inspect shared documents, run terminal diagnostics without overrides.',
      badgeColor: '#8C94A8',
    },
  ];

  public switchUser(userId: string): void {
    const target = this.profiles().find(p => p.id === userId);
    if (target) {
      this.activeUserId.set(target.id);
    }
  }

  public switchRole(role: UserRole): void {
    const target = this.profiles().find(p => p.role === role);
    if (target) {
      this.activeUserId.set(target.id);
    }
  }

  public hasPermission(permission: Permission): boolean {
    return this.currentUser().permissions.includes(permission);
  }

  public checkPermission(permission: Permission): { allowed: boolean; reason?: string } {
    if (this.hasPermission(permission)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Action requires '${permission}' permission which is restricted for role '${this.currentRole()}'.`,
    };
  }

  public updateUserRole(userId: string, newRole: UserRole): void {
    this.profiles.update(list =>
      list.map(user => {
        if (user.id === userId) {
          let perms: Permission[];
          switch (newRole) {
            case 'administrator':
              perms = ADMIN_PERMISSIONS;
              break;
            case 'content_creator':
              perms = CREATOR_PERMISSIONS;
              break;
            default:
              perms = GENERAL_PERMISSIONS;
          }
          return { ...user, role: newRole, permissions: perms };
        }
        return user;
      })
    );
  }
}
