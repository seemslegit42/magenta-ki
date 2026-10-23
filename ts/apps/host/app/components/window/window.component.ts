import { Component, Input, computed, signal, inject } from '@angular/core';
import { WindowBounds, ProcessDescriptor } from '../../models/webos.models';
import { WindowManagerService } from '../../services/window-manager.service';
import { AgentFsExplorerComponent } from '../apps/agentfs-explorer/agentfs-explorer.component';
import { AppStoreComponent } from '../apps/app-store/app-store.component';
import { WopiOfficeComponent } from '../apps/wopi-office/wopi-office.component';
import { GatewayConsoleComponent } from '../apps/gateway-console/gateway-console.component';
import { TerminalComponent } from '../apps/terminal/terminal.component';
import { SettingsComponent } from '../apps/settings/settings.component';
import { SecurityAuditComponent } from '../apps/security-audit/security-audit.component';
import { AppwriteDatabasesComponent } from '../apps/appwrite-databases/appwrite-databases.component';
import { RemoteContainerComponent } from '../apps/remote-container/remote-container.component';
import { AppLauncherComponent } from '../apps/app-launcher/app-launcher.component';
import { AgenticValueFrameworkComponent } from '../apps/agentic-value-framework/agentic-value-framework.component';
import { ChatWindowComponent } from '../apps/chat-window/chat-window.component';

