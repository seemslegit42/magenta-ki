import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusbarComponent } from './components/statusbar/statusbar.component';
import { DockComponent } from './components/dock/dock.component';
import { WindowComponent } from './components/window/window.component';
import { SearchComponent } from './components/search/search.component';
import { WindowManagerService } from './services/window-manager.service';
import { DesktopBackdropComponent } from './components/desktop/desktop-backdrop.component';
import { ShellThemeService } from './services/shell-theme.service';
import { ShellChromeService } from './services/shell-chrome.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    StatusbarComponent,
    DockComponent,
    WindowComponent,
    SearchComponent,
    DesktopBackdropComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly windowManager = inject(WindowManagerService);
  /** Bootstrap shell appearance services (theme + ambient chrome). */
  private readonly _shellTheme = inject(ShellThemeService);
  private readonly _shellChrome = inject(ShellChromeService);
}
