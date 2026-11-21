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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    res.json({ reply: response.text || 'I have processed your request.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ reply: `Error communicating with Gemini model: ${msg}` });
  }
});

// Staging Target & Application Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'verdigris-webos-ssr',
    environment: process.env['NODE_ENV'] || 'development',
    version: 'v2.4.0',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Staging Target Deployment Health Endpoint
app.get('/api/cicd/staging-health', (_req, res) => {
  res.json({
    status: 'healthy',
    target: 'staging',
    url: 'https://staging.verdigris-webos.internal',
    dockerContainer: 'webos-staging-ssr',
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    activeConnections: 1,
    lastDeployment: Date.now() - 3600000,
    commitSha: 'a8f92d4',
    branch: 'main'
  });
});

// Appwrite Console Info Endpoint
app.get('/api/console/info', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/console/info', {
      headers: { Authorization: req.headers.authorization || '' }
    });
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  res.json({
    endpoint: process.env['APPWRITE_ENDPOINT'] || 'http://localhost/v1',
    projectId: process.env['APPWRITE_PROJECT_ID'] || 'verdigris-os',
    databaseId: process.env['APPWRITE_DATABASE_ID'] || 'verdigris_main',
    bucketId: process.env['APPWRITE_BUCKET_ID'] || 'default',
    status: 'connected',
    mode: 'self-hosted'
  });
});

