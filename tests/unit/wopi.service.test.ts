import { describe, it, expect, beforeEach } from 'bun:test';
import { WopiService } from '../../src/app/services/wopi.service';

describe('WopiService', () => {
  let service: WopiService;

  beforeEach(() => {
    service = new WopiService();
  });

  it('should return initial seeded enterprise documents', () => {
    const docs = service.getDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(3);

    const docIds = docs.map(d => d.fileId);
    expect(docIds).toContain('doc_101');
    expect(docIds).toContain('doc_102');
    expect(docIds).toContain('doc_103');
  });

  it('should inspect file metadata via checkFileInfo', () => {
    const meta = service.checkFileInfo('doc_101');
    expect(meta).not.toBeNull();
    expect(meta!.baseFileName).toBe('Q3_Strategic_Enterprise_Roadmap.docx');
    expect(meta!.ownerId).toBe('system-enterprise-admin');
    expect(meta!.userCanWrite).toBe(true);
    expect(meta!.supportsLocks).toBe(true);
  });

  it('should return null for non-existent document ID', () => {
    const meta = service.checkFileInfo('doc_missing_999');
    expect(meta).toBeNull();
  });

  it('should stream raw file contents via getFile', () => {
    const content = service.getFile('doc_101');
    expect(content).toContain('Verdigris Cloud OS');
    expect(content).toContain('Executive Summary');
  });

  it('should acquire and release locks correctly', () => {
    const fileId = 'doc_101';
    const lockToken = service.acquireLock(fileId);
    expect(lockToken.startsWith('lock_')).toBe(true);

    // Save with correct lock token succeeds
    const success = service.putFile(fileId, 'Updated contents with valid lock', lockToken);
    expect(success).toBe(true);
    expect(service.getFile(fileId)).toBe('Updated contents with valid lock');

    // Release lock
    service.releaseLock(fileId);
  });

  it('should throw lock contention error when trying to write with mismatched lock token', () => {
    const fileId = 'doc_101';
    service.acquireLock(fileId);

    expect(() => {
      service.putFile(fileId, 'Unauthorized override', 'invalid_lock_token');
    }).toThrow('Lock contention failure');
  });

  it('should update file size and version timestamp on putFile', () => {
    const fileId = 'doc_102';
    const newContent = 'ColA\tColB\n1\t2';
    service.putFile(fileId, newContent);

    const updatedDoc = service.checkFileInfo(fileId)!;
    expect(updatedDoc.content).toBe(newContent);
    expect(updatedDoc.size).toBe(newContent.length);
    expect(Number(updatedDoc.version)).toBeGreaterThan(0);
  });
});
