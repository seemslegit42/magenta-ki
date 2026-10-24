import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { AuthRbacService } from '../../../services/auth-rbac.service';
import { AuditService } from '../../../services/audit.service';
import { UserRole, AuditCategory, AuditSeverity } from '../../../models/webos.models';
import { ShellThemeService, ShellThemePreference } from '../../../services/shell-theme.service';
import { ShellChromeService, AmbientBrandMode } from '../../../services/shell-chrome.service';

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
            <span class="material-icons text-secondary">settings</span>
            <span>System Settings</span>
          </h2>
          <p class="text-xs text-on-surface-variant mt-1">Configure notifications, roles, and security.</p>
        </div>
        <span class="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-secondary">
          Role: {{ authRbac.currentRole() }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Appearance -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-5 space-y-4 md:col-span-2">
          <div class="flex items-center space-x-2 border-b border-white/5 pb-2">
            <span class="material-icons text-sm text-primary">palette</span>
            <h3 class="font-display text-sm font-semibold text-white">Appearance & Desktop</h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="theme-select" class="text-xs text-on-surface-variant block uppercase tracking-widest font-semibold">Theme</label>
              <select
                id="theme-select"
                class="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-xs text-white"
                [value]="shellTheme.themePreference()"
                (change)="onThemeChange($event)">
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
              <p class="text-[10px] text-on-surface-variant">Verdigris aurora and chrome follow light or dark resolution.</p>
            </div>
            <div class="space-y-2">
              <label for="ambient-select" class="text-xs text-on-surface-variant block uppercase tracking-widest font-semibold">Ambient brand</label>
              <select
                id="ambient-select"
                class="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-xs text-white"
                [value]="shellChrome.ambientBrandMode()"
                (change)="onAmbientChange($event)">
                <option value="adaptive">Adaptive (empty desktop)</option>
                <option value="always-on">Always on</option>
                <option value="always-off">Always off</option>
              </select>
              <p class="text-[10px] text-on-surface-variant">Stage watermark vs header wordmark (adaptive mode C).</p>
            </div>
          </div>
        </div>

        <!-- 1. Notification Preferences -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <div class="flex items-center space-x-2">
              <span class="material-icons text-sm text-magenta-glow">notifications</span>
              <h3 class="font-display text-sm font-semibold text-white">Notification Alert Preferences</h3>
            </div>
            <button
              class="text-[10px] text-secondary hover:underline"
              (click)="sendSampleToast()">
              Test Alert
            </button>
          </div>

          <div class="space-y-3">
            <label class="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <p class="font-display text-xs font-semibold text-white">Desktop Popup Toasts</p>
                <p class="text-[10px] text-on-surface-variant">Show ephemeral floating notification cards in top-right screen corner</p>
              </div>
              <input
                type="checkbox"
                class="accent-magenta w-4 h-4 cursor-pointer"
                [checked]="notificationService.currentPreferences().desktopToastsEnabled"
                (change)="toggleDesktopToasts($event)" />
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <p class="font-display text-xs font-semibold text-white">Audio & Sonic Feedback</p>
                <p class="text-[10px] text-on-surface-variant">Harmonic chime for notifications, task events and locks</p>
              </div>
              <input
                type="checkbox"
                class="accent-magenta w-4 h-4 cursor-pointer"
                [checked]="notificationService.currentPreferences().soundEnabled"
                (change)="toggleSound($event)" />
            </label>

            <!-- Channel Subscriptions -->
            <div class="pt-2">
              <p class="text-xs font-display font-semibold text-on-surface-variant mb-2">Category Subscriptions</p>
              <div class="space-y-2 text-xs">
                <label class="flex items-center justify-between p-2 rounded bg-surface border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-secondary">assignment</span>
                    <span>Task Assignments & Mentions</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-magenta cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.task"
                    (change)="toggleCategory('task', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-surface border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-primary">chat</span>
                    <span>Direct Messages & Chat Alerts</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-magenta cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.message"
                    (change)="toggleCategory('message', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-surface border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-tertiary">update</span>
                    <span>System & Edge Mesh Updates</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-magenta cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.update"
                    (change)="toggleCategory('update', $event)" />
                </label>

                <label class="flex items-center justify-between p-2 rounded bg-surface border border-white/5 cursor-pointer">
                  <span class="text-white flex items-center space-x-2">
                    <span class="material-icons text-xs text-magenta-glow">security</span>
                    <span>Security Sentinel & Audit Alerts</span>
                  </span>
                  <input
                    type="checkbox"
                    class="accent-magenta cursor-pointer"
                    [checked]="notificationService.currentPreferences().categories.security"
                    (change)="toggleCategory('security', $event)" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Role Governance & Permissions (RBAC) -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <div class="flex items-center space-x-2">
              <span class="material-icons text-sm text-secondary">admin_panel_settings</span>
              <h3 class="font-display text-sm font-semibold text-white">User Role & Access Matrix</h3>
            </div>
            <span class="text-[10px] text-on-surface-variant font-mono">RBAC v2.4</span>
          </div>

          <div class="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-on-surface-variant">Current Authenticated User:</span>
              <span class="text-xs font-bold text-white">{{ authRbac.currentUser().name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-on-surface-variant">Assigned Role:</span>
              <span class="text-xs font-mono uppercase font-bold text-magenta-glow">{{ authRbac.currentRole() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-on-surface-variant">Privilege Tokens:</span>
              <span class="text-xs font-mono text-tertiary">{{ authRbac.currentUser().permissions.length }} active permissions</span>
            </div>
          </div>

          <div class="space-y-2">
            <label for="role-select" class="text-xs text-on-surface-variant block">Switch Active Role Simulation</label>
            <select
              id="role-select"
              class="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-xs text-white"
              [value]="authRbac.currentRole()"
              (change)="onRoleChange($event)">
              <option value="administrator">Administrator (Full Root & Security Access)</option>
              <option value="content_creator">Content Creator (WOPI & AgentFS Authoring)</option>
              <option value="general_user">General User (Read-Only / Basic Shell)</option>
            </select>
          </div>

          <div class="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5 text-[11px] font-mono">
            <p class="text-secondary font-bold">Role Capabilities Summary:</p>
            <p class="text-on-surface-variant">• <strong>Administrator:</strong> Gateway routing, IAM config, audit logs, process kill, security sentinel.</p>
            <p class="text-on-surface-variant">• <strong>Content Creator:</strong> WOPI authoring, X-WOPI-Lock, AgentFS CoW sandbox, tool execution.</p>
            <p class="text-on-surface-variant">• <strong>General User:</strong> Document view-only, terminal diagnostics, personal alert queue.</p>
          </div>
        </div>

        <!-- 3. Cadence Settings -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-5 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white">Syncopated Rhythm Cadence</h3>
          
          <div class="space-y-2">
            <label for="tempo-beat-select" class="text-xs text-on-surface-variant block">Tempo Beat Timing</label>
            <select id="tempo-beat-select" class="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-xs text-white">
              <option>130ms (Standard Syncopated Groove)</option>
              <option>110ms (Staccato High-Frequency)</option>
              <option>160ms (Legato Ambient)</option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="window-geometry-select" class="text-xs text-on-surface-variant block">Window Border Geometry</label>
            <select id="window-geometry-select" class="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-xs text-white">
              <option>14px 2px 16px 5px (Asymmetrical Cadence)</option>
              <option>8px Uniform Symmetrical</option>
              <option>24px Rounded Floating</option>
            </select>
          </div>
        </div>

        <!-- 4. Security & Sandboxing Status -->
        <div class="bg-surface-panel border border-white/10 rounded-xl p-5 space-y-4">
          <h3 class="font-display text-sm font-semibold text-white">Security & Isolation Profiles</h3>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">AgentFS Copy-on-Write Isolation</p>
              <p class="text-[10px] text-on-surface-variant">Isolate autonomous agent file modifications in OPFS overlays.</p>
            </div>
            <span class="text-xs text-tertiary font-mono font-bold">Enabled</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">WOPI Strict Lock Validation</p>
              <p class="text-[10px] text-on-surface-variant">Enforce X-WOPI-Lock headers on concurrent document put requests.</p>
            </div>
            <span class="text-xs text-tertiary font-mono font-bold">Active</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p class="font-display text-xs font-semibold text-white">Audit Trail Logging</p>
              <p class="text-[10px] text-on-surface-variant">Append-only cryptographic event sequencing active.</p>
            </div>
            <span class="text-xs text-tertiary font-mono font-bold">Encrypted</span>
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
  protected shellTheme = inject(ShellThemeService);
  protected shellChrome = inject(ShellChromeService);

  public onThemeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ShellThemePreference;
    this.shellTheme.setThemePreference(value);
    this.auditService.logEvent({
      action: 'SHELL_THEME_CHANGED',
      category: AuditCategory.SYSTEM,
      details: `Shell theme preference set to ${value}.`,
    });
  }

  public onAmbientChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AmbientBrandMode;
    this.shellChrome.setAmbientBrandMode(value);
    this.auditService.logEvent({
      action: 'SHELL_AMBIENT_BRAND_CHANGED',
      category: AuditCategory.SYSTEM,
      details: `Ambient brand mode set to ${value}.`,
    });
  }

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
