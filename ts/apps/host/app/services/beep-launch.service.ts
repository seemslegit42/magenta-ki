import { Injectable, inject } from '@angular/core';
import { BeepRemoteService } from './beep-remote.service';
import { WindowManagerService } from './window-manager.service';

@Injectable({ providedIn: 'root' })
export class BeepLaunchService {
  private readonly windowManager = inject(WindowManagerService);
  private readonly beepRemote = inject(BeepRemoteService);

  resolveUiOrigin(): string {
    return this.beepRemote.resolveUiOrigin();
  }

  /** Open or focus the B.E.E.P syndicate resource planning surface. */
  open(): string {
    void this.beepRemote.discoverUiOrigin().then((origin) => {
      this.beepRemote.syncRemoteRegistration(origin);
    });
    return this.windowManager.openApp({
      id: 'beep-erp',
      name: 'B.E.E.P',
      title: 'B.E.E.P — Syndicate Resource Planning',
      icon: 'beep',
      componentName: 'BeepErpWindowComponent',
      entryComponent: 'BeepErpWindowComponent',
      category: 'productivity',
    });
  }
}