@Component({
  selector: 'app-window',
  standalone: true,
  imports: [
    AgentFsExplorerComponent,
    AppStoreComponent,
    WopiOfficeComponent,
    GatewayConsoleComponent,
    TerminalComponent,
    SettingsComponent,
    SecurityAuditComponent,
    AppwriteDatabasesComponent,
    RemoteContainerComponent,
    AppLauncherComponent,
    AgenticValueFrameworkComponent,
    ChatWindowComponent
  ],
  template: `
    <div
      class="syncopated-window absolute flex flex-col overflow-hidden transition-all duration-200 bg-[#10131A]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl"
      [class.is-focused]="isFocused()"
      [class.is-background]="!isFocused()"
      [class.hidden]="bounds.isMinimized"
      [class.is-mobile-maximized]="isMobileMaximized()"
      [class.window-gesture-dragging]="isDragging() || isPulling()"
      [class.window-spring-back]="isSpringBack()"
      [class.window-dismiss-anim]="isDismissing()"
      [style.transform]="windowTransform()"
      [style.opacity]="windowOpacity()"
      [style.width.px]="isMobileMaximized() ? null : (bounds.isMaximized ? window.innerWidth : bounds.width)"
      [style.height.px]="isMobileMaximized() ? null : (bounds.isMaximized ? (window.innerHeight - 80) : bounds.height)"
      [style.z-index]="bounds.zIndex"
      (mousedown)="onFocus()">
      
      <!-- Window Chrome (Touch & Desktop Drag Zone) -->
      <div 
        class="window-chrome h-11 bg-gradient-to-r from-[#171B26] to-[#12151D] border-b border-white/10 px-4 flex flex-col justify-center cursor-grab active:cursor-grabbing select-none relative touch-none shadow-sm"
        (mousedown)="startDrag($event)"
        (touchstart)="startDrag($event)">

        <!-- Tall Screen Mobile Pull-Down Sheet Pill Indicator -->
        <div class="w-10 h-1 rounded-full bg-white/25 mx-auto -mt-0.5 mb-1 sm:hidden pointer-events-none"></div>

        <div class="flex items-center justify-between w-full">
          <!-- Window Title & Metadata -->
          <div class="flex items-center space-x-2.5 overflow-hidden">
            <svg class="w-4 h-4 text-[#3EB991] shrink-0 drop-shadow-[0_0_6px_rgba(62,185,145,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              <path d="M4 10h16"></path>
              <path d="M10 4v16"></path>
            </svg>
            <span class="font-display font-semibold text-xs tracking-wide text-[#F5FFFA] truncate">{{ descriptor.title }}</span>
            <span class="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#8C94A8] border border-white/10">{{ descriptor.pid }}</span>
          </div>
          
          <!-- Desktop & Mobile Window Control Buttons (Tabler Sigils) -->
          <div class="flex items-center space-x-1.5" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
            <button 
              class="w-7 h-7 rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-[#8C94A8] hover:text-white transition-colors border border-transparent hover:border-white/10"
              (click)="onMinimize()"
              title="Minimize Window">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <button 
              class="w-7 h-7 rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-[#8C94A8] hover:text-white transition-colors border border-transparent hover:border-white/10"
              (click)="onMaximize()"
              title="Toggle Fullscreen">
              @if (bounds.isMaximized) {
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 19v-2a2 2 0 0 1 2 -2h2"></path>
                  <path d="M15 5v2a2 2 0 0 0 2 2h2"></path>
                  <path d="M5 15h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M5 9h2a2 2 0 0 0 2 -2v-2"></path>
                </svg>
              } @else {
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                  <path d="M9 4v16"></path>
                </svg>
              }
            </button>
            <button 
              class="w-7 h-7 rounded-lg hover:bg-[#FF4D6D]/20 active:bg-[#FF4D6D]/40 flex items-center justify-center text-[#8C94A8] hover:text-[#FF4D6D] transition-colors border border-transparent hover:border-[#FF4D6D]/30"
              (click)="onClose()"
              title="Close Application">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6l-12 12"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Live Pull-Down-to-Dismiss Visual Indicator -->
      @if (pullDistance() > 40) {
        <div class="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-[#151922]/95 border border-[#E0218A]/50 text-white shadow-2xl flex items-center space-x-2 pointer-events-none transition-all">
          <span class="material-icons text-sm text-[#FF2A9D] animate-bounce">
            {{ pullDistance() > 95 ? 'close' : 'south' }}
          </span>
          <span class="text-[11px] font-display font-medium">
            {{ pullDistance() > 95 ? 'Release to close' : 'Pull down to dismiss' }}
          </span>
        </div>
      }

      <!-- Window Body -->
      <div class="window-body flex-1 overflow-auto bg-[#0E1015]/95 p-3 md:p-4 relative">
        @switch (descriptor.entryComponent) {
          @case ('AppStoreComponent') {
            <app-app-store [pid]="descriptor.pid" />
          }
          @case ('AgentFsExplorerComponent') {
            <app-agentfs-explorer [pid]="descriptor.pid" />
          }
          @case ('WopiOfficeComponent') {
            <app-wopi-office [pid]="descriptor.pid" />
          }
          @case ('GatewayConsoleComponent') {
            <app-gateway-console [pid]="descriptor.pid" />
          }
          @case ('TerminalComponent') {
            <app-terminal [pid]="descriptor.pid" />
          }
          @case ('SettingsComponent') {
            <app-settings [pid]="descriptor.pid" />
          }
          @case ('SecurityAuditComponent') {
            <app-security-audit [pid]="descriptor.pid" />
          }
          @case ('AppwriteDatabasesComponent') {
            <app-appwrite-databases [pid]="descriptor.pid" />
          }
          @case ('AppLauncherComponent') {
            <app-app-launcher [pid]="descriptor.pid" />
          }
          @case ('AgenticValueFrameworkComponent') {
            <app-agentic-value-framework [pid]="descriptor.pid" />
          }
          @case ('ChatWindowComponent') {
            <app-chat-window [pid]="descriptor.pid" />
          }
          @case ('RemoteContainerComponent') {
            <app-remote-container [pid]="descriptor.pid" [descriptor]="descriptor" />
          }
          @default {
            <app-remote-container [pid]="descriptor.pid" [descriptor]="descriptor" />
          }
        }
        
        <!-- Large Touch-Accessible Resize Handles (Desktop & Touch) -->
        @if (!bounds.isMaximized) {
          <div class="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize touch-none" (mousedown)="startResize($event, 'right')" (touchstart)="startResize($event, 'right')"></div>
          <div class="absolute left-0 right-0 bottom-0 h-4 cursor-row-resize touch-none" (mousedown)="startResize($event, 'bottom')" (touchstart)="startResize($event, 'bottom')"></div>
          <div class="absolute right-0 bottom-0 w-8 h-8 cursor-nwse-resize touch-none flex items-end justify-end p-1" (mousedown)="startResize($event, 'bottom-right')" (touchstart)="startResize($event, 'bottom-right')">
            <!-- Tactile Corner Resize Grip -->
            <div class="w-3 h-3 border-r-2 border-b-2 border-[#20B2AA]/50 rounded-br pointer-events-none"></div>
          </div>
        }
      </div>

      <!-- Tall Screens & Mobile Thumb Reachability Bottom Bar -->
      @if (windowMgr.isMobile() || windowMgr.isTallScreen()) {
        <div class="h-12 bg-[#151922]/95 border-t border-white/10 px-3 flex items-center justify-between select-none shrink-0 z-30 touch-none">
          <!-- Window Navigation: Previous / Next Window Buttons -->
          <div class="flex items-center space-x-1.5">
            <button 
              class="w-8 h-8 rounded-lg bg-white/5 active:bg-white/20 flex items-center justify-center text-[#8C94A8] active:text-white transition-colors"
              (click)="onPrevWindow($event)"
              title="Previous Open Window">
              <span class="material-icons text-base">chevron_left</span>
            </button>
            <span class="text-[10px] font-mono text-[#8C94A8] px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              {{ windowPosition().current }}/{{ windowPosition().total }}
            </span>
            <button 
              class="w-8 h-8 rounded-lg bg-white/5 active:bg-white/20 flex items-center justify-center text-[#8C94A8] active:text-white transition-colors"
              (click)="onNextWindow($event)"
              title="Next Open Window">
              <span class="material-icons text-base">chevron_right</span>
            </button>
          </div>

          <!-- Center Touch Gesture Pill for Easy Thumb Swipe -->
          <div 
            class="flex flex-col items-center justify-center px-4 py-1 rounded-full bg-white/5 border border-white/10 active:bg-[#20B2AA]/20 cursor-grab active:cursor-grabbing"
            (touchstart)="startBottomGesture($event)">
            <div class="w-8 h-1 rounded-full bg-white/40"></div>
            <span class="text-[8px] font-mono text-[#8C94A8] uppercase tracking-widest mt-0.5">Gesture</span>
          </div>

          <!-- Thumb Actions: Minimize, Maximize, Close -->
          <div class="flex items-center space-x-1">
            <button 
              class="w-8 h-8 rounded-lg bg-white/5 active:bg-white/20 flex items-center justify-center text-[#8C94A8] active:text-white transition-colors"
              (click)="onMinimize()"
              title="Minimize to Dock">
              <span class="material-icons text-base">keyboard_arrow_down</span>
            </button>
            <button 
              class="w-8 h-8 rounded-lg bg-white/5 active:bg-white/20 flex items-center justify-center text-[#8C94A8] active:text-white transition-colors"
              (click)="onMaximize()"
              title="Toggle Window Size">
              <span class="material-icons text-base">{{ bounds.isMaximized ? 'fullscreen_exit' : 'fullscreen' }}</span>
            </button>
            <button 
              class="w-8 h-8 rounded-lg bg-[#FF4D6D]/15 active:bg-[#FF4D6D]/35 flex items-center justify-center text-[#FF4D6D] transition-colors"
              (click)="onClose()"
              title="Close Application">
              <span class="material-icons text-base">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class WindowComponent {
  @Input({ required: true }) descriptor!: ProcessDescriptor;
  @Input({ required: true }) bounds!: WindowBounds;

  protected windowMgr = inject(WindowManagerService);

  public isFocused = computed(() => this.bounds.zIndex === this.windowMgr.topZIndex());
  public isMobileMaximized = computed(() => this.bounds.isMaximized && this.windowMgr.isMobile());
  public windowPosition = computed(() => this.windowMgr.getWindowPositionInfo(this.descriptor.pid));

  public isDragging = signal<boolean>(false);
  public isPulling = signal<boolean>(false);
  public pullDistance = signal<number>(0);
  public isSpringBack = signal<boolean>(false);
  public isDismissing = signal<boolean>(false);

  private lastTapTime = 0;
  private hapticTriggeredThreshold = false;

  public windowTransform = computed(() => {
    if (this.isDismissing()) {
      return 'translate3d(0, 120%, 0) scale(0.85)';
    }
    if (this.pullDistance() > 0) {
      const pull = this.pullDistance();
      const scale = Math.max(0.88, 1 - (pull / 1200));
      return `translate3d(0, ${pull}px, 0) scale(${scale})`;
    }
    if (this.bounds.isMaximized) {
      return 'translate3d(0px, 0px, 0px)';
    }
    return `translate3d(${this.bounds.x}px, ${this.bounds.y}px, 0)`;
  });

  public windowOpacity = computed(() => {
    if (this.isDismissing()) return 0;
    if (this.pullDistance() > 0) {
      return Math.max(0.4, 1 - (this.pullDistance() / 500));
    }
    return 1;
  });

  protected readonly window = window;

  public onFocus(): void {
    this.windowMgr.focusWindow(this.descriptor.pid);
  }

  public onMinimize(): void {
    this.windowMgr.minimizeWindow(this.descriptor.pid);
  }

  public onMaximize(): void {
    this.windowMgr.maximizeWindow(this.descriptor.pid);
  }

  public onClose(): void {
    this.windowMgr.terminateProcess(this.descriptor.pid);
  }

  public onPrevWindow(event: Event): void {
    event.stopPropagation();
    this.windowMgr.prevWindow(this.descriptor.pid);
  }

  public onNextWindow(event: Event): void {
    event.stopPropagation();
    this.windowMgr.nextWindow(this.descriptor.pid);
  }

  public startDrag(event: MouseEvent | TouchEvent): void {
    this.onFocus();
    
    // Check for double-tap to toggle maximize
    const now = Date.now();
    if (now - this.lastTapTime < 320) {
      this.onMaximize();
      this.lastTapTime = 0;
      this.windowMgr.triggerHaptic(15);
      return;
    }
    this.lastTapTime = now;

    const isTouch = 'touches' in event;
    
    // Two-finger pinch gesture
    if (isTouch && event.touches.length === 2) {
      this.handlePinch(event);
      return;
    }

    const clientX = isTouch ? event.touches[0].clientX : event.clientX;
    const clientY = isTouch ? event.touches[0].clientY : event.clientY;
    const startX = clientX;
    const startY = clientY;
    const initialX = this.bounds.x;
    const initialY = this.bounds.y;
    this.hapticTriggeredThreshold = false;

    // If maximized or on mobile, handle Pull-Down to Dismiss and Horizontal Swiping
    const isLockedFullScreen = this.bounds.isMaximized || this.windowMgr.isMobile();

    this.isDragging.set(!isLockedFullScreen);
    this.isPulling.set(isLockedFullScreen);

    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = cx - startX;
      const dy = cy - startY;

      if (isLockedFullScreen) {
        // Vertical pull-down gesture
        if (dy > 0) {
          this.pullDistance.set(dy);
          if (dy > 95 && !this.hapticTriggeredThreshold) {
            this.windowMgr.triggerHaptic(15);
            this.hapticTriggeredThreshold = true;
          } else if (dy <= 95 && this.hapticTriggeredThreshold) {
            this.hapticTriggeredThreshold = false;
          }
        } else {
          this.pullDistance.set(0);
        }
      } else {
        // Desktop window repositioning
        this.windowMgr.updateBounds(this.descriptor.pid, {
          x: Math.max(0, initialX + dx),
          y: Math.max(40, initialY + dy)
        });
      }
    };

    const onEnd = (e: MouseEvent | TouchEvent) => {
      window.removeEventListener('mousemove', onMove as EventListener);
      window.removeEventListener('mouseup', onEnd as EventListener);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onEnd as EventListener);
      window.removeEventListener('touchcancel', onEnd as EventListener);

      this.isDragging.set(false);
      this.isPulling.set(false);

      if (isLockedFullScreen) {
        const pull = this.pullDistance();
        if (pull > 95) {
          // Trigger dismiss animation then close
          this.isDismissing.set(true);
          this.windowMgr.triggerHaptic(20);
          setTimeout(() => {
            this.onClose();
          }, 240);
        } else {
          // Check for horizontal swipe gesture (switch active window)
          const cx = 'changedTouches' in e && e.changedTouches ? e.changedTouches[0].clientX : 0;
          const dx = cx - startX;
          if (Math.abs(dx) > 75 && pull < 30) {
            if (dx < 0) {
              this.windowMgr.nextWindow(this.descriptor.pid);
            } else {
              this.windowMgr.prevWindow(this.descriptor.pid);
            }
          }

          // Spring back smoothly
          this.isSpringBack.set(true);
          this.pullDistance.set(0);
          setTimeout(() => {
            this.isSpringBack.set(false);
          }, 300);
        }
      }
    };

    if (isTouch) {
      window.addEventListener('touchmove', onMove as EventListener, { passive: true });
      window.addEventListener('touchend', onEnd as EventListener);
      window.addEventListener('touchcancel', onEnd as EventListener);
    } else {
      window.addEventListener('mousemove', onMove as EventListener);
      window.addEventListener('mouseup', onEnd as EventListener);
    }
  }

  public startBottomGesture(event: TouchEvent): void {
    event.stopPropagation();
    if (event.touches.length === 0) return;
    const startX = event.touches[0].clientX;
    const startY = event.touches[0].clientY;

    const onMove = (e: TouchEvent) => {
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;
      const dx = cx - startX;
      const dy = cy - startY;
      if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
        this.pullDistance.set(dy);
      }
    };

    const onEnd = (e: TouchEvent) => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);

      const cx = e.changedTouches[0].clientX;
      const cy = e.changedTouches[0].clientY;
      const dx = cx - startX;
      const dy = cy - startY;

      if (dy > 80) {
        this.onMinimize();
      } else if (dy < -60) {
        this.windowMgr.toggleDock();
      } else if (Math.abs(dx) > 60) {
        if (dx < 0) {
          this.windowMgr.nextWindow(this.descriptor.pid);
        } else {
          this.windowMgr.prevWindow(this.descriptor.pid);
        }
      }

      this.isSpringBack.set(true);
      this.pullDistance.set(0);
      setTimeout(() => this.isSpringBack.set(false), 300);
    };

    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  private handlePinch(event: TouchEvent): void {
    if (event.touches.length < 2) return;
    const initialDist = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    const initialWidth = this.bounds.width;
    const initialHeight = this.bounds.height;

    const onPinchMove = (e: TouchEvent) => {
      if (e.touches.length < 2) return;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialDist;

      if (ratio > 1.45 && !this.bounds.isMaximized) {
        this.onMaximize();
      } else if (ratio < 0.75 && this.bounds.isMaximized) {
        this.onMaximize();
      } else if (!this.bounds.isMaximized) {
        this.windowMgr.updateBounds(this.descriptor.pid, {
          width: Math.max(260, Math.min(window.innerWidth, initialWidth * ratio)),
          height: Math.max(200, Math.min(window.innerHeight - 80, initialHeight * ratio))
        });
      }
    };

    const onPinchEnd = () => {
      window.removeEventListener('touchmove', onPinchMove);
      window.removeEventListener('touchend', onPinchEnd);
    };

    window.addEventListener('touchmove', onPinchMove, { passive: true });
    window.addEventListener('touchend', onPinchEnd);
  }

  public startResize(event: MouseEvent | TouchEvent, direction: 'right' | 'bottom' | 'bottom-right'): void {
    if (this.bounds.isMaximized) return;
    this.onFocus();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const startX = clientX;
    const startY = clientY;
    const initialWidth = this.bounds.width;
    const initialHeight = this.bounds.height;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = cx - startX;
      const dy = cy - startY;
      const updates: Partial<WindowBounds> = {};
      if (direction === 'right' || direction === 'bottom-right') updates.width = Math.max(260, initialWidth + dx);
      if (direction === 'bottom' || direction === 'bottom-right') updates.height = Math.max(180, initialHeight + dy);
      this.windowMgr.updateBounds(this.descriptor.pid, updates);
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove as EventListener);
      window.removeEventListener('mouseup', onEnd as EventListener);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onEnd as EventListener);
    };

    if ('touches' in event) {
      window.addEventListener('touchmove', onMove as EventListener, { passive: true });
      window.addEventListener('touchend', onEnd as EventListener);
    } else {
      window.addEventListener('mousemove', onMove as EventListener);
      window.addEventListener('mouseup', onEnd as EventListener);
    }
  }
}

