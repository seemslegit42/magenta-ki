import { describe, it, expect, beforeEach } from 'bun:test';
import { AgentFSService } from '../../src/app/services/agentfs.service';

describe('Recycle Bin & Deletion Logic', () => {
  let agentFs: AgentFSService;

  beforeEach(() => {
    agentFs = new AgentFSService();
  });

  it('should delete a file from AgentFS and return the deleted inode for recycling', () => {
    const inodes = agentFs.allInodes()();
    expect(inodes.has(2)).toBe(true);

    const deleted = agentFs.deleteFile(2);
    expect(deleted).toBeDefined();
    expect(deleted?.id).toBe(2);
    expect(deleted?.name).toBe('workspace.md');

    // Inode should no longer exist in active filesystem
    expect(agentFs.allInodes()().has(2)).toBe(false);
  });

  it('should restore a previously deleted file back into AgentFS', () => {
    const deleted = agentFs.deleteFile(3);
    expect(deleted).toBeDefined();
    expect(agentFs.allInodes()().has(3)).toBe(false);

    // Restore back into AgentFS
    agentFs.restoreFile(deleted!);
    expect(agentFs.allInodes()().has(3)).toBe(true);

    const restored = agentFs.allInodes()().get(3)!;
    expect(restored.name).toBe('config.json');
    expect(restored.data).toContain('enterprise-crm');
  });

  it('should handle deleting non-existent inode safely', () => {
    const deleted = agentFs.deleteFile(99999);
    expect(deleted).toBeNull();
  });
});
