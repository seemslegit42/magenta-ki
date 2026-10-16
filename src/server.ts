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

const angularApp = new AngularNodeAppEngine({ trustProxyHeaders: true });

const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] || '' });

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Verdigris Cloud OS Autonomous AI Agent and System Copilot (VIP v2.4 Magenta Augmented). Context: ${JSON.stringify(context || {})}. User Request: ${prompt}`,
    });
    res.json({ reply: response.text || 'Action completed successfully in Verdigris WebOS.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: errorMessage });
  }
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
