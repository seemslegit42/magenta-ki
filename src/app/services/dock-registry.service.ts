import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DockRegistryService {
  private readonly pinnedApps = signal<string[]>([
    'app-launcher',
    'app-store',
    'native-federation',
    'recycle-bin'
  ]);

  readonly pinned = this.pinnedApps.asReadonly();

  pin(appId: string): void {
    this.pinnedApps.update(apps => (apps.includes(appId) ? apps : [...apps, appId]));
  }

  unpin(appId: string): void {
    this.pinnedApps.update(apps => apps.filter(id => id !== appId));
  }
}
