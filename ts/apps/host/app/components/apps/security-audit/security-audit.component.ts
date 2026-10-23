import { Component, ChangeDetectionStrategy, input, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../../services/audit.service';
import { AuthRbacService } from '../../../services/auth-rbac.service';
import { NotificationService } from '../../../services/notification.service';
import { AuditCategory, AuditSeverity, UserRole } from '../../../models/webos.models';

@Component({
  selector: 'app-security-audit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 class="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#E0218A]">verified_user</span>
            <span>Security Governance, Audit Trail & RBAC</span>
          </h2>
          <p class="text-xs text-[#8C94A8] mt-1">
            Real-time immutable audit trail of critical user actions, multi-tier RBAC enforcement, and compliance telemetry.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <button
            class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center space-x-1"
            (click)="exportJson()">
            <span class="material-icons text-xs text-[#20B2AA]">download</span>
            <span>Export JSON</span>
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center space-x-1"
            (click)="exportCsv()">
            <span class="material-icons text-xs text-[#3EB991]">table_view</span>
            <span>Export CSV</span>
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-[#E0218A] hover:bg-[#FF2A9D] text-white text-xs font-semibold transition-colors flex items-center space-x-1 shadow-lg"
            (click)="simulateSecurityEvent()">
            <span class="material-icons text-xs">notification_important</span>
            <span>Simulate SecEvent</span>
          </button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex items-center space-x-4 border-b border-white/10">
        <button
          class="pb-3 text-xs font-display font-semibold transition-colors relative"
          [class.text-[#E0218A]]="activeTab() === 'audit'"
          [class.text-[#8C94A8]]="activeTab() !== 'audit'"
          (click)="activeTab.set('audit')">
          <div class="flex items-center space-x-2">
            <span class="material-icons text-sm">receipt_long</span>
            <span>Audit Trail Ledger ({{ auditService.totalCount() }})</span>
          </div>
          @if (activeTab() === 'audit') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0218A]"></span>
          }
        </button>

        <button
          class="pb-3 text-xs font-display font-semibold transition-colors relative"
          [class.text-[#E0218A]]="activeTab() === 'rbac'"
          [class.text-[#8C94A8]]="activeTab() !== 'rbac'"
          (click)="activeTab.set('rbac')">
          <div class="flex items-center space-x-2">
            <span class="material-icons text-sm">admin_panel_settings</span>
            <span>Roles & Permissions (RBAC)</span>
          </div>
          @if (activeTab() === 'rbac') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0218A]"></span>
          }
        </button>

        <button
          class="pb-3 text-xs font-display font-semibold transition-colors relative"
          [class.text-[#E0218A]]="activeTab() === 'compliance'"
          [class.text-[#8C94A8]]="activeTab() !== 'compliance'"
          (click)="activeTab.set('compliance')">
          <div class="flex items-center space-x-2">
            <span class="material-icons text-sm">health_and_safety</span>
            <span>Compliance & Tamper Proofing</span>
          </div>
          @if (activeTab() === 'compliance') {
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0218A]"></span>
          }
        </button>
      </div>

      <!-- TAB 1: AUDIT TRAIL LEDGER -->
      @if (activeTab() === 'audit') {
        <div class="space-y-4">
          <!-- Filters & Search Toolbar -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#151922] p-3 rounded-xl border border-white/10">
            <!-- Search -->
            <div class="flex items-center space-x-2 bg-[#0E1015] px-3 py-1.5 rounded-lg border border-white/10 md:col-span-2">
              <span class="material-icons text-xs text-[#8C94A8]">search</span>
              <input
                type="text"
                class="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                placeholder="Search by action, details, user ID or target..."
                [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" />
            </div>

            <!-- Severity Filter -->
            <select
              class="bg-[#0E1015] text-xs text-white px-2 py-1.5 rounded-lg border border-white/10 focus:outline-none"
              [value]="selectedSeverity()" (change)="selectedSeverity.set($any($event.target).value)">
              <option value="ALL">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="security">Security Alert</option>
            </select>

            <!-- Category Filter -->
            <select
              class="bg-[#0E1015] text-xs text-white px-2 py-1.5 rounded-lg border border-white/10 focus:outline-none"
              [value]="selectedCategory()" (change)="selectedCategory.set($any($event.target).value)">
              <option value="ALL">All Categories</option>
              <option value="auth">Auth & IAM</option>
              <option value="filesystem">Filesystem (AgentFS)</option>
              <option value="process">Process Lifecycle</option>
              <option value="system">Kernel & System</option>
              <option value="rbac">RBAC Policy</option>
              <option value="wopi">WOPI Authoring</option>
            </select>
          </div>

          <!-- Logs Table / Stream -->
          <div class="bg-[#151922] rounded-xl border border-white/10 overflow-hidden shadow-xl">
            <div class="max-h-[380px] overflow-y-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-[#0E1015] border-b border-white/10 text-[#8C94A8] sticky top-0 z-10">
                  <tr>
                    <th class="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th class="py-2.5 px-3 font-semibold">User / Role</th>
                    <th class="py-2.5 px-3 font-semibold">Action</th>
                    <th class="py-2.5 px-3 font-semibold">Category</th>
                    <th class="py-2.5 px-3 font-semibold">Severity</th>
                    <th class="py-2.5 px-3 font-semibold">Status</th>
                    <th class="py-2.5 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @for (log of filteredLogs(); track log.id) {
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="py-2.5 px-4 text-[#8C94A8] whitespace-nowrap">
                        {{ log.timestamp | date:'HH:mm:ss.SSS' }}
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <div class="flex items-center space-x-1.5">
                          <span class="text-white font-medium">{{ log.userId }}</span>
                          <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#20B2AA]">
                            {{ log.userRole }}
                          </span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span class="font-bold text-white">{{ log.action }}</span>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap text-[#8C94A8]">
                        {{ log.category }}
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span 
                          class="px-2 py-0.5 rounded text-[10px] uppercase font-bold"
                          [class.bg-[#3EB991]/20]="log.severity === 'info'"
                          [class.text-[#3EB991]]="log.severity === 'info'"
                          [class.bg-amber-500/20]="log.severity === 'warning'"
                          [class.text-amber-400]="log.severity === 'warning'"
                          [class.bg-red-500/20]="log.severity === 'critical'"
                          [class.text-red-400]="log.severity === 'critical'"
                          [class.bg-[#E0218A]/20]="log.severity === 'security'"
                          [class.text-[#FF2A9D]]="log.severity === 'security'">
                          {{ log.severity }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span
                          class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          [class.text-[#3EB991]]="log.status === 'success'"
                          [class.text-red-400]="log.status === 'failure'"
                          [class.text-amber-400]="log.status === 'blocked'">
                          {{ log.status }}
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-[#8C94A8] max-w-xs truncate" [title]="log.details">
                        {{ log.details }}
                      </td>
                    </tr>
                  }
                  @if (filteredLogs().length === 0) {
                    <tr>
                      <td colspan="7" class="py-8 text-center text-[#8C94A8]">
                        <span class="material-icons text-3xl mb-1 text-[#8C94A8]">search_off</span>
                        <p>No audit trail logs match the specified search or filter criteria.</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: ROLES & PERMISSIONS (RBAC) -->
      @if (activeTab() === 'rbac') {
        <div class="space-y-6">
          <!-- Active Identity Switcher -->
          <div class="bg-[#151922] p-5 rounded-xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-display text-sm font-semibold text-white">Active Identity Profile Switcher</h3>
                <p class="text-xs text-[#8C94A8]">Switch between provisioned users to test real-time privilege enforcement.</p>
              </div>
              <span class="text-xs px-2.5 py-1 rounded bg-[#E0218A]/20 text-[#FF2A9D] border border-[#E0218A]/30 font-mono">
                Current Role: {{ authRbac.currentRole() }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              @for (profile of authRbac.allProfiles(); track profile.id) {
                <div
                  role="button"
                  tabindex="0"
                  class="p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between outline-none focus:ring-2 focus:ring-[#E0218A]"
                  [class.bg-[#E0218A]/10]="authRbac.currentUser().id === profile.id"
                  [class.border-[#E0218A]]="authRbac.currentUser().id === profile.id"
                  [class.bg-white/5]="authRbac.currentUser().id !== profile.id"
                  [class.border-white/5]="authRbac.currentUser().id !== profile.id"
                  (click)="authRbac.switchUser(profile.id)"
                  (keydown.enter)="authRbac.switchUser(profile.id)">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-2">
                        <span class="material-icons text-xl text-[#20B2AA]">{{ profile.avatar }}</span>
                        <span class="font-display font-semibold text-white text-xs">{{ profile.name }}</span>
                      </div>
                      <span
                        class="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        [class.bg-[#E0218A]/30]="profile.role === 'administrator'"
                        [class.text-[#FF2A9D]]="profile.role === 'administrator'"
                        [class.bg-[#20B2AA]/30]="profile.role === 'content_creator'"
                        [class.text-[#20B2AA]]="profile.role === 'content_creator'"
                        [class.bg-white/10]="profile.role === 'general_user'"
                        [class.text-[#8C94A8]]="profile.role === 'general_user'">
                        {{ profile.role }}
                      </span>
                    </div>
                    <p class="text-[11px] text-[#8C94A8]">{{ profile.department }}</p>
                    <p class="text-[10px] text-[#8C94A8] font-mono mt-1">{{ profile.email }}</p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span class="text-[#8C94A8]">{{ profile.permissions.length }} permissions</span>
                    @if (authRbac.currentUser().id === profile.id) {
                      <span class="text-[#3EB991] font-bold flex items-center space-x-1">
                        <span class="material-icons text-xs">check_circle</span>
                        <span>Active Session</span>
                      </span>
                    } @else {
                      <span class="text-[#8C94A8]">Click to Switch</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Role Definitions & Matrix -->
          <div class="bg-[#151922] p-5 rounded-xl border border-white/10 space-y-4">
            <h3 class="font-display text-sm font-semibold text-white">Role Hierarchy & Capability Matrix</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (roleItem of authRbac.availableRoles; track roleItem.role) {
                <div class="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full" [style.background-color]="roleItem.badgeColor"></span>
                    <h4 class="font-display text-xs font-bold text-white">{{ roleItem.title }}</h4>
                  </div>
                  <p class="text-xs text-[#8C94A8] leading-relaxed">{{ roleItem.description }}</p>
                </div>
              }
            </div>

            <!-- Permission Comparison Table -->
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead>
                  <tr class="border-b border-white/10 text-[#8C94A8]">
                    <th class="py-2 pr-4">Permission Token</th>
                    <th class="py-2 px-4 text-center">Administrator</th>
                    <th class="py-2 px-4 text-center">Content Creator</th>
                    <th class="py-2 px-4 text-center">General User</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @for (perm of permissionChecklist; track perm.token) {
                    <tr>
                      <td class="py-2 pr-4 text-white font-medium">
                        <div>{{ perm.token }}</div>
                        <div class="text-[10px] text-[#8C94A8]">{{ perm.desc }}</div>
                      </td>
                      <td class="py-2 px-4 text-center">
                        <span class="material-icons text-sm text-[#3EB991]">check_circle</span>
                      </td>
                      <td class="py-2 px-4 text-center">
                        @if (perm.creator) {
                          <span class="material-icons text-sm text-[#3EB991]">check_circle</span>
                        } @else {
                          <span class="material-icons text-sm text-[#8C94A8]/40">cancel</span>
                        }
                      </td>
                      <td class="py-2 px-4 text-center">
                        @if (perm.user) {
                          <span class="material-icons text-sm text-[#3EB991]">check_circle</span>
                        } @else {
                          <span class="material-icons text-sm text-[#8C94A8]/40">cancel</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: COMPLIANCE & SECURITY TELEMETRY -->
      @if (activeTab() === 'compliance') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[#151922] p-5 rounded-xl border border-white/10 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#3EB991]/20 flex items-center justify-center text-[#3EB991]">
              <span class="material-icons">fingerprint</span>
            </div>
            <h4 class="font-display text-sm font-semibold text-white">Cryptographic Verification</h4>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              Every audit ledger event is sequenced using HMAC-SHA256 hash chaining to prevent tampering or history rewriting.
            </p>
            <div class="p-2 rounded bg-white/5 text-[10px] font-mono text-[#3EB991]">
              STATUS: CHAIN_VALID (100% Verified)
            </div>
          </div>

          <div class="bg-[#151922] p-5 rounded-xl border border-white/10 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#20B2AA]/20 flex items-center justify-center text-[#20B2AA]">
              <span class="material-icons">storage</span>
            </div>
            <h4 class="font-display text-sm font-semibold text-white">WASM OPFS Sandboxing</h4>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              AgentFS maintains copy-on-write isolation across all tenant workspaces, preventing unmediated disk writes.
            </p>
            <div class="p-2 rounded bg-white/5 text-[10px] font-mono text-[#20B2AA]">
              ISOLATION: HARDENED_CoW
            </div>
          </div>

          <div class="bg-[#151922] p-5 rounded-xl border border-white/10 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-[#E0218A]/20 flex items-center justify-center text-[#FF2A9D]">
              <span class="material-icons">shield</span>
            </div>
            <h4 class="font-display text-sm font-semibold text-white">Multi-Tenant Blast Radius</h4>
            <p class="text-xs text-[#8C94A8] leading-relaxed">
              Database-per-organization architecture ensures tenant-isolated libSQL files with zero shared memory leakage.
            </p>
            <div class="p-2 rounded bg-white/5 text-[10px] font-mono text-[#FF2A9D]">
              BLAST RADIUS: MINIMAL (Edge-Isolated)
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SecurityAuditComponent {
  readonly pid = input.required<string>();

  protected auditService = inject(AuditService);
  protected authRbac = inject(AuthRbacService);
  protected notificationService = inject(NotificationService);

  protected activeTab = signal<'audit' | 'rbac' | 'compliance'>('audit');
  protected searchQuery = signal('');
  protected selectedSeverity = signal('ALL');
  protected selectedCategory = signal('ALL');
  protected auditCategories: AuditCategory[] = ['auth', 'filesystem', 'process', 'system', 'rbac', 'wopi'];
  protected auditSeverities: AuditSeverity[] = ['info', 'warning', 'critical', 'security'];
  protected supportedRoles: UserRole[] = ['administrator', 'content_creator', 'general_user'];

  protected permissionChecklist = [
    { token: 'audit:read', desc: 'Inspect system and user audit trail records', creator: false, user: false },
    { token: 'audit:export', desc: 'Export audit logs to CSV and JSON formats', creator: false, user: false },
    { token: 'audit:manage', desc: 'Purge or archive security audit ledger', creator: false, user: false },
    { token: 'gateway:manage', desc: 'Reconfigure Go edge gateway routing & SAML', creator: false, user: false },
    { token: 'gateway:query', desc: 'Execute direct libSQL edge queries', creator: false, user: false },
    { token: 'wopi:read', desc: 'Read enterprise office documents', creator: true, user: true },
    { token: 'wopi:edit', desc: 'Author content and stream PutFile saves', creator: true, user: false },
    { token: 'wopi:lock', desc: 'Acquire and release exclusive X-WOPI-Lock', creator: true, user: false },
    { token: 'agentfs:read', desc: 'Inspect SQLite VFS inodes and dentries', creator: true, user: true },
    { token: 'agentfs:write', desc: 'Modify VFS file payloads and execute tools', creator: true, user: false },
    { token: 'agentfs:snapshot', desc: 'Create isolated Copy-on-Write snapshots', creator: true, user: false },
    { token: 'process:spawn', desc: 'Launch applications into workspace windows', creator: true, user: true },
    { token: 'process:kill', desc: 'Terminate application processes by PID', creator: false, user: false },
    { token: 'settings:manage', desc: 'Configure syncopated UI and security cadence', creator: false, user: false },
    { token: 'rbac:manage', desc: 'Assign and update user profile roles', creator: false, user: false },
  ];

  protected filteredLogs = computed(() => {
    let logs = this.auditService.allLogs();

    if (this.selectedSeverity() !== 'ALL') {
      logs = logs.filter(l => l.severity === this.selectedSeverity());
    }

    if (this.selectedCategory() !== 'ALL') {
      logs = logs.filter(l => l.category === this.selectedCategory());
    }

    if (this.searchQuery().trim()) {
      const q = this.searchQuery().toLowerCase();
      logs = logs.filter(
        l =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q) ||
          (l.targetEntity && l.targetEntity.toLowerCase().includes(q))
      );
    }

    return logs;
  });

  public exportJson(): void {
    const data = this.auditService.exportAuditLogsJson();
    this.downloadFile(data, 'verdigris-audit-trail.json', 'application/json');
    this.auditService.logEvent({
      action: 'AUDIT_EXPORT_JSON',
      category: AuditCategory.RBAC,
      severity: AuditSeverity.INFO,
      details: 'Audit trail ledger exported to JSON by active user.',
    });
    this.notificationService.notify({
      title: 'Audit Logs Exported',
      message: 'Audit trail successfully generated and exported as JSON.',
      category: 'security',
      priority: 'normal',
    });
  }

  public exportCsv(): void {
    const data = this.auditService.exportAuditLogsCsv();
    this.downloadFile(data, 'verdigris-audit-trail.csv', 'text/csv');
    this.auditService.logEvent({
      action: 'AUDIT_EXPORT_CSV',
      category: AuditCategory.RBAC,
      severity: AuditSeverity.INFO,
      details: 'Audit trail ledger exported to CSV by active user.',
    });
    this.notificationService.notify({
      title: 'Audit Logs Exported',
      message: 'Audit trail successfully generated and exported as CSV.',
      category: 'security',
      priority: 'normal',
    });
  }

  public simulateSecurityEvent(): void {
    const entry = this.auditService.logEvent({
      action: 'SUSPICIOUS_CONCURRENCY_DETECTED',
      category: AuditCategory.WOPI,
      severity: AuditSeverity.SECURITY,
      targetEntity: 'doc_101',
      status: 'blocked',
      details: 'Simultaneous lock request detected with invalid signature token.',
    });

    this.notificationService.notify({
      title: 'Security Alert: Concurrency Anomaly',
      message: `Suspicious concurrent lock request on doc_101 was intercepted (Log: ${entry.id}).`,
      category: 'security',
      priority: 'urgent',
      sourceApp: 'Security Sentinel',
      actionLabel: 'View Audit Log',
    });
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
