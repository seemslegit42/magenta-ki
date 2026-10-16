import { describe, it, expect } from 'bun:test';
import { WindowManagerService } from '../../src/app/services/window-manager.service';

describe('E2E: Window Management System Flow', () => {
  it('should orchestrate a multi-window desktop session with focus stacking, positioning and lifecycle transitions', () => {
    const wm = new WindowManagerService();

    // 1. Initial State: Clean desktop
    expect(wm.activeProcesses().length).toBe(0);
    expect(wm.openWindows().length).toBe(0);

    // 2. Launch multiple applications from dock
    const pid1 = wm.spawnProcess('app-store', 'App Store', 'storefront', 'AppStoreComponent', 'system');
    const pid2 = wm.spawnProcess('agent-fs', 'AgentFS Explorer', 'folder_special', 'AgentFsExplorerComponent', 'developer');
    const pid3 = wm.spawnProcess('wopi-office', 'WOPI Office', 'description', 'WopiOfficeComponent', 'productivity');

    expect(wm.activeProcesses().length).toBe(3);
    expect(wm.openWindows().length).toBe(3);

    // 3. Staggered Positioning Verification (Syncopated Layout)
    const bounds1 = wm.openWindows().find(([id]) => id === pid1)![1];
    const bounds2 = wm.openWindows().find(([id]) => id === pid2)![1];
    const bounds3 = wm.openWindows().find(([id]) => id === pid3)![1];

    expect(bounds2.x).toBeGreaterThan(bounds1.x);
    expect(bounds3.x).toBeGreaterThan(bounds2.x);
    expect(bounds3.zIndex).toBeGreaterThan(bounds2.zIndex);
    expect(bounds2.zIndex).toBeGreaterThan(bounds1.zIndex);

    // 4. Focus Transition: Activate App Store (pid1)
    wm.focusWindow(pid1);
    const updatedBounds1 = wm.openWindows().find(([id]) => id === pid1)![1];
    expect(updatedBounds1.zIndex).toBeGreaterThan(bounds3.zIndex);
    expect(wm.topZIndex()).toBe(updatedBounds1.zIndex);

    // 5. Window Minimization: Minimize WOPI Office (pid3)
    wm.minimizeWindow(pid3);
    const minBounds3 = wm.openWindows().find(([id]) => id === pid3)![1];
    expect(minBounds3.isMinimized).toBe(true);

    // Restore WOPI Office
    wm.minimizeWindow(pid3);
    const restoredBounds3 = wm.openWindows().find(([id]) => id === pid3)![1];
    expect(restoredBounds3.isMinimized).toBe(false);

    // 6. Window Maximization: Maximize AgentFS (pid2)
    wm.maximizeWindow(pid2);
    const maxBounds2 = wm.openWindows().find(([id]) => id === pid2)![1];
    expect(maxBounds2.isMaximized).toBe(true);

    // Restore from maximization
    wm.maximizeWindow(pid2);
    const normalBounds2 = wm.openWindows().find(([id]) => id === pid2)![1];
    expect(normalBounds2.isMaximized).toBe(false);

    // 7. Spatial Repositioning (Drag interaction simulation)
    wm.updateBounds(pid1, { x: 420, y: 180, width: 960, height: 680 });
    const draggedBounds1 = wm.openWindows().find(([id]) => id === pid1)![1];
    expect(draggedBounds1.x).toBe(420);
    expect(draggedBounds1.y).toBe(180);
    expect(draggedBounds1.width).toBe(960);
    expect(draggedBounds1.height).toBe(680);

    // 8. Graceful Process Termination (Zero Memory Leaks)
    wm.terminateProcess(pid2);
    expect(wm.activeProcesses().length).toBe(2);
    expect(wm.openWindows().some(([id]) => id === pid2)).toBe(false);

    wm.terminateProcess(pid1);
    wm.terminateProcess(pid3);
    expect(wm.activeProcesses().length).toBe(0);
    expect(wm.openWindows().length).toBe(0);
  });
});
