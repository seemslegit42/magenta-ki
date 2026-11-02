import { Injectable, signal } from '@angular/core';
import { ToolCallRecord, VfsInode } from '../models/webos.models';

@Injectable({ providedIn: 'root' })
export class AgentFSService {
  private inodes = signal<Map<number, VfsInode>>(new Map([
    [1, { id: 1, mode: 16877, size: 4096, mtime: Date.now(), data: '' }], // root directory
    [2, { id: 2, name: 'workspace.md', mode: 33188, size: 1024, mtime: Date.now(), data: '# Verdigris WebOS Workspace\nAutonomous Agent workspace initialized via AgentFS v2.' }],
    [3, { id: 3, name: 'config.json', mode: 33188, size: 2048, mtime: Date.now(), data: '{"project": "enterprise-crm", "version": "2.4.0", "sync": "turso"}' }],
    [4, { id: 4, name: 'llms.txt', mode: 33188, size: 1536, mtime: Date.now(), data: '# Native Federation — LLM & Developer Documentation\n\n## Overview\nNative Federation is a modern, standards-based alternative to Webpack Module Federation using ESM and Import Maps.\n\n## Configuration (federation.config.mjs)\nimport { withNativeFederation, fromPackageJson } from "@angular-architects/native-federation/config";\n\nexport default withNativeFederation({\n  name: "app",\n  shared: fromPackageJson({ singleton: true, strictVersion: true })\n});' }]
  ]));

  private toolCalls = signal<ToolCallRecord[]>([
    {
      id: 'call_001',
      toolName: 'read_workspace_config',
      parameters: { target: '/workspace.md' },
      result: { status: 'success', bytesRead: 1024 },
      startedAt: Date.now() - 3600000,
      completedAt: Date.now() - 3599000
    },
    {
      id: 'call_002',
      toolName: 'cow_snapshot_create',
      parameters: { overlayId: 'sandbox_refactor_v1' },
      result: { snapshotHash: 'sha256:8f9a2b...' },
      startedAt: Date.now() - 1800000,
      completedAt: Date.now() - 1799000
    }
  ]);

  public readonly allInodes = signal(this.inodes);
  public readonly allToolCalls = signal(this.toolCalls);

  public async executeMonitoredTool<T>(
    toolName: string,
    params: Record<string, unknown>,
    task: () => Promise<T>
  ): Promise<T> {
    const callId = `call_${crypto.randomUUID().slice(0, 6)}`;
    const startedAt = Date.now();
    
    const record: ToolCallRecord = {
      id: callId,
      toolName,
      parameters: params,
      startedAt
    };

    this.toolCalls.update(list => [record, ...list]);

    try {
      const output = await task();
      const completedAt = Date.now();
      this.toolCalls.update(list => 
        list.map(item => item.id === callId ? { ...item, result: output, completedAt } : item)
      );
      return output;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown tool execution failure';
      const completedAt = Date.now();
      this.toolCalls.update(list =>
        list.map(item => item.id === callId ? { ...item, errorMessage, completedAt } : item)
      );
      throw err;
    }
  }

  public writeFile(inodeId: number, data: string): void {
    this.inodes.update(map => {
      const updated = new Map(map);
      const current = updated.get(inodeId);
      if (current) {
        updated.set(inodeId, { ...current, size: data.length, mtime: Date.now(), data });
      }
      return updated;
    });
  }

  public deleteFile(inodeId: number): VfsInode | null {
    let deleted: VfsInode | null = null;
    this.inodes.update(map => {
      const updated = new Map(map);
      const current = updated.get(inodeId);
      if (current) {
        deleted = { ...current };
        updated.delete(inodeId);
      }
      return updated;
    });
    return deleted;
  }

  public restoreFile(inode: VfsInode): void {
    const numId = Number(inode.id);
    this.inodes.update(map => {
      const updated = new Map(map);
      updated.set(numId, { ...inode, id: numId });
      return updated;
    });
  }

  public createCowSnapshot(sandboxName: string): string {
    const snapId = `snap_${crypto.randomUUID().slice(0, 8)}_${sandboxName}`;
    return snapId;
  }
}
