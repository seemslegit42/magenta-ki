import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cors = require('cors');
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
  app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*'],
  trustProxyHeaders: true,
});

const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] || '' });

app.post('/api/ai/chat', async (req, res) => {
  try {
    const prompt = req.body?.prompt || 'Hello';
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    res.json({ reply: response.text || 'I have processed your request.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ reply: `Error communicating with Gemini model: ${msg}` });
  }
});

app.get('/api/telemetry/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const interval = setInterval(() => {
    const payload = {
      cpu: Number((24 + Math.random() * 32).toFixed(1)),
      gpu: Number((18 + Math.random() * 40).toFixed(1)),
      memory: Number((50 + Math.random() * 16).toFixed(1)),
      iops: Math.floor(1350 + Math.random() * 650),
      security_events: Math.random() > 0.96 ? 1 : 0,
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});


/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