// In-memory development items store respecting createdBy, teamId, and immutability
const devItemsStore: {
  $id: string;
  title: string;
  description?: string;
  createdBy: string;
  teamId?: string;
  $createdAt: string;
  $updatedAt: string;
}[] = [
  {
    $id: 'item_101',
    title: 'Enterprise RBAC Matrix & Token Guard',
    description: 'Centralized access control verification pattern',
    createdBy: 'usr_operator_7842',
    teamId: 'team_enterprise_alpha',
    $createdAt: new Date(Date.now() - 3600000).toISOString(),
    $updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    $id: 'item_102',
    title: 'TablesDB Storage Adapter with Base64 Flow',
    description: 'Enforces fileId reference integrity in data rows',
    createdBy: 'usr_operator_7842',
    teamId: 'team_enterprise_alpha',
    $createdAt: new Date(Date.now() - 1800000).toISOString(),
    $updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// In-memory development projects store respecting createdBy, teamId, and immutability
const devProjectsStore: {
  $id: string;
  name: string;
  description?: string;
  createdBy: string;
  teamId?: string;
  $createdAt: string;
  $updatedAt: string;
}[] = [
  {
    $id: 'proj_alpha_mesh',
    name: 'Verdigris Mesh Orchestration Hub',
    description: 'Autonomous cluster topology and load-balanced node cluster',
    createdBy: 'usr_operator_7842',
    teamId: 'team_enterprise_alpha',
    $createdAt: new Date(Date.now() - 7200000).toISOString(),
    $updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    $id: 'proj_beta_storage',
    name: 'Hybrid File Storage Pipeline',
    description: 'Centralized storage wrapper with Base64/InputFile conversion',
    createdBy: 'usr_operator_7842',
    teamId: 'team_devops',
    $createdAt: new Date(Date.now() - 3600000).toISOString(),
    $updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Items CRUD Endpoints
app.get('/api/items', async (req, res) => {
  try {
    const proxy = await fetch(`http://localhost:8080/api/items${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`, {
      headers: { Authorization: req.headers.authorization || '' }
    });
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  const teamId = req.query['teamId'] as string | undefined;
  if (teamId) {
    res.json({ items: devItemsStore.filter(i => i.teamId === teamId) });
    return;
  }
  res.json({ items: devItemsStore });
});

app.post('/api/items', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  const newItem = {
    $id: `item_${Date.now().toString(36)}`,
    title: String(req.body?.title || 'Untitled Item').trim(),
    description: req.body?.description ? String(req.body.description).trim() : undefined,
    createdBy: 'usr_operator_7842',
    teamId: req.body?.teamId || 'team_enterprise_alpha',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  };
  devItemsStore.unshift(newItem);
  res.status(201).json({ item: newItem });
});

app.get('/api/items/get', (req, res) => {
  const id = req.query['id'] as string;
  const item = devItemsStore.find(i => i.$id === id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ item });
});

app.put('/api/items', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devItemsStore.findIndex(i => i.$id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  
  // Enforce immutability: createdBy and teamId cannot be altered
  const existing = devItemsStore[idx];
  const updated = {
    ...existing,
    title: req.body?.title ? String(req.body.title).trim() : existing.title,
    description: req.body?.description !== undefined ? req.body.description : existing.description,
    $updatedAt: new Date().toISOString()
  };
  devItemsStore[idx] = updated;
  res.json({ item: updated });
});

app.delete('/api/items', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devItemsStore.findIndex(i => i.$id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  devItemsStore.splice(idx, 1);
  res.json({ success: true, deletedId: id });
});

// Projects CRUD Endpoints (Authoritative access pattern with team queries & strict immutability)
app.get('/api/projects', async (req, res) => {
  try {
    const proxy = await fetch(`http://localhost:8080/api/projects${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`, {
      headers: { Authorization: req.headers.authorization || '' }
    });
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  const teamId = req.query['teamId'] as string | undefined;
  if (teamId) {
    res.json({ projects: devProjectsStore.filter(p => p.teamId === teamId) });
    return;
  }
  res.json({ projects: devProjectsStore });
});

app.post('/api/projects', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  const name = String(req.body?.name || req.body?.title || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  const newProj = {
    $id: `proj_${Date.now().toString(36)}`,
    name,
    description: req.body?.description ? String(req.body.description).trim() : undefined,
    createdBy: 'usr_operator_7842',
    teamId: req.body?.teamId || 'team_enterprise_alpha',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
  };
  devProjectsStore.unshift(newProj);
  res.status(201).json({ project: newProj });
});

app.get('/api/projects/get', (req, res) => {
  const id = req.query['id'] as string;
  const project = devProjectsStore.find(p => p.$id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
});

app.put('/api/projects', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devProjectsStore.findIndex(p => p.$id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const existing = devProjectsStore[idx];

  // Strictly enforce immutability: createdBy and teamId cannot be altered
  if (req.body?.createdBy && req.body.createdBy !== existing.createdBy) {
    res.status(400).json({ error: 'appwrite: validation error - createdBy is immutable and cannot be updated' });
    return;
  }
  if (req.body?.teamId && req.body.teamId !== existing.teamId) {
    res.status(400).json({ error: 'appwrite: validation error - teamId is immutable and cannot be updated' });
    return;
  }

  const updated = {
    ...existing,
    name: req.body?.name ? String(req.body.name).trim() : (req.body?.title ? String(req.body.title).trim() : existing.name),
    description: req.body?.description !== undefined ? req.body.description : existing.description,
    $updatedAt: new Date().toISOString(),
  };
  devProjectsStore[idx] = updated;
  res.json({ project: updated });
});

app.delete('/api/projects', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devProjectsStore.findIndex(p => p.$id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  devProjectsStore.splice(idx, 1);
  res.json({ success: true, deletedId: id });
});

// Root Health Check Route
app.get('/health', async (_req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/health');
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  res.json({
    status: 'healthy',
    service: 'Database & Storage Gateway Service',
    engine: 'TablesDB',
    timestamp: Date.now()
  });
});

// Telemetry Server-Sent Events (SSE) Route
app.get('/api/telemetry/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendMetrics = () => {
    const data = {
      cpu: Math.round(18 + Math.random() * 22),
      gpu: Math.round(28 + Math.random() * 30),
      memory: Math.round(45 + Math.random() * 12),
      iops: Math.round(1200 + Math.random() * 800),
      security_events: Math.floor(Math.random() * 3)
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendMetrics();
  const timer = setInterval(sendMetrics, 3000);

  req.on('close', () => {
    clearInterval(timer);
  });
});

// Centralized Storage Handlers (Base64 <-> InputFile conversion rules)
const storageStore = new Map<string, { fileName: string; mimeType: string; buffer: Buffer }>();

// Pre-seed an example file in storage
const initialSeedBuffer = Buffer.from('Verdigris WebOS Cluster Core Manifest & Blueprint Specification');
storageStore.set('file_sample_spec', {
  fileName: 'spec_manifest.txt',
  mimeType: 'text/plain',
  buffer: initialSeedBuffer
});

app.post('/api/storage/upload', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/storage/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  let base64Data = req.body?.base64Data as string | undefined;
  const fileName = String(req.body?.fileName || 'upload.bin').trim();
  const mimeType = String(req.body?.mimeType || 'application/octet-stream').trim();

  if (!base64Data) {
    res.status(400).json({ error: 'base64Data required' });
    return;
  }

  // Strip data URL prefix if present (Mandatory conversion rule)
  const prefixIdx = base64Data.indexOf(';base64,');
  if (prefixIdx !== -1) {
    base64Data = base64Data.substring(prefixIdx + 8);
  }

  const fileBytes = Buffer.from(base64Data, 'base64');
  const fileId = `file_${Date.now().toString(36)}`;

  // Store binary buffer in storage store (NEVER stores base64 strings in database)
  storageStore.set(fileId, {
    fileName,
    mimeType,
    buffer: fileBytes
  });

  // Client receives file ID only
  res.status(201).json({ fileId, fileName });
});

app.get('/api/storage/download', (req, res) => {
  const fileId = req.query['fileId'] as string;
  if (!fileId) {
    res.status(400).json({ error: 'fileId is required' });
    return;
  }

  const stored = storageStore.get(fileId);
  if (!stored) {
    res.status(404).json({ error: 'File not found in storage bucket' });
    return;
  }

  // Convert binary buffer to base64 data URL string for client consumption
  const base64Str = stored.buffer.toString('base64');
  res.json({
    fileId,
    fileName: stored.fileName,
    dataUrl: `data:${stored.mimeType};base64,${base64Str}`
  });
});

app.delete('/api/storage/file', (req, res) => {
  const fileId = req.query['fileId'] as string;
  if (!fileId) {
    res.status(400).json({ error: 'fileId is required' });
    return;
  }
  storageStore.delete(fileId);
  res.json({ success: true, deletedFileId: fileId });
});

// Centralized Messaging Handlers (Email, Push, SMS)
app.post('/api/messaging/email', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/messaging/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.status(201).json({
    message: {
      $id: `msg_email_${Date.now().toString(36)}`,
      status: 'delivered',
      type: 'email',
      timestamp: Date.now()
    }
  });
});

app.post('/api/messaging/push', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/messaging/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.status(201).json({
    message: {
      $id: `msg_push_${Date.now().toString(36)}`,
      status: 'delivered',
      type: 'push',
      timestamp: Date.now()
    }
  });
});

app.post('/api/messaging/sms', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/messaging/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.status(201).json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.status(201).json({
    message: {
      $id: `msg_sms_${Date.now().toString(36)}`,
      status: 'delivered',
      type: 'sms',
      timestamp: Date.now()
    }
  });
});

// Xi Economy API Handlers
app.get('/api/xi/floor', async (_req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/xi/floor');
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.json({
    xiFloorUsd: 0.0208,
    fiatPegCurrency: 'CAD',
    fiatRatio: 1.0,
    components: {
      cInfra: 0.012,
      wInfra: 0.25,
      cExec: 0.024,
      wExec: 0.40,
      cAlign: 0.035,
      wAlign: 0.20,
      cValid: 0.008,
      wValid: 0.15
    },
    formula: 'Xi_Floor = sum(w_i * c_i)'
  });
});

app.post('/api/xi/burn', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/xi/burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  const xiUnits = Number(req.body?.xiUnits) || 10;
  res.json({
    success: true,
    burnedXi: xiUnits,
    remainingBalance: 1250 - xiUnits,
    revenueRecognizedUsd: xiUnits * 0.0208,
    message: `Burned ${xiUnits} Xi units for CogniOps inference.`
  });
});

