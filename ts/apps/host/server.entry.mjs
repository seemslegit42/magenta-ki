/**
 * Bun SSR bootstrap — @softarc/native-federation-orchestrator/node
 *
 * Bun exposes `module.register` but its loader-worker MessageChannel handshake
 * does not complete (set-import-map / hostInstances timeout). We still run the
 * full orchestration pipeline (manifest, remoteEntry, version resolve, shared
 * scope) and supply Bun-safe adapters so the Node loader client is not used.
 *
 * @see https://github.com/native-federation/orchestrator (docs/node.md)
 */
import { initNodeFederation } from '@softarc/native-federation-orchestrator/node';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const BROWSER = resolve(process.env.NF_BROWSER_DIR || resolve(ROOT, 'dist/app/browser'));
const SERVER = resolve(
  process.env.NF_SERVER_ENTRY || resolve(ROOT, 'dist/app/server/server.mjs'),
);

/** Last import map from the orchestrator (debug / future Bun resolve hooks). */
const importMap = { imports: {}, scopes: {} };

await initNodeFederation(pathToFileURL(resolve(BROWSER, 'federation.manifest.json')).href, {
  hostRemoteEntry: {
    url: pathToFileURL(resolve(BROWSER, 'remoteEntry.json')).href,
  },
  logLevel: process.env.NF_LOG_LEVEL || 'warn',
  feature: {
    convertFlatSharedInfo: true,
  },
  // Bypass Node loader client — required for Bun (loader ack never arrives).
  setImportMapFn: async (map) => {
    Object.assign(importMap.imports, map.imports ?? {});
    for (const [scope, entries] of Object.entries(map.scopes ?? {})) {
      importMap.scopes[scope] = { ...(importMap.scopes[scope] ?? {}), ...entries };
    }
  },
  loadModuleFn: async (url) => import(url),
});

await import(pathToFileURL(SERVER).href);
