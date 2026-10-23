import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { GatewayService } from '../../services/gateway.service';
import { NotificationService } from '../../services/notification.service';
import { AuthRbacService } from '../../services/auth-rbac.service';
import { WindowManagerService } from '../../services/window-manager.service';
import { AuditService } from '../../services/audit.service';
import { UserRole, AuditCategory, AuditSeverity } from '../../models/webos.models';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  template: `
    <header class="h-10 bg-surface border-b border-white/10 px-4 flex items-center justify-between text-xs text-on-surface-variant z-40 select-none relative">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-on-surface font-display font-semibold tracking-[0.12em]">
          <span class="w-2 h-2 rounded-xs bg-magenta" aria-hidden="true"></span>
          <span>Λ Ξ V O S</span>
        </div>

        <div class="hidden md:flex items-center space-x-2 border-l border-white/10 pl-4">
          <span class="material-icons text-xs text-tertiary">cloud_done</span>
          <span>Tenant: <strong class="text-white">{{ tenant().tenantId }}</strong></span>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <button
          class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors"
          (click)="openSecurityAuditApp()"
          title="Open Security Governance & Audit Trail">
          <span class="material-icons text-xs text-magenta">verified_user</span>
          <span class="font-display text-[11px]">Audit & RBAC</span>
          @if (auditService.securityAlertCount() > 0) {
            <span class="w-1.5 h-1.5 rounded-xs bg-magenta-glow" aria-hidden="true"></span>
          }
        </button>

        <div class="relative">
          <button
            class="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors"
            (click)="toggleUserMenu()"
            title="Switch User Identity & Role">
            <span class="material-icons text-xs text-secondary">{{ authRbac.currentUser().avatar }}</span>
            <span class="font-medium text-[11px]">{{ authRbac.currentUser().name.split(' ')[0] }}</span>
            <span
              class="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold"
              [class.bg-magenta/20]="authRbac.currentRole() === 'administrator'"
              [class.text-magenta-glow]="authRbac.currentRole() === 'administrator'"
              [class.bg-secondary/20]="authRbac.currentRole() === 'content_creator'"
              [class.text-secondary]="authRbac.currentRole() === 'content_creator'"
              [class.bg-white/10]="authRbac.currentRole() === 'general_user'"
              [class.text-on-surface-variant]="authRbac.currentRole() === 'general_user'">
              {{ authRbac.currentRole() === 'administrator' ? 'admin' : (authRbac.currentRole() === 'content_creator' ? 'creator' : 'user') }}
            </span>
            <span class="material-icons text-[10px] text-on-surface-variant">expand_more</span>
          </button>

          <!-- User Role Switcher Dropdown Menu -->
          @if (isUserMenuOpen()) {
            <div class="absolute right-0 top-11 w-72 max-w-[calc(100vw-1.5rem)] bg-surface-panel border border-white/10 rounded-xl p-3 z-50 space-y-2">
              <div class="px-2 py-1 border-b border-white/5 flex items-center justify-between">
                <span class="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Switch Identity Profile</span>
                <span class="text-[10px] text-secondary font-mono">RBAC Active</span>
              </div>

              @for (profile of authRbac.allProfiles(); track profile.id) {
                <button
                  class="w-full p-2 rounded-xl text-left transition-all flex items-center justify-between hover:bg-white/10"
                  [class.bg-magenta/15]="authRbac.currentUser().id === profile.id"
                  [class.border]="authRbac.currentUser().id === profile.id"
                  [class.border-magenta/30]="authRbac.currentUser().id === profile.id"
                  (click)="selectUser(profile.id)">
                  <div class="flex items-center space-x-2.5">
                    <span class="material-icons text-base text-secondary">{{ profile.avatar }}</span>
                    <div>
                      <p class="font-display font-semibold text-white text-xs">{{ profile.name }}</p>
                      <p class="text-[10px] text-on-surface-variant">{{ profile.department }}</p>
                    </div>
                  </div>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-white/5 text-white">
                    {{ profile.role }}
                  </span>
                </button>
              }

              <div class="pt-2 border-t border-white/5 text-[10px] text-on-surface-variant px-2 flex items-center justify-between">
                <span>Active Permissions:</span>
                <span class="text-white font-mono font-bold">{{ authRbac.currentUser().permissions.length }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Notification Bell Trigger -->
        <div class="relative">
          <button
            class="relative w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white transition-colors"
            (click)="toggleNotifications()"
            title="Notification Center">
            <span class="material-icons text-sm text-on-surface">notifications</span>
            @if (notificationService.unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-md bg-magenta text-white text-[9px] font-bold flex items-center justify-center">
                {{ notificationService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notification Drawer / Dropdown -->
          @if (isNotificationsOpen()) {
            <div class="absolute right-0 top-11 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface-panel border border-white/10 rounded-xl p-3 z-50 space-y-3">
              <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div class="flex items-center space-x-2 min-w-0">
                  <span class="material-icons text-sm text-magenta-glow">notifications_active</span>
                  <span class="font-display font-semibold text-white text-xs">Notification Center</span>
                  <span class="text-[10px] font-mono text-magenta-glow shrink-0">
                    {{ notificationService.unreadCount() }} unread
                  </span>
                </div>
                <div class="flex items-center space-x-1">
                  <button
                    class="text-[10px] text-secondary hover:underline px-1.5 py-0.5"
                    (click)="notificationService.markAllAsRead()">
                    Mark all read
                  </button>
                  <button
                    class="text-[10px] text-on-surface-variant hover:text-white px-1.5 py-0.5"
                    (click)="notificationService.clearAll()">
                    Clear
                  </button>
                </div>
              </div>

              <!-- Notifications Scroll List -->
              <div class="max-h-72 overflow-y-auto space-y-2">
                @for (notif of notificationService.allNotifications(); track notif.id) {
                  <div
                    class="p-2.5 rounded-xl border transition-all text-xs flex items-start space-x-2.5"
                    [class.bg-white/5]="notif.read"
                    [class.bg-magenta/10]="!notif.read"
                    [class.border-white/5]="notif.read"
                    [class.border-magenta/30]="!notif.read">
                    <span 
                      class="material-icons text-base mt-0.5"
                      [class.text-secondary]="notif.category === 'task'"
                      [class.text-tertiary]="notif.category === 'update'"
                      [class.text-magenta-glow]="notif.category === 'security'"
                      [class.text-primary]="notif.category === 'message'">
                      @switch (notif.category) {
                        @case ('task') { assignment }
                        @case ('update') { update }
                        @case ('security') { security }
                        @case ('message') { chat }
                        @default { info }
                      }
                    </span>

                    <div class="flex-1 overflow-hidden">
                      <div class="flex items-center justify-between">
                        <p class="font-display font-semibold text-white text-[11px] truncate">{{ notif.title }}</p>
                        <span class="text-[9px] text-on-surface-variant font-mono shrink-0 ml-1">
                          {{ notif.timestamp | date:'HH:mm' }}
                        </span>
                      </div>
                      <p class="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{{ notif.message }}</p>
                      @if (notif.sourceApp) {
                        <span class="text-[9px] text-secondary font-mono mt-1 inline-block">via {{ notif.sourceApp }}</span>
                      }
                    </div>

                    @if (!notif.read) {
                      <button 
                        class="text-on-surface-variant hover:text-white"
                        (click)="notificationService.markAsRead(notif.id)"
                        title="Mark as read">
                        <span class="material-icons text-xs">done</span>
                      </button>
                    }
                  </div>
                }

                @if (notificationService.allNotifications().length === 0) {
                  <div class="py-8 text-center text-on-surface-variant">
                    <span class="material-icons text-2xl mb-1 text-on-surface-variant">notifications_paused</span>
                    <p class="text-xs">All clear! No notifications in your queue.</p>
                  </div>
                }
              </div>

              <!-- Test Alert Dispatcher -->
              <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                <span class="text-[10px] text-on-surface-variant">Simulate:</span>
                <div class="flex items-center space-x-1">
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-tertiary"
                    (click)="sendTestNotification('task')">
                    + Task
                  </button>
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-secondary"
                    (click)="sendTestNotification('message')">
                    + Msg
                  </button>
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-magenta-glow"
                    (click)="sendTestNotification('update')">
                    + Update
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Clock -->
        <div class="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white font-mono text-[11px]">
          <span class="material-icons text-xs text-magenta-glow">schedule</span>
          <span>{{ currentTime() }}</span>
        </div>
      </div>
    </header>
  `
})
export class StatusBarComponent implements OnInit, OnDestroy {
  private gateway = inject(GatewayService);
  protected tenant = this.gateway.currentTenant;
  protected notificationService = inject(NotificationService);
  protected authRbac = inject(AuthRbacService);
  protected auditService = inject(AuditService);
  private windowMgr = inject(WindowManagerService);

