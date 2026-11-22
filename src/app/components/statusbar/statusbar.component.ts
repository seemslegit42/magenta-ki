import { CommonModule } from '@angular/common';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { AppwriteBackendApiService } from '../../services/appwrite-backend-api.service';
import { WindowManagerService } from '../../services/window-manager.service';
import { TablerIconComponent } from '../common/tabler-icon.component';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <header class="h-12 bg-[#08090C]/95 backdrop-blur-2xl border-b border-[rgba(245,255,250,0.18)] px-4 flex items-center justify-between select-none z-50 shadow-lg">
      <!-- Left: OS Branding & Active Menu -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6A0DAD] to-[#E0218A] flex items-center justify-center text-white shadow-lg shadow-[#E0218A]/30 ring-1 ring-white/20">
            <app-tabler-icon name="hexagon" size="16" class="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          </div>
          <span class="font-display font-bold text-sm text-[#F5FFFA] tracking-[0.2em]">Λ Ξ V <span class="text-[#E0218A] drop-shadow-[0_0_6px_rgba(224,33,138,0.5)]">O S</span></span>
        </div>

        <nav aria-label="System Menu" class="hidden md:flex items-center space-x-1.5 text-xs text-[#8C94A8]">
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#3EB991] cursor-pointer transition-all focus:outline-none flex items-center space-x-1.5 border border-transparent hover:border-[#3EB991]/30 shadow-sm" (click)="openLauncher()">
            <app-tabler-icon name="apps" size="16" class="text-[#3EB991] drop-shadow-[0_0_6px_rgba(62,185,145,0.4)]" />
            <span class="font-medium text-[#F5FFFA]">Applications</span>
          </button>
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#20B2AA] cursor-pointer transition-all focus:outline-none border border-transparent hover:border-[#20B2AA]/30 font-medium text-[#F5FFFA] shadow-sm" (click)="openStore()">App Store</button>
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#3EB991] cursor-pointer transition-all focus:outline-none border border-transparent hover:border-[#3EB991]/30 font-medium text-[#F5FFFA] shadow-sm flex items-center space-x-1.5" (click)="openUatPortal()">
            <app-tabler-icon name="clipboard-check" size="15" class="text-[#3EB991]" />
            <span>Business UAT</span>
          </button>
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#20B2AA] cursor-pointer transition-all focus:outline-none border border-transparent hover:border-[#20B2AA]/30 font-medium text-[#F5FFFA] shadow-sm flex items-center space-x-1.5" (click)="openFeedbackHub()">
            <app-tabler-icon name="message-report" size="15" class="text-[#20B2AA]" />
            <span>Feedback</span>
          </button>
        </nav>
      </div>

      <!-- Right: System Status & Clock -->
      <div class="flex items-center space-x-4 text-xs text-[#8C94A8]">
        <button
          type="button"
          (click)="openDatabaseStudio()"
          class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-mono cursor-pointer hover:bg-white/10"
          [class.bg-[#3EB991]/15]="backendApi.isConnected()"
          [class.border-[#3EB991]/40]="backendApi.isConnected()"
          [class.text-[#3EB991]]="backendApi.isConnected()"
          [class.bg-[#FF4D6D]/15]="!backendApi.isConnected()"
          [class.border-[#FF4D6D]/40]="!backendApi.isConnected()"
          [class.text-[#FF4D6D]]="!backendApi.isConnected()"
          [title]="backendApi.isConnected() ? 'Backend Gateway: Connected (' + backendApi.backendLatencyMs() + 'ms)' : 'Backend Gateway: Offline'">
          <span class="w-1.5 h-1.5 rounded-full" [class.bg-[#3EB991]]="backendApi.isConnected()" [class.shadow-[0_0_6px_#3EB991]]="backendApi.isConnected()" [class.bg-[#FF4D6D]]="!backendApi.isConnected()"></span>
          <span>Gateway {{ backendApi.isConnected() ? 'Live (' + backendApi.backendLatencyMs() + 'ms)' : 'Offline' }}</span>
        </button>

        <div class="flex items-center space-x-1.5 text-[#F5FFFA] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <app-tabler-icon name="clock" size="16" class="text-[#20B2AA] drop-shadow-[0_0_6px_rgba(32,178,170,0.5)]" />
          <span class="font-semibold">{{ currentTime() }}</span>
        </div>
      </div>
    </header>
  `,
})
export class StatusbarComponent {
  readonly windowManager = inject(WindowManagerService);
  readonly backendApi = inject(AppwriteBackendApiService);
  readonly currentTime = signal<string>('');

  constructor() {
    afterNextRender(() => {
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);
      this.checkBackend();
      setInterval(() => this.checkBackend(), 15000);
    });
  }

  private async checkBackend(): Promise<void> {
    const start = performance.now();
    try {
      await this.backendApi.getHealth();
      const latency = Math.round(performance.now() - start);
      this.backendApi.isConnected.set(true);
      this.backendApi.backendLatencyMs.set(latency);
    } catch {
      this.backendApi.isConnected.set(false);
    }
  }

  private updateTime() {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
  }

  openLauncher() {
    this.windowManager.openApp({
      id: 'app-launcher',
      name: 'Application Matrix',
      icon: 'apps',
    });
  }

  openStore() {
    this.windowManager.openApp({
      id: 'app-store',
      name: 'Verdigris App Store & Catalog',
      icon: 'storefront',
    });
  }

  openStudio() {
    this.windowManager.openApp({
      id: 'native-federation',
      name: 'Native Federation Studio',
      icon: 'hub',
    });
  }

  openDatabaseStudio() {
    this.windowManager.spawnProcess(
      'appwrite-databases',
      'Enterprise Database Studio',
      'database',
      'AppwriteDatabasesComponent',
      'database',
    );
  }

  openUatPortal() {
    this.windowManager.openApp({
      id: 'uat-portal',
      name: 'Business Acceptance (UAT)',
      icon: 'clipboard-check',
      componentName: 'UatPortalComponent',
      entryComponent: 'UatPortalComponent',
      category: 'productivity',
    });
  }

  openFeedbackHub() {
    this.windowManager.openApp({
      id: 'feedback-hub',
      name: 'Feedback & API Strategy Hub',
      icon: 'message-report',
      componentName: 'FeedbackHubComponent',
      entryComponent: 'FeedbackHubComponent',
      category: 'productivity',
    });
  }
}
