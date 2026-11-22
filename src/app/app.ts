import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FeedbackHubComponent } from './components/apps/feedback-hub/feedback-hub.component';
import { UatPortalComponent } from './components/apps/uat-portal/uat-portal.component';
import { BeepAssistantComponent } from './components/common/beep-assistant.component';
import { DockComponent } from './components/dock/dock.component';
import { SearchComponent } from './components/search/search.component';
import { StatusbarComponent } from './components/statusbar/statusbar.component';
import { WindowComponent } from './components/window/window.component';
import { WindowManagerService } from './services/window-manager.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    StatusbarComponent,
    DockComponent,
    WindowComponent,
    SearchComponent,
    BeepAssistantComponent,
    UatPortalComponent,
    FeedbackHubComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly windowManager = inject(WindowManagerService);
  private readonly document = inject(DOCUMENT);

  readonly isStandaloneUatRoute = computed(() => {
    const pathname = this.document?.location?.pathname || '/';
    return pathname === '/uat' || pathname.startsWith('/uat/');
  });

  readonly isStandaloneFeedbackRoute = computed(() => {
    const pathname = this.document?.location?.pathname || '/';
    return pathname === '/feedback' || pathname.startsWith('/feedback/');
  });
}
