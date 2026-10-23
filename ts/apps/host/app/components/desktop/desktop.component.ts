import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WindowManagerService } from '../../services/window-manager.service';
import { NotificationService } from '../../services/notification.service';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { WindowComponent } from '../window/window.component';
import { DockComponent } from '../dock/dock.component';

@Component({
  selector: 'app-desktop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, StatusBarComponent, WindowComponent, DockComponent],
  template: `
    <div class="desktop-stage w-screen h-[100dvh] max-h-[100dvh] overflow-hidden relative flex flex-col justify-between select-none pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <app-status-bar />

      <div class="absolute top-12 right-4 sm:right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-2 sm:px-0">
        @for (toast of notificationService.toasts(); track toast.id) {
          <div 
            class="pointer-events-auto p-3 rounded-xl bg-surface-panel border border-white/10 flex items-start space-x-3"
            [class.border-magenta/45]="toast.priority === 'urgent' || toast.category === 'security'">
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              [class.bg-tertiary/20]="toast.category === 'update'"
              [class.text-tertiary]="toast.category === 'update'"
              [class.bg-secondary/20]="toast.category === 'task'"
              [class.text-secondary]="toast.category === 'task'"
              [class.bg-magenta/20]="toast.category === 'security'"
              [class.text-magenta-glow]="toast.category === 'security'"
              [class.bg-primary/20]="toast.category === 'message'"
              [class.text-primary]="toast.category === 'message'">
              <span class="material-icons text-sm">
                @switch (toast.category) {
                  @case ('security') { security }
                  @case ('task') { assignment }
                  @case ('message') { chat }
                  @default { notifications_active }
                }
              </span>
            </div>

            <div class="flex-1 overflow-hidden">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-display font-semibold text-white text-xs truncate">{{ toast.title }}</h4>
                <span class="text-[9px] text-on-surface-variant font-mono shrink-0">{{ toast.timestamp | date:'HH:mm:ss' }}</span>
              </div>
              <p class="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{{ toast.message }}</p>
            </div>

            <button
              type="button"
              class="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
              (click)="notificationService.dismissToast(toast.id)"
              aria-label="Dismiss notification">
              <span class="material-icons text-xs">close</span>
            </button>
          </div>
        }
      </div>

      <div class="flex-1 relative overflow-hidden">
        @for (item of windowMgr.openWindows(); track item[0]) {
          @let pid = item[0];
          @let bounds = item[1];
          @let descriptor = getDescriptor(pid);
          @if (descriptor) {
            <app-window [descriptor]="descriptor" [bounds]="bounds" />
          }
        }

        @if (windowMgr.activeProcesses().length === 0) {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10 text-center pointer-events-none">
            <div class="max-w-md space-y-5 pointer-events-auto">
              <h1 class="font-display text-3xl sm:text-4xl font-bold tracking-[0.12em] text-on-surface">Λ Ξ V <span class="text-magenta">O S</span></h1>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Desktop shell with federated apps, AgentFS, and WOPI.
              </p>
              <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  class="px-3.5 py-2 rounded-lg bg-secondary hover:bg-tertiary text-surface text-xs font-bold transition-colors flex items-center gap-1.5 touch-manipulation"
                  (click)="launchAppwriteDatabases()">
                  <span class="material-icons text-xs">dataset</span>
                  <span>Appwrite Databases</span>
                </button>
                <button
                  type="button"
                  class="px-3.5 py-2 rounded-lg bg-magenta hover:bg-magenta-glow text-white text-xs font-semibold transition-colors flex items-center gap-1.5 touch-manipulation"
                  (click)="launchSecurityAudit()">
                  <span class="material-icons text-xs">verified_user</span>
                  <span>Audit Trail &amp; RBAC</span>
                </button>
                <button
                  type="button"
                  class="px-3.5 py-2 rounded-lg bg-transparent hover:bg-white/8 text-white text-xs font-semibold transition-colors border border-white/15 flex items-center gap-1.5 touch-manipulation"
                  (click)="launchAppStore()">
                  <span class="material-icons text-xs">storefront</span>
                  <span>App Store</span>
                </button>
                <button
                  type="button"
                  class="px-3.5 py-2 rounded-lg bg-transparent hover:bg-white/8 text-white text-xs font-semibold transition-colors border border-white/15 flex items-center gap-1.5 touch-manipulation"
                  (click)="launchTerminal()">
                  <span class="material-icons text-xs">terminal</span>
                  <span>Terminal</span>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      @if (windowMgr.dockVisible()) {
        <div class="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 transition-all duration-200">
          <app-dock />
        </div>
      }

      <div class="fixed bottom-2 left-3 z-[9999] opacity-50 pointer-events-none select-none hidden sm:block">
        <div class="font-display font-bold text-[10px] text-on-surface">ΛΞV Inc</div>
        <div class="font-body font-light text-[8px] tracking-[0.18em] text-on-surface-variant uppercase">
          The Future Needs Context • Innovate, Automate, Dominate
        </div>
      </div>
    </div>
  `
})
export class DesktopComponent {
  protected windowMgr = inject(WindowManagerService);
  protected notificationService = inject(NotificationService);

  public getDescriptor(pid: string) {
    return this.windowMgr.activeProcesses().find(p => p.pid === pid);
  }

  public launchAppwriteDatabases(): void {
    this.windowMgr.spawnProcess('appwrite-db', 'Appwrite Databases & SDK', 'dataset', 'AppwriteDatabasesComponent', 'system');
  }

  public launchAppStore(): void {
    this.windowMgr.spawnProcess('app-store', 'Native Federation Store', 'storefront', 'AppStoreComponent', 'system');
  }

  public launchTerminal(): void {
    this.windowMgr.spawnProcess('terminal', 'Terminal', 'terminal', 'TerminalComponent', 'developer');
  }

  public launchSecurityAudit(): void {
    this.windowMgr.spawnProcess('security-audit', 'Security Governance & Audit Trail', 'verified_user', 'SecurityAuditComponent', 'security');
  }
}
