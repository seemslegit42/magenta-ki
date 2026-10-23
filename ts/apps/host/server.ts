/**
 * Angular SSR + static host entry (no Express).
 * Domain APIs live in bun/cmd/server — proxy /api in development.
 */
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';

const browserDistFolder = join(import.meta.dirname, '../browser');

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*'],
  trustProxyHeaders: true,
});

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function env(name: string): string | undefined {
  return (globalThis as {process?: {env?: Record<string, string | undefined>}})
    .process?.env?.[name];
}

async function tryStatic(
  pathname: string,
): Promise<{body: Uint8Array; type: string} | null> {
  const safe = pathname.replace(/\.\./g, '');
  const filePath = join(browserDistFolder, safe === '/' ? 'index.html' : safe);
  if (!existsSync(filePath) || filePath.endsWith('/')) {
    return null;
  }
  try {
    const body = await readFile(filePath);
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    return {body, type: MIME[ext] || 'application/octet-stream'};
  } catch {
    return null;
  }
}

const handler = createNodeRequestHandler(async (req, res, next) => {
  try {
    const url = new URL(
      req.url || '/',
      `http://${req.headers.host || 'localhost'}`,
    );
    const staticFile = await tryStatic(url.pathname);
    if (
      staticFile &&
      !url.pathname.endsWith('/') &&
      url.pathname.includes('.')
    ) {
      res.statusCode = 200;
      res.setHeader('Content-Type', staticFile.type);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(staticFile.body);
      return;
    }

    const response = await angularApp.handle(req);
    if (response) {
      await writeResponseToNodeResponse(response, res);
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Request handler used by the Angular CLI (dev-server / build) and PM2.
 */
export const reqHandler = handler;

if (isMainModule(import.meta.url) || env('pm_id')) {
  const port = Number(env('PORT') || 3000);
  createServer((req: IncomingMessage, res: ServerResponse) => {
    void handler(req, res, (err?: unknown) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      res.statusCode = 404;
      res.end('Not Found');
    });
  }).listen(port, () => {
    console.log(`ΛΞVOS Angular SSR host listening on http://localhost:${port}`);
  });
}
