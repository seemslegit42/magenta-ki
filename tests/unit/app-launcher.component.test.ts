import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Injector, runInInjectionContext } from '@angular/core';
import {
  AppLauncherComponent,
  type AppLauncherItem,
} from '../../src/app/components/apps/app-launcher/app-launcher.component';
import { WindowManagerService } from '../../src/app/services/window-manager.service';
import { NativeFederationService } from '../../src/app/services/native-federation.service';

describe('AppLauncherComponent', () => {
  let component: AppLauncherComponent;
  let windowManager: WindowManagerService;
  let injector: Injector;

  beforeEach(() => {
    windowManager = new WindowManagerService();
    const federation = new NativeFederationService();
    injector = Injector.create({
      providers: [
        { provide: WindowManagerService, useValue: windowManager },
        { provide: NativeFederationService, useValue: federation },
      ],
    });
    component = runInInjectionContext(injector, () => new AppLauncherComponent());
  });

  afterEach(() => {
    component.searchControl.setValue('');
    component.selectedCategory.set('all');
  });

  it('should create the AppLauncherComponent instance', () => {
    expect(component).toBeTruthy();
  });

  it('should provide default categories with "all" selected initially', () => {
    expect(component.categories.length).toBeGreaterThanOrEqual(5);
    expect(component.selectedCategory()).toBe('all');
  });

  it('should list all core applications and federated micro-frontends', () => {
    const apps = component.allApps();
    expect(apps.length).toBeGreaterThanOrEqual(9);

    const appwrite = apps.find((a: AppLauncherItem) => a.id === 'appwrite-databases');
    expect(appwrite).toBeDefined();
    expect(appwrite?.name).toContain('Appwrite');

    const federated = apps.filter((a: AppLauncherItem) => a.isFederated);
    expect(federated.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter applications by category', () => {
    component.selectedCategory.set('database');
    const dbApps = component.filteredApps();
    expect(dbApps.length).toBeGreaterThan(0);
    expect(dbApps.every((a: AppLauncherItem) => a.category === 'database')).toBe(true);

    component.selectedCategory.set('ai');
    const aiApps = component.filteredApps();
    expect(aiApps.length).toBeGreaterThan(0);
    expect(aiApps.every((a: AppLauncherItem) => a.category === 'ai')).toBe(true);
  });

  it('should filter applications by search query', () => {
    component.searchControl.setValue('terminal');
    const results = component.filteredApps();
    expect(results.some((a: AppLauncherItem) => a.id === 'terminal')).toBe(true);
    expect(results.length).toBeLessThan(component.allApps().length);
  });

  it('should integrate with WindowManagerService to launch an application', () => {
    const terminalApp = component.allApps().find((a: AppLauncherItem) => a.id === 'terminal');
    expect(terminalApp).toBeDefined();

    if (terminalApp) {
      component.launch(terminalApp);
      const openProcs = windowManager.processes().filter((p) => p.isOpen);
      expect(openProcs.some((p) => p.appId === 'terminal' || p.pid.includes('terminal'))).toBe(true);
    }
  });

  it('should detect running process state and restore/focus when already launched', () => {
    const wopiApp = component.allApps().find((a: AppLauncherItem) => a.id === 'wopi-office');
    expect(wopiApp).toBeDefined();

    if (wopiApp) {
      component.launch(wopiApp);
      const procState = component.getProcessState(wopiApp.id);
      expect(procState).toBeDefined();
      expect(procState?.isOpen).toBe(true);

      if (procState) {
        windowManager.minimizeWindow(procState.pid);
        expect(component.isProcessMinimized(procState.pid)).toBe(true);

        component.launch(wopiApp);
        expect(component.isProcessMinimized(procState.pid)).toBe(false);
      }
    }
  });

  it('should launch core essentials suite', () => {
    component.launchAllEssentials();
    const openProcs = windowManager.processes().filter((p) => p.isOpen);
    expect(openProcs.length).toBeGreaterThanOrEqual(2);
  });
});
