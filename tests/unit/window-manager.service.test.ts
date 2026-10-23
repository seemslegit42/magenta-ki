import { describe, it, expect, beforeEach } from 'bun:test';
import { WindowManagerService } from '../../src/app/services/window-manager.service';

describe('WindowManagerService', () => {
  let service: WindowManagerService;

  beforeEach(() => {
    service = new WindowManagerService();
  });

  it('should initialize with empty active processes and open windows', () => {
    expect(service.activeProcesses().length).toBe(0);
    expect(service.openWindows().length).toBe(0);
  });

  it('should spawn a new process and allocate initial bounds', () => {
    const pid = service.spawnProcess('app-store', 'App Store', 'storefront', 'AppStoreComponent', 'system');
    expect(pid).toBeDefined();
    expect(pid.startsWith('proc_')).toBe(true);

    const processes = service.activeProcesses();
    expect(processes.length).toBe(1);
    expect(processes[0].pid).toBe(pid);
    expect(processes[0].title).toBe('App Store');
    expect(processes[0].state).toBe('RUNNING');

    const windows = service.openWindows();
    expect(windows.length).toBe(1);
    expect(windows[0][0]).toBe(pid);
    expect(windows[0][1].isMinimized).toBe(false);
  });

  it('should focus a window and elevate its zIndex', () => {
    const pid1 = service.spawnProcess('app-1', 'App 1', 'icon1', 'Comp1');
    const pid2 = service.spawnProcess('app-2', 'App 2', 'icon2', 'Comp2');

    const initialZ1 = service.openWindows().find(([id]) => id === pid1)![1].zIndex;
    const initialZ2 = service.openWindows().find(([id]) => id === pid2)![1].zIndex;
    expect(initialZ2).toBeGreaterThan(initialZ1);

    // Focus window 1
    service.focusWindow(pid1);
    const updatedZ1 = service.openWindows().find(([id]) => id === pid1)![1].zIndex;
    expect(updatedZ1).toBeGreaterThan(initialZ2);
  });

  it('should toggle window minimization', () => {
    const pid = service.spawnProcess('test-app', 'Test App', 'icon', 'Comp');
    service.minimizeWindow(pid);
    expect(service.openWindows().find(([id]) => id === pid)![1].isMinimized).toBe(true);

    service.minimizeWindow(pid);
    expect(service.openWindows().find(([id]) => id === pid)![1].isMinimized).toBe(false);
  });

  it('should toggle window maximization', () => {
    const pid = service.spawnProcess('test-app', 'Test App', 'icon', 'Comp');
    service.maximizeWindow(pid);
    expect(service.openWindows().find(([id]) => id === pid)![1].isMaximized).toBe(true);

    service.maximizeWindow(pid);
    expect(service.openWindows().find(([id]) => id === pid)![1].isMaximized).toBe(false);
  });

  it('should update window bounds dynamically', () => {
    const pid = service.spawnProcess('test-app', 'Test App', 'icon', 'Comp');
    service.updateBounds(pid, { x: 350, y: 220, width: 1024, height: 768 });

    const bounds = service.openWindows().find(([id]) => id === pid)![1];
    expect(bounds.x).toBe(350);
    expect(bounds.y).toBe(220);
    expect(bounds.width).toBe(1024);
    expect(bounds.height).toBe(768);
  });

  it('should terminate a process and dispose window state', () => {
    const pid = service.spawnProcess('test-app', 'Test App', 'icon', 'Comp');
    expect(service.activeProcesses().length).toBe(1);

    service.terminateProcess(pid);
    expect(service.activeProcesses().length).toBe(0);
    expect(service.openWindows().length).toBe(0);
  });

  it('should initialize and provide tall screen and mobile signals', () => {
    expect(service.isMobile).toBeDefined();
    expect(service.isTallScreen).toBeDefined();
    expect(service.dockVisible()).toBe(true);
  });

  it('should toggle dock visibility', () => {
    service.toggleDock();
    expect(service.dockVisible()).toBe(false);
    service.toggleDock();
    expect(service.dockVisible()).toBe(true);
  });

  it('should spawn processes and track position info for window navigation', () => {
    service.spawnProcess('test-app-1', 'App 1', 'apps', 'AppStoreComponent', 'system');
    service.spawnProcess('test-app-2', 'App 2', 'terminal', 'TerminalComponent', 'developer');

    const info1 = service.getWindowPositionInfo('test-app-1');
    const info2 = service.getWindowPositionInfo('test-app-2');

    expect(info1.total).toBe(2);
    expect(info2.total).toBe(2);
    expect(info1.current).toBe(1);
    expect(info2.current).toBe(2);
  });

  it('should navigate between windows with nextWindow and prevWindow gestures', () => {
    service.spawnProcess('app-a', 'A', 'apps', 'AppStoreComponent', 'system');
    service.spawnProcess('app-b', 'B', 'terminal', 'TerminalComponent', 'developer');
    service.spawnProcess('app-c', 'C', 'settings', 'SettingsComponent', 'system');

    const nextPid = service.nextWindow('app-a');
    expect(nextPid).toBe('app-b');

    const prevPid = service.prevWindow('app-b');
    expect(prevPid).toBe('app-a');
  });

  it('should trigger haptic vibration safely without error', () => {
    expect(() => service.triggerHaptic(15)).not.toThrow();
  });
});