  protected currentTime = signal('');
  protected isNotificationsOpen = signal(false);
  protected isUserMenuOpen = signal(false);
  protected availableUserRoles: UserRole[] = ['administrator', 'content_creator', 'general_user'];
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  public toggleNotifications(): void {
    this.isNotificationsOpen.update(v => !v);
    if (this.isNotificationsOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  public toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
    if (this.isUserMenuOpen()) {
      this.isNotificationsOpen.set(false);
    }
  }

  public selectUser(userId: string): void {
    const prevUser = this.authRbac.currentUser();
    this.authRbac.switchUser(userId);
    const newUser = this.authRbac.currentUser();
    this.isUserMenuOpen.set(false);

    this.auditService.logEvent({
      action: 'USER_ROLE_SWITCH',
      category: AuditCategory.RBAC,
      severity: AuditSeverity.INFO,
      details: `Switched active session from ${prevUser.name} (${prevUser.role}) to ${newUser.name} (${newUser.role}).`,
    });

    this.notificationService.notify({
      title: 'Active Identity Changed',
      message: `Now operating as ${newUser.name} with '${newUser.role}' capabilities.`,
      category: 'security',
      priority: 'normal',
    });
  }

  public openSecurityAuditApp(): void {
    this.windowMgr.spawnProcess('security-audit', 'Security Governance & Audit Trail', 'verified_user', 'SecurityAuditComponent', 'security');
  }

  public sendTestNotification(type: 'task' | 'message' | 'update'): void {
    if (type === 'task') {
      this.notificationService.notify({
        title: 'New High-Priority Task',
        message: 'Security Sentinel assigned task: "Review libSQL edge replication policy".',
        category: 'task',
        priority: 'high',
        sourceApp: 'Task Manager',
        actionLabel: 'View Task',
      });
    } else if (type === 'message') {
      this.notificationService.notify({
        title: 'Incoming Message',
        message: 'Marcus Vance: "The WOPI collaborative locks are performing under 5ms."',
        category: 'message',
        priority: 'normal',
        sourceApp: 'Messenger',
      });
    } else {
      this.notificationService.notify({
        title: 'System Firmware Update',
        message: 'AgentFS OPFS v2.4 successfully applied copy-on-write patch #882.',
        category: 'update',
        priority: 'normal',
        sourceApp: 'Kernel Daemon',
      });
    }
  }
}
