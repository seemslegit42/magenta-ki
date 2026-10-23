import { describe, it, expect } from 'bun:test';
import { AgentFSService } from '../../ts/apps/host/app/services/agentfs.service';

describe('E2E: AgentFS Sandboxed VFS & Tool Execution Flow', () => {
  it('should execute end-to-end agent file mutations inside an isolated sandbox with audit trails', async () => {
    const vfs = new AgentFSService();

    // 1. Inode inspection: Agent inspects project config inode
    const initialInodes = vfs.allInodes()();
    expect(initialInodes.has(2)).toBe(true);
    const initialConfig = initialInodes.get(2)!.data!;
    expect(initialConfig).toContain('Verdigris WebOS Workspace');

    // 2. CoW Isolation: Snapshot created before executing mutations
    const snapshotId = vfs.createCowSnapshot('agent_code_refactoring');
    expect(snapshotId).toContain('agent_code_refactoring');

    // 3. Monitored Tool Execution 1: Read and analyze workspace
    const analyzeOutput = await vfs.executeMonitoredTool(
      'analyze_workspace_files',
      { snapshotId, targetInodes: [1, 2, 3] },
      async () => {
        return {
          filesScanned: 3,
          suggestedModifications: ['add_sync_adapter', 'bump_version'],
          safetyScore: 0.98
        };
      }
    );
    expect(analyzeOutput.filesScanned).toBe(3);
    expect(analyzeOutput.safetyScore).toBe(0.98);

    // 4. File Mutation: Agent writes code update to inode
    const updatedWorkspaceCode = `${initialConfig}\n\n// Added by Autonomous Agent in CoW snapshot ${snapshotId}\nexport const TURSO_EDGE_ENABLED = true;`;
    vfs.writeFile(2, updatedWorkspaceCode);

    // 5. Verification: Inode state reflects changes with updated size and timestamp
    const modifiedInode = vfs.allInodes()().get(2)!;
    expect(modifiedInode.data).toBe(updatedWorkspaceCode);
    expect(modifiedInode.size).toBe(updatedWorkspaceCode.length);
    expect(modifiedInode.data).toContain('TURSO_EDGE_ENABLED');

    // 6. Monitored Tool Execution 2: Run verification tests on sandbox
    const testOutput = await vfs.executeMonitoredTool(
      'run_sandbox_linter',
      { targetInode: 2, strictMode: true },
      async () => {
        return { lintErrors: 0, warnings: 0, passed: true };
      }
    );
    expect(testOutput.passed).toBe(true);

    // 7. Audit Log Integrity Check: Ensure both executions are recorded in append-only log
    const auditLogs = vfs.allToolCalls()();
    expect(auditLogs.length).toBeGreaterThanOrEqual(2);

    const toolNames = auditLogs.map(call => call.toolName);
    expect(toolNames).toContain('run_sandbox_linter');
    expect(toolNames).toContain('analyze_workspace_files');

    // Both recent calls should have completion timestamps and valid output
    const lintCall = auditLogs.find(c => c.toolName === 'run_sandbox_linter')!;
    expect(lintCall.completedAt).toBeDefined();
    expect((lintCall.result as any).passed).toBe(true);
  });
});