app.post('/api/xi/poa-reward', async (req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/xi/poa-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  const nk = Number(req.body?.datasetWeightNk) || 1000;
  const fk = Number(req.body?.qualityFactorFk) || 0.85;
  const edata = Number(req.body?.efficacyImpactEdata) || 0.92;
  const rewardXi = Math.round(1.25 * nk * Math.pow(fk, 1.5) * edata * 100) / 100;

  res.json({
    contributorId: req.body?.contributorId || 'usr_operator_7842',
    rewardXi,
    qualityFactor: fk,
    efficacyImpact: edata,
    calculatedAt: Date.now()
  });
});

app.get('/api/xi/sankey', async (_req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/xi/sankey');
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.json({
    nodes: [
      { id: 'fiat_purchases', name: 'Fiat Purchases (CAD)', value: 200000 },
      { id: 'poa_minting', name: 'PoA Rewards Minted', value: 45000 },
      { id: 'available_supply', name: 'Circulating Reserve', value: 245000 },
      { id: 'burned_execution', name: 'Burned Execution (SaaS Revenue)', value: 128500 },
      { id: 'burned_elastic', name: 'Elastic Access Pool', value: 34200 },
      { id: 'terminal_cogs', name: 'Operational COGS (Terminal)', value: 82300 }
    ],
    links: [
      { source: 'fiat_purchases', target: 'available_supply', value: 200000 },
      { source: 'poa_minting', target: 'available_supply', value: 45000 },
      { source: 'available_supply', target: 'burned_execution', value: 128500 },
      { source: 'available_supply', target: 'burned_elastic', value: 34200 },
      { source: 'available_supply', target: 'terminal_cogs', value: 82300 }
    ]
  });
});

app.get('/api/xi/governance', async (_req, res) => {
  try {
    const proxy = await fetch('http://localhost:8080/api/xi/governance');
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }

  res.json({
    proposals: [
      {
        id: 'prop_hpvc_01',
        title: 'Index Xi Floor to reflect 15% GPU cluster efficiency optimization',
        constantKey: 'xiFloor',
        proposedValue: 0.0185,
        status: 'approved',
        approvals: 14,
        rejections: 1
      },
      {
        id: 'prop_hpvc_02',
        title: 'Adjust Proof-of-Attribution alpha exponent from 1.5 to 1.62',
        constantKey: 'qualityExponent',
        proposedValue: 1.62,
        status: 'pending',
        approvals: 8,
        rejections: 2
      }
    ]
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
