import { describe, it, expect } from 'bun:test';
import {
  canonicalizeAppwriteFolder,
  toAppwriteFolder,
} from '../../bun/internal/storage/types';

describe('Appwrite virtual folder helpers', () => {
  it('maps domain paths to Appwrite folder form with trailing slash', () => {
    expect(toAppwriteFolder('/')).toBe('');
    expect(toAppwriteFolder('/photos/2026')).toBe('photos/2026/');
    expect(toAppwriteFolder('photos/2026')).toBe('photos/2026/');
  });

  it('canonicalizes folder input the way createFile / Query.equal expect', () => {
    expect(canonicalizeAppwriteFolder('')).toBe('');
    expect(canonicalizeAppwriteFolder('photos/2026')).toBe('photos/2026/');
    expect(canonicalizeAppwriteFolder('photos/2026/')).toBe('photos/2026/');
  });

  it('rejects illegal Appwrite folder paths', () => {
    expect(() => canonicalizeAppwriteFolder('/photos')).toThrow(/must not start/);
    expect(() => canonicalizeAppwriteFolder('photos//2026')).toThrow(/segment/);
    expect(() => canonicalizeAppwriteFolder('photos/../x')).toThrow(/segment/);
  });
});
