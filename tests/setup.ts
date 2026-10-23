/**
 * Global Bun test preload — `bunfig.toml` `[test].preload`.
 * File-scoped / describe-scoped hooks stay in individual test files.
 */
import '@angular/compiler';
import { afterEach, mock } from 'bun:test';

afterEach(() => {
  mock.clearAllMocks();
});
