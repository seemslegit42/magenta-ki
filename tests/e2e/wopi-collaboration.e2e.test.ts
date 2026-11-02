import { describe, it, expect } from 'bun:test';
import { WopiService } from '../../src/app/services/wopi.service';

describe('E2E: WOPI Office Suite & Collaborative Editing Flow', () => {
  it('should manage collaborative document editing lifecycle with atomic lock validation and persistence', () => {
    const wopi = new WopiService();
    const fileId = 'doc_101';

    // 1. Discovery: Enumerate documents and inspect file info
    const allDocs = wopi.getDocuments();
    expect(allDocs.length).toBeGreaterThan(0);

    const fileInfo = wopi.checkFileInfo(fileId);
    expect(fileInfo).not.toBeNull();
    expect(fileInfo!.baseFileName).toBe('Q3_Strategic_Enterprise_Roadmap.docx');
    expect(fileInfo!.userCanWrite).toBe(true);
    expect(fileInfo!.supportsLocks).toBe(true);

    // 2. Initial Download: Stream document content via GetFile
    const initialContent = wopi.getFile(fileId);
    expect(initialContent).toContain('Executive Summary');

    // 3. Concurrency Protection: User 1 acquires X-WOPI-Lock
    const user1LockToken = wopi.acquireLock(fileId);
    expect(user1LockToken.startsWith('lock_')).toBe(true);

    // 4. Collaborative Conflict Test: User 2 attempts concurrent save without valid lock
    const conflictingContent = 'Unauthorized simultaneous revision by User 2';
    expect(() => {
      wopi.putFile(fileId, conflictingContent, 'user_2_stale_lock_token');
    }).toThrow('Lock contention failure');

    // Ensure document remains uncorrupted
    expect(wopi.getFile(fileId)).toBe(initialContent);

    // 5. Authorized Save: User 1 commits edits with valid lock token via PutFile
    const updatedContent = `${initialContent}\n\n3. Q3 Milestones Achieved:\n- Native Federation App Store deployed\n- AgentFS OPFS WASM CoW activated`;
    const saveSuccess = wopi.putFile(fileId, updatedContent, user1LockToken);
    expect(saveSuccess).toBe(true);

    // 6. Verification: Document content and metadata updated
    const savedContent = wopi.getFile(fileId);
    expect(savedContent).toBe(updatedContent);
    expect(savedContent).toContain('Q3 Milestones Achieved');

    const updatedInfo = wopi.checkFileInfo(fileId)!;
    expect(updatedInfo.size).toBe(updatedContent.length);
    expect(Number(updatedInfo.version)).toBeGreaterThan(Number(fileInfo!.version));

    // 7. Lock Release: User 1 completes session and releases lock
    wopi.releaseLock(fileId);

    // 8. Subsequent User Write: User 2 can now edit since lock is released
    const user2NewContent = `${savedContent}\n- Verified by QA automation`;
    const user2SaveSuccess = wopi.putFile(fileId, user2NewContent);
    expect(user2SaveSuccess).toBe(true);
    expect(wopi.getFile(fileId)).toContain('Verified by QA automation');
  });
});
