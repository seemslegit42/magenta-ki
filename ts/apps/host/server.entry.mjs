/**
 * Bun SSR bootstrap — @softarc/native-federation-orchestrator/node
 *
 * Bun implements `module.register` but does not run Node customization-hook
 * resolve for bare specifiers, and its MessageChannel loader handshake never
 * acks. We still run the full orchestration pipeline, then install a Bun
 * `onLoad` plugin that rewrites federated bare imports in `dist/app/{server,
 * browser}` to the absolute URLs from the orchestrator's import map (same
 * mapping Softarc's node-loader would apply).
 *
 * @see https://github.com/native-federation/orchestrator (docs/node.md)
 */
import { initNodeFederation } from '@softarc/native-federation-orchestrator/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const BROWSER = resolve(process.env.NF_BROWSER_DIR || resolve(ROOT, 'dist/app/browser'));
const SERVER = resolve(
  process.env.NF_SERVER_ENTRY || resolve(ROOT, 'dist/app/server/server.mjs'),
);

const importMap = { imports: {}, scopes: {} };

await initNodeFederation(pathToFileURL(resolve(BROWSER, 'federation.manifest.json')).href, {
  hostRemoteEntry: {
    url: pathToFileURL(resolve(BROWSER, 'remoteEntry.json')).href,
  },
  logLevel: process.env.NF_LOG_LEVEL || 'warn',
  feature: {
    convertFlatSharedInfo: true,
  },
  // Skip Softarc's Node loader client (MessageChannel ack never arrives on Bun).
  setImportMapFn: async (map) => {
    Object.assign(importMap.imports, map.imports ?? {});
    for (const [scope, entries] of Object.entries(map.scopes ?? {})) {
      importMap.scopes[scope] = { ...(importMap.scopes[scope] ?? {}), ...entries };
    }
  },
  loadModuleFn: async (url) => import(url),
});

/** Flat specifier → URL map (top-level imports + every scope entry). */
const flat = { ...importMap.imports };
for (const entries of Object.values(importMap.scopes)) {
  Object.assign(flat, entries);
}
const rewriteKeys = Object.keys(flat).sort((a, b) => b.length - a.length);

function rewriteFederatedImports(source) {
  let out = source;
  for (const key of rewriteKeys) {
    const target = flat[key];
    out = out.split(`"${key}"`).join(`"${target}"`);
    out = out.split(`'${key}'`).join(`'${target}'`);
  }
  return out;
}

Bun.plugin({
  name: 'native-federation-import-map',
  setup(build) {
    build.onLoad({ filter: /dist\/app\/(server|browser)\/.*\.(mjs|js)$/ }, (args) => {
      const contents = rewriteFederatedImports(readFileSync(args.path, 'utf8'));
      return { contents, loader: 'js' };
    });
  },
});

// server.mjs only calls listen() when it is the main module, pm_id, or NF_SSR_ENTRY
// (after rebuild). pm_id covers the current dist until the next `ng build`.
process.env.NF_SSR_ENTRY = process.env.NF_SSR_ENTRY || '1';
process.env.pm_id = process.env.pm_id || 'bun-nf-ssr';

await import(pathToFileURL(SERVER).href);
