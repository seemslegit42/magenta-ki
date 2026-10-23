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
    <header class="h-10 bg-[#0E1015]/95 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between text-xs text-[#8C94A8] z-40 select-none relative">
      <!-- Left: Brand & Tenant Info -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-[#F5FFFA] font-display font-semibold">
          <span class="w-2.5 h-2.5 rounded-full bg-[#E0218A] shadow-[0_0_10px_#E0218A]"></span>
          <span>Verdigris WebOS</span>
          <span class="text-[10px] text-[#20B2AA] bg-[#20B2AA]/10 px-1.5 py-0.5 rounded border border-[#20B2AA]/20 font-mono">VIP v2.4</span>
        </div>
        
        <div class="hidden md:flex items-center space-x-2 border-l border-white/10 pl-4">
          <span class="material-icons text-xs text-[#3EB991]">cloud_done</span>
          <span>Tenant: <strong class="text-white">{{ tenant().tenantId }}</strong></span>
        </div>
      </div>

      <!-- Right: User Identity, Security Sentinel, Notifications & Clock -->
      <div class="flex items-center space-x-3">
        <!-- Security & Audit Quick Launcher -->
        <button
          class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors"
          (click)="openSecurityAuditApp()"
          title="Open Security Governance & Audit Trail">
          <span class="material-icons text-xs text-[#E0218A]">verified_user</span>
          <span class="font-display text-[11px]">Audit & RBAC</span>
          @if (auditService.securityAlertCount() > 0) {
            <span class="w-1.5 h-1.5 rounded-full bg-[#FF2A9D] shadow-[0_0_6px_#FF2A9D]"></span>
          }
        </button>

        <!-- User Role Switcher Dropdown Trigger -->
        <div class="relative">
          <button
            class="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors"
            (click)="toggleUserMenu()"
            title="Switch User Identity & Role">
            <span class="material-icons text-xs text-[#20B2AA]">{{ authRbac.currentUser().avatar }}</span>
            <span class="font-medium text-[11px]">{{ authRbac.currentUser().name.split(' ')[0] }}</span>
            <span
              class="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold"
              [class.bg-[#E0218A]/20]="authRbac.currentRole() === 'administrator'"
              [class.text-[#FF2A9D]]="authRbac.currentRole() === 'administrator'"
              [class.bg-[#20B2AA]/20]="authRbac.currentRole() === 'content_creator'"
              [class.text-[#20B2AA]]="authRbac.currentRole() === 'content_creator'"
              [class.bg-white/10]="authRbac.currentRole() === 'general_user'"
              [class.text-[#8C94A8]]="authRbac.currentRole() === 'general_user'">
              {{ authRbac.currentRole() === 'administrator' ? 'admin' : (authRbac.currentRole() === 'content_creator' ? 'creator' : 'user') }}
            </span>
            <span class="material-icons text-[10px] text-[#8C94A8]">expand_more</span>
          </button>

          <!-- User Role Switcher Dropdown Menu -->
          @if (isUserMenuOpen()) {
            <div class="absolute right-0 top-11 w-72 max-w-[calc(100vw-1.5rem)] bg-[#151922] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 space-y-2">
              <div class="px-2 py-1 border-b border-white/5 flex items-center justify-between">
                <span class="text-[10px] font-mono text-[#8C94A8] uppercase tracking-wider">Switch Identity Profile</span>
                <span class="text-[10px] text-[#20B2AA] font-mono">RBAC Active</span>
              </div>

              @for (profile of authRbac.allProfiles(); track profile.id) {
                <button
                  class="w-full p-2 rounded-xl text-left transition-all flex items-center justify-between hover:bg-white/10"
                  [class.bg-[#E0218A]/15]="authRbac.currentUser().id === profile.id"
                  [class.border]="authRbac.currentUser().id === profile.id"
                  [class.border-[#E0218A]/30]="authRbac.currentUser().id === profile.id"
                  (click)="selectUser(profile.id)">
                  <div class="flex items-center space-x-2.5">
                    <span class="material-icons text-base text-[#20B2AA]">{{ profile.avatar }}</span>
                    <div>
                      <p class="font-display font-semibold text-white text-xs">{{ profile.name }}</p>
                      <p class="text-[10px] text-[#8C94A8]">{{ profile.department }}</p>
                    </div>
                  </div>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-white/5 text-white">
                    {{ profile.role }}
                  </span>
                </button>
              }

              <div class="pt-2 border-t border-white/5 text-[10px] text-[#8C94A8] px-2 flex items-center justify-between">
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
            <span class="material-icons text-sm text-[#F5FFFA]">notifications</span>
            @if (notificationService.unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E0218A] text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_#E0218A]">
                {{ notificationService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notification Drawer / Dropdown -->
          @if (isNotificationsOpen()) {
            <div class="absolute right-0 top-11 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[#151922] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
              <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div class="flex items-center space-x-2">
                  <span class="material-icons text-sm text-[#FF2A9D]">notifications_active</span>
                  <span class="font-display font-semibold text-white text-xs">Notification Center</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E0218A]/20 text-[#FF2A9D] font-mono">
                    {{ notificationService.unreadCount() }} unread
                  </span>
                </div>
                <div class="flex items-center space-x-1">
                  <button
                    class="text-[10px] text-[#20B2AA] hover:underline px-1.5 py-0.5"
                    (click)="notificationService.markAllAsRead()">
                    Mark all read
                  </button>
                  <button
                    class="text-[10px] text-[#8C94A8] hover:text-white px-1.5 py-0.5"
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
                    [class.bg-[#E0218A]/10]="!notif.read"
                    [class.border-white/5]="notif.read"
                    [class.border-[#E0218A]/30]="!notif.read">
                    <span 
                      class="material-icons text-base mt-0.5"
                      [class.text-[#20B2AA]]="notif.category === 'task'"
                      [class.text-[#3EB991]]="notif.category === 'update'"
                      [class.text-[#FF2A9D]]="notif.category === 'security'"
                      [class.text-[#6A0DAD]]="notif.category === 'message'">
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
                        <span class="text-[9px] text-[#8C94A8] font-mono shrink-0 ml-1">
                          {{ notif.timestamp | date:'HH:mm' }}
                        </span>
                      </div>
                      <p class="text-[10px] text-[#8C94A8] mt-0.5 leading-snug">{{ notif.message }}</p>
                      @if (notif.sourceApp) {
                        <span class="text-[9px] text-[#20B2AA] font-mono mt-1 inline-block">via {{ notif.sourceApp }}</span>
                      }
                    </div>

                    @if (!notif.read) {
                      <button 
                        class="text-[#8C94A8] hover:text-white"
                        (click)="notificationService.markAsRead(notif.id)"
                        title="Mark as read">
                        <span class="material-icons text-xs">done</span>
                      </button>
                    }
                  </div>
                }

                @if (notificationService.allNotifications().length === 0) {
                  <div class="py-8 text-center text-[#8C94A8]">
                    <span class="material-icons text-2xl mb-1 text-[#8C94A8]">notifications_paused</span>
                    <p class="text-xs">All clear! No notifications in your queue.</p>
                  </div>
                }
              </div>

              <!-- Test Alert Dispatcher -->
              <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                <span class="text-[10px] text-[#8C94A8]">Simulate:</span>
                <div class="flex items-center space-x-1">
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#3EB991]"
                    (click)="sendTestNotification('task')">
                    + Task
                  </button>
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#20B2AA]"
                    (click)="sendTestNotification('message')">
                    + Msg
                  </button>
                  <button
                    class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#FF2A9D]"
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
          <span class="material-icons text-xs text-[#FF2A9D]">schedule</span>
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
