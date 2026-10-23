import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { AuthRbacService } from '../../../services/auth-rbac.service';
import { AuditService } from '../../../services/audit.service';
import { UserRole, AuditCategory, AuditSeverity } from '../../../models/webos.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#20B2AA]">settings</span>
            <span>Verdigris System Settings & Preferences</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1">Configure notification alerts, role governance, syncopated UI rhythm cadence, and security isolation.</p>
        </div>
        <span class="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[#20B2AA]">
          Role: {{ authRbac.currentRole() }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 1. Notification Preferences -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <div class="flex items-center space-x-2">
              <span class="material-icons text-sm text-[#FF2A9D]">notifications</span>
              <h3 class="font-display text-sm font-semibold text-white">Notification Alert Preferences</h3>
            </div>
            <button
              class="text-[10px] text-[#20B2AA] hover:underline"
              (click)="sendSampleToast()">
              Test Alert
            </button>
          </div>

          <div class="space-y-3">
            <label class="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <p class="font-display text-xs font-semibold text-white">Desktop Popup Toasts</p>
                <p class="text-[10px] text-[#8C94A8]">Show ephemeral floating notification cards in top-right screen corner</p>
              </div>
              <input
                type="checkbox"
                class="accent-[#E0218A] w-4 h-4 cursor-pointer"
                [checked]="notificationService.currentPreferences().desktopToastsEnabled"
                (change)="toggleDesktopToasts($event)" />
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <p class="font-display text-xs font-semibold text-white">Audio & Sonic Feedback</p>
                <p class="text-[10px] text-[#8C94A8]">Harmonic chime for notifications, task events and locks</p>
              </div>
              <input
                type="checkbox"
                class="accent-[#E0218A] w-4 h-4 cursor-pointer"
                [checked]="notificationService.currentPreferences().soundEnabled"
                (change)="toggleSound($event)" />
            </label>

            <!-- Channel Subscriptions -->
            <div class="pt-2">
              <p class="text-xs font-display font-semibold text-[#8C94A8] mb-2">Category Subscriptions</p>
              <div class="space-y-2 text-xs">
                <label class="flex items-center justify-between p-2 rounded bg-[#0E1015] border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-[#20B2AA]">assignment</span>
                    <span>Task Assignments & Mentions</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-[#E0218A] cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.task"
                    (change)="toggleCategory('task', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-[#0E1015] border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-[#6A0DAD]">chat</span>
                    <span>Direct Messages & Chat Alerts</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-[#E0218A] cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.message"
                    (change)="toggleCategory('message', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-[#0E1015] border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-[#3EB991]">update</span>
                    <span>System & Edge Mesh Updates</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-[#E0218A] cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.update"
                    (change)="toggleCategory('update', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-[#0E1015] border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-[#FF2A9D]">security</span>
                    <span>Security Sentinel & Audit Alerts</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-[#E0218A] cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.security"
                    (change)="toggleCategory('security', $event)" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Role Governance & Permissions (RBAC) -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <div class="flex items-center space-x-2">
              <span class="material-icons text-sm text-[#20B2AA]">admin_panel_settings</span>
              <h3 class="font-display text-sm font-semibold text-white">User Role & Access Matrix</h3>
            </div>
            <span class="text-[10px] text-[#8C94A8] font-mono">RBAC v2.4</span>
          </div>

          <div class="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#8C94A8]">Current Authenticated User:</span>
              <span class="text-xs font-bold text-white">{{ authRbac.currentUser().name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#8C94A8]">Assigned Role:</span>
              <span class="text-xs font-mono uppercase font-bold text-[#FF2A9D]">{{ authRbac.currentRole() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-[#8C94A8]">Privilege Tokens:</span>
              <span class="text-xs font-mono text-[#3EB991]">{{ authRbac.currentUser().permissions.length }} active permissions</span>
            </div>
          </div>

          <div class="space-y-2">
            <label for="role-select" class="text-xs text-[#8C94A8] block">Switch Active Role Simulation</label>
            <select
              id="role-select"
              class="w-full bg-[#0E1015] border border-white/10 rounded-lg p-2.5 text-xs text-white"
              [value]="authRbac.currentRole()"
              (change)="onRoleChange($event)">
              <option value="administrator">Administrator (Full Root & Security Access)</option>
              <option value="content_creator">Content Creator (WOPI & AgentFS Authoring)</option>
              <option value="general_user">General User (Read-Only / Basic Shell)</option>
            </select>
          </div>

          <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5 text-[11px] font-mono">
            <p class="text-[#20B2AA] font-bold">Role Capabilities Summary:</p>
            <p class="text-[#8C94A8]">• <strong>Administrator:</strong> Gateway routing, IAM config, audit logs, process kill, security sentinel.</p>
            <p class="text-[#8C94A8]">• <strong>Content Creator:</strong> WOPI authoring, X-WOPI-Lock, AgentFS CoW sandbox, tool execution.</p>
            <p class="text-[#8C94A8]">• <strong>General User:</strong> Document view-only, terminal diagnostics, personal alert queue.</p>
          </div>
        </div>

        <!-- 3. Cadence Settings -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white">Syncopated Rhythm Cadence</h3>
          
          <div class="space-y-2">
            <label for="tempo-beat-select" class="text-xs text-[#8C94A8] block">Tempo Beat Timing</label>
            <select id="tempo-beat-select" class="w-full bg-[#0E1015] border border-white/10 rounded-lg p-2.5 text-xs text-white">
              <option>130ms (Standard Syncopated Groove)</option>
              <option>110ms (Staccato High-Frequency)</option>
              <option>160ms (Legato Ambient)</option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="window-geometry-select" class="text-xs text-[#8C94A8] block">Window Border Geometry</label>
            <select id="window-geometry-select" class="w-full bg-[#0E1015] border border-white/10 rounded-lg p-2.5 text-xs text-white">
              <option>14px 2px 16px 5px (Asymmetrical Cadence)</option>
              <option>8px Uniform Symmetrical</option>
              <option>24px Rounded Floating</option>
            </select>
          </div>
        </div>

        <!-- 4. Security & Sandboxing Status -->
        <div class="bg-[#151922] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white">Security & Isolation Profiles</h3>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">AgentFS Copy-on-Write Isolation</p>
              <p class="text-[10px] text-[#8C94A8]">Isolate autonomous agent file modifications in OPFS overlays.</p>
            </div>
            <span class="text-xs text-[#3EB991] font-mono font-bold">Enabled</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">WOPI Strict Lock Validation</p>
              <p class="text-[10px] text-[#8C94A8]">Enforce X-WOPI-Lock headers on concurrent document put requests.</p>
            </div>
            <span class="text-xs text-[#3EB991] font-mono font-bold">Active</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">Audit Trail Logging</p>
              <p class="text-[10px] text-[#8C94A8]">Append-only cryptographic event sequencing active.</p>
            </div>
            <span class="text-xs text-[#3EB991] font-mono font-bold">Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  readonly pid = input.required<string>();

  protected notificationService = inject(NotificationService);
  protected authRbac = inject(AuthRbacService);
  protected auditService = inject(AuditService);

  public toggleDesktopToasts(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.notificationService.updatePreferences({ desktopToastsEnabled: checked });
    this.auditService.logEvent({
      action: 'NOTIFICATION_PREF_CHANGED',
      category: AuditCategory.SYSTEM,
      details: `Desktop toasts ${checked ? 'enabled' : 'disabled'}.`,
    });
  }

  public toggleSound(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.notificationService.updatePreferences({ soundEnabled: checked });
    this.auditService.logEvent({
      action: 'NOTIFICATION_PREF_CHANGED',
      category: AuditCategory.SYSTEM,
      details: `Notification audio ${checked ? 'enabled' : 'disabled'}.`,
    });
  }

  public toggleCategory(cat: 'task' | 'message' | 'update' | 'security', event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.notificationService.currentPreferences().categories;
    this.notificationService.updatePreferences({
      categories: {
        ...current,
        [cat]: checked,
      },
    });
  }

  public onRoleChange(event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value as UserRole;
    this.authRbac.switchRole(newRole);
    this.auditService.logEvent({
      action: 'USER_ROLE_SWITCH',
      category: AuditCategory.RBAC,
      severity: AuditSeverity.INFO,
      details: `Active role updated to ${newRole} via Settings console.`,
    });
    this.notificationService.notify({
      title: 'Role Switched',
      message: `Active operational identity updated to ${newRole}.`,
      category: 'security',
      priority: 'normal',
    });
  }

  public sendSampleToast(): void {
    this.notificationService.notify({
      title: 'Preferences Updated',
      message: 'Notification preferences verified and synchronized with edge state.',
      category: 'update',
      priority: 'normal',
    });
  }
}
