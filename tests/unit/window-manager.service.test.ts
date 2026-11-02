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
});
