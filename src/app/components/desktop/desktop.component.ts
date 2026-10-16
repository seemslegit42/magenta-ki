import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WindowManagerService } from '../../services/window-manager.service';
import { NotificationService } from '../../services/notification.service';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { WindowComponent } from '../window/window.component';
import { DockComponent } from '../dock/dock.component';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [CommonModule, DatePipe, StatusBarComponent, WindowComponent, DockComponent],
  template: `
    <div class="syncopated-desktop-stage w-screen h-[100dvh] max-h-[100dvh] overflow-hidden relative flex flex-col justify-between select-none pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <!-- Status Bar -->
      <app-status-bar />

      <!-- Real-Time Desktop Notification Toast Overlays (Top-Right) -->
      <div class="absolute top-12 right-4 sm:right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-2 sm:px-0">
        @for (toast of notificationService.toasts(); track toast.id) {
          <div 
            class="pointer-events-auto p-3.5 rounded-2xl bg-[#151922]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-start space-x-3 transition-all animate-bounce-once duration-300"
            [class.border-[#E0218A]/50]="toast.priority === 'urgent' || toast.category === 'security'"
            [class.shadow-[0_0_20px_rgba(224,33,138,0.2)]]="toast.priority === 'urgent' || toast.category === 'security'">
            <div 
              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              [class.bg-[#3EB991]/20]="toast.category === 'update'"
              [class.text-[#3EB991]]="toast.category === 'update'"
              [class.bg-[#20B2AA]/20]="toast.category === 'task'"
              [class.text-[#20B2AA]]="toast.category === 'task'"
              [class.bg-[#E0218A]/20]="toast.category === 'security'"
              [class.text-[#FF2A9D]]="toast.category === 'security'"
              [class.bg-[#6A0DAD]/20]="toast.category === 'message'"
              [class.text-[#6A0DAD]]="toast.category === 'message'">
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
              <div class="flex items-center justify-between">
                <h4 class="font-display font-semibold text-white text-xs truncate">{{ toast.title }}</h4>
                <span class="text-[9px] text-[#8C94A8] font-mono ml-1">{{ toast.timestamp | date:'HH:mm:ss' }}</span>
              </div>
              <p class="text-[11px] text-[#8C94A8] mt-0.5 leading-snug">{{ toast.message }}</p>
            </div>

            <button
              class="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#8C94A8] hover:text-white transition-colors"
              (click)="notificationService.dismissToast(toast.id)">
              <span class="material-icons text-xs">close</span>
            </button>
          </div>
        }
      </div>

      <!-- Desktop Working Surface (Windows Stage) -->
      <div class="flex-1 relative overflow-hidden">
        @for (item of windowMgr.openWindows(); track item[0]) {
          @let pid = item[0];
          @let bounds = item[1];
          @let descriptor = getDescriptor(pid);
          @if (descriptor) {
            <app-window [descriptor]="descriptor" [bounds]="bounds" />
          }
        }

        <!-- Welcome Banner on Empty Desktop -->
        @if (windowMgr.activeProcesses().length === 0) {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 text-center pointer-events-none">
            <div class="max-w-xl space-y-4 bg-[#151922]/85 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl pointer-events-auto">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E0218A]/20 border border-[#E0218A]/40 flex items-center justify-center mx-auto text-[#FF2A9D] shadow-[0_0_30px_rgba(224,33,138,0.3)]">
                <span class="material-icons text-2xl sm:text-3xl">hub</span>
              </div>
              <h1 class="font-display text-xl sm:text-2xl font-bold text-white">Verdigris Cloud OS</h1>
              <p class="text-xs text-[#8C94A8] leading-relaxed">
                Federated Enterprise Web Operating System with Touch & Gesture Navigation, Zoneless Angular Signals, Immutable Audit Trails, RBAC, AgentFS, and WOPI Document Federation.
              </p>
              <div class="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                <button
                  class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#20B2AA] hover:bg-[#3EB991] active:scale-95 text-[#0E1015] text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 touch-manipulation"
                  (click)="launchAppwriteDatabases()">
                  <span class="material-icons text-xs">dataset</span>
                  <span>Appwrite Databases</span>
                </button>
                <button
                  class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#E0218A] hover:bg-[#FF2A9D] active:scale-95 text-white text-xs font-semibold transition-all shadow-lg flex items-center space-x-1.5 touch-manipulation"
                  (click)="launchSecurityAudit()">
                  <span class="material-icons text-xs">verified_user</span>
                  <span>Audit Trail & RBAC</span>
                </button>
                <button
                  class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all border border-white/10 flex items-center space-x-1.5 touch-manipulation"
                  (click)="launchAppStore()">
                  <span class="material-icons text-xs">storefront</span>
                  <span>App Store</span>
                </button>
                <button
                  class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all border border-white/10 flex items-center space-x-1.5 touch-manipulation"
                  (click)="launchTerminal()">
                  <span class="material-icons text-xs">terminal</span>
                  <span>Terminal</span>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Offset Floating Dock with Safe Area -->
      @if (windowMgr.dockVisible()) {
        <div class="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 transition-all duration-200">
          <app-dock />
        </div>
      }

      <!-- Mandatory Brand Signature (Fixed Bottom-Left, z-index: 9999) -->
      <div class="fixed bottom-2 left-3 z-[9999] opacity-40 mix-blend-overlay pointer-events-none select-none hidden sm:block">
        <div class="font-display font-bold text-[10px] tracking-normal text-white">ΛΞV Inc</div>
        <div class="font-['Lexend'] font-light text-[8px] tracking-[0.2em] text-[#F5FFFA] uppercase">
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
    this.windowMgr.spawnProcess('terminal', 'WebOS Terminal & Shell', 'terminal', 'TerminalComponent', 'developer');
  }

  public launchSecurityAudit(): void {
    this.windowMgr.spawnProcess('security-audit', 'Security Governance & Audit Trail', 'verified_user', 'SecurityAuditComponent', 'security');
  }
}
