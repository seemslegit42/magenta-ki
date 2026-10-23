import { describe, it, expect, beforeEach } from 'bun:test';
import { AgentFSService } from '../../ts/apps/host/app/services/agentfs.service';

describe('AgentFSService', () => {
  let service: AgentFSService;

  beforeEach(() => {
    service = new AgentFSService();
  });

  it('should initialize with default inodes including root directory and seed files', () => {
    const inodes = service.allInodes()();
    expect(inodes.has(1)).toBe(true);
    expect(inodes.has(2)).toBe(true);
    expect(inodes.has(3)).toBe(true);

    const root = inodes.get(1)!;
    expect(root.mode).toBe(16877); // directory mode

    const workspaceMd = inodes.get(2)!;
    expect(workspaceMd.data).toContain('Verdigris WebOS Workspace');
  });

  it('should write data to an existing inode and update its size and mtime', () => {
    const newContent = 'console.log("Hello from AgentFS");';
    service.writeFile(2, newContent);

    const updatedNode = service.allInodes()().get(2)!;
    expect(updatedNode.data).toBe(newContent);
    expect(updatedNode.size).toBe(newContent.length);
    expect(updatedNode.mtime).toBeGreaterThan(0);
  });

  it('should record successful monitored tool executions in append-only audit log', async () => {
    const initialCallCount = service.allToolCalls()().length;

    const result = await service.executeMonitoredTool(
      'compile_sandbox',
      { target: '/workspace.md' },
      async () => {
        return { status: 'build_ok', durationMs: 42 };
      }
    );

    expect(result.status).toBe('build_ok');
    const calls = service.allToolCalls()();
    expect(calls.length).toBe(initialCallCount + 1);

    const latest = calls[0];
    expect(latest.toolName).toBe('compile_sandbox');
    expect(latest.parameters).toEqual({ target: '/workspace.md' });
    expect(latest.result).toEqual({ status: 'build_ok', durationMs: 42 });
    expect(latest.completedAt).toBeDefined();
    expect(latest.errorMessage).toBeUndefined();
  });

  it('should record failed monitored tool executions with error message', async () => {
    const initialCallCount = service.allToolCalls()().length;

    await expect(
      service.executeMonitoredTool(
        'failing_tool',
        { flag: true },
        async () => {
          throw new Error('Sandbox segmentation fault');
        }
      )
    ).rejects.toThrow('Sandbox segmentation fault');

    const calls = service.allToolCalls()();
    expect(calls.length).toBe(initialCallCount + 1);

    const latest = calls[0];
    expect(latest.toolName).toBe('failing_tool');
    expect(latest.errorMessage).toBe('Sandbox segmentation fault');
    expect(latest.completedAt).toBeDefined();
  });

  it('should generate distinct Copy-on-Write (CoW) snapshot identifiers', () => {
    const snap1 = service.createCowSnapshot('agent_run_1');
    const snap2 = service.createCowSnapshot('agent_run_1');

    expect(snap1.startsWith('snap_')).toBe(true);
    expect(snap1).toContain('agent_run_1');
    expect(snap1).not.toBe(snap2);
  });
});
