import { WindowManagerService } from './window-manager.service';

describe('WindowManagerService Tall Screen, Touch and Gestures', () => {
  let service: WindowManagerService;

  beforeEach(() => {
    service = new WindowManagerService();
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
