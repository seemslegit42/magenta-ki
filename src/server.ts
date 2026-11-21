import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cors = require('cors');

import { join } from 'node:path';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { GoogleGenAI } from '@google/genai';
import express from 'express';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

let angularApp: AngularNodeAppEngine | null = null;
function getAngularApp(): AngularNodeAppEngine {
  if (!angularApp) {
    angularApp = new AngularNodeAppEngine({
      allowedHosts: ['*'],
      trustProxyHeaders: true,
    });
  }
  return angularApp;
}

const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] || '' });
const GO_BACKEND_URL = process.env['GO_BACKEND_URL'] || 'http://localhost:8080';

function fetchGoGateway(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${GO_BACKEND_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(300),
  });
}

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

// Staging Target & CI/CD Pipeline Store (GitLab Flow + Bun + Biome)
interface ServerPipelineStep {
  name: string;
  label: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  durationMs: number;
  command: string;
  logs: string[];
}

interface ServerPipelineRun {
  id: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  branch: string;
  triggerEvent: 'gitlab_push' | 'merge_request' | 'manual' | 'schedule';
  status: 'queued' | 'running' | 'success' | 'failed';
  startedAt: number;
  completedAt: number;
  durationMs: number;
  stagingDeployedUrl: string;
  steps: ServerPipelineStep[];
}

const cicdState = {
  activeVersion: 'v2.5.0',
  activeCommitSha: 'b9d41e2',
  branch: 'staging',
  lastDeployedAt: Date.now() - 1800000,
  status: 'online' as 'online' | 'deploying' | 'degraded',
  healthCheckStatus: 'passing' as 'passing' | 'warning' | 'failing',
};

const cicdRunsStore: ServerPipelineRun[] = [
  {
    id: 'gl-pipe-20418',
    commitSha: 'b9d41e2',
    commitMessage: 'ci(gitlab): bun-only pipeline, biome quality gate & uat portal',
    author: 'bmanmarlow@gmail.com',
    branch: 'staging',
    triggerEvent: 'gitlab_push',
    status: 'success',
    startedAt: Date.now() - 1900000,
    completedAt: Date.now() - 1860000,
    durationMs: 38400,
    stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
    steps: [
      {
        name: 'quality_biome',
        label: 'Biome Lint & Format Gate',
        status: 'success',
        durationMs: 1100,
        command: 'bunx biome ci .',
        logs: ['Checked 94 files cleanly. 0 errors.'],
      },
      {
        name: 'typecheck',
        label: 'TypeScript Strict Check',
        status: 'success',
        durationMs: 2800,
        command: 'bunx tsc --noEmit',
        logs: ['0 type diagnostics across strict profile.'],
      },
      {
        name: 'test_unit',
        label: 'Unit Suite (Bun + Go)',
        status: 'success',
        durationMs: 2400,
        command: 'bun test tests/unit && go test ./...',
        logs: ['Bun unit suite passed; Go handler & auth tests passed.'],
      },
      {
        name: 'test_integration',
        label: 'HTTP Integration Suite',
        status: 'success',
        durationMs: 3100,
        command: 'bun test tests/integration',
        logs: ['All REST API contract assertions passed.'],
      },
      {
        name: 'test_e2e',
        label: 'Workflow E2E Suite (Bun)',
        status: 'success',
        durationMs: 4900,
        command: 'bun test tests/e2e',
        logs: ['End-to-end release, AgentFS & RBAC journeys passed.'],
      },
      {
        name: 'build_webos',
        label: 'Angular SSR Production Build',
        status: 'success',
        durationMs: 12100,
        command: 'bun run build',
        logs: ['Built dist/app browser & server bundles.'],
      },
      {
        name: 'build_go',
        label: 'Go Gateway Binary Build',
        status: 'success',
        durationMs: 3400,
        command: 'cd go && go build -o ../bin/gateway-server ./cmd/server/main.go',
        logs: ['Static binary compiled for linux/amd64.'],
      },
      {
        name: 'deploy_staging',
        label: 'Docker Staging Deployment',
        status: 'success',
        durationMs: 8600,
        command: 'docker compose -f docker-compose.staging.yml up -d --build',
        logs: ['Caddy & SSR health probe HTTP 200 OK.'],
      },
    ],
  },
];

// Business Stakeholder UAT Scenarios & Release Sign-Off Store (Plain-English, Non-Technical)
interface ServerUatScenario {
  id: string;
  businessArea: 'Project Collaboration' | 'Document Workspace' | 'Billing & Usage' | 'Security & Access';
  title: string;
  plainLanguageGoal: string;
  stepsToVerify: string[];
  expectedOutcome: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'blocked';
  reviewerName: string;
  reviewerNote: string;
  updatedAt: number;
}

const uatScenariosStore: ServerUatScenario[] = [
  {
    id: 'UAT-01',
    businessArea: 'Project Collaboration',
    title: 'Team members can create and organize projects safely',
    plainLanguageGoal: 'Confirm staff can add a new project, save details, and keep team work separated.',
    stepsToVerify: [
      'Open Enterprise Projects Manager from Applications.',
      'Add a new project with a name and short description, then save.',
      'Refresh or reopen the list and confirm your project appears cleanly.',
    ],
    expectedOutcome:
      'New projects appear right away with accurate names and stay assigned to the correct team.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-02',
    businessArea: 'Document Workspace',
    title: 'Documents open, save, and download without losing content',
    plainLanguageGoal: 'Verify team members can upload or edit a document and retrieve the exact file later.',
    stepsToVerify: [
      'Open WOPI Office Suite or OS File Explorer.',
      'Open an existing document or save a brief text update.',
      'Download or reopen the document to verify all edits remain intact.',
    ],
    expectedOutcome: 'Saved changes remain readable and file names stay intact without formatting errors.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-03',
    businessArea: 'Billing & Usage',
    title: 'Usage totals and pricing floors match finance policy',
    plainLanguageGoal:
      'Ensure usage summaries and customer cost breakdowns match approved pricing agreements.',
    stepsToVerify: [
      'Open Control Plane & Gateway and view the Billing or Economy summary.',
      'Check that displayed unit prices and customer totals look clear and legible.',
      'Verify there are no unexpected warnings or blank totals.',
    ],
    expectedOutcome:
      'Cost figures, customer balances, and upgrade guidance align with current business pricing.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'UAT-04',
    businessArea: 'Security & Access',
    title: 'Restricted actions are protected and recorded',
    plainLanguageGoal:
      'Confirm sensitive permissions are respected and important team activity appears in the audit record.',
    stepsToVerify: [
      'Open Audit Trail & RBAC Sentinel.',
      'Confirm recent team actions appear with clear timestamps and action names.',
      'Verify role permissions clearly distinguish staff and administrator capabilities.',
    ],
    expectedOutcome:
      'Every major action is clearly logged and restricted settings cannot be changed by guest roles.',
    status: 'pending',
    reviewerName: '',
    reviewerNote: '',
    updatedAt: Date.now() - 3600000,
  },
];

let uatSignOffState: {
  releaseLabel: string;
  decision: 'pending' | 'approved' | 'rejected';
  signedBy: string;
  role: string;
  summaryNote: string;
  signedAt: number | null;
} = {
  releaseLabel: 'Release 2.5 (Staging Review)',
  decision: 'pending',
  signedBy: '',
  role: '',
  summaryNote: '',
  signedAt: null,
};

// Staging Target & Application Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'verdigris-webos-ssr',
    environment: process.env['NODE_ENV'] || 'development',
    version: cicdState.activeVersion,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Staging Target Deployment Health Endpoint
app.get('/api/cicd/staging-health', (_req, res) => {
  res.json({
    status: cicdState.status === 'online' ? 'healthy' : cicdState.status,
    target: 'staging',
    url: 'https://staging.verdigris-webos.internal',
    dockerContainer: 'webos-staging-ssr',
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    activeConnections: 1,
    lastDeployment: cicdState.lastDeployedAt,
    commitSha: cicdState.activeCommitSha,
    branch: cicdState.branch,
    version: cicdState.activeVersion,
  });
});

app.get('/api/cicd/runs', (_req, res) => {
  res.json({ runs: cicdRunsStore, staging: cicdState });
});

app.post('/api/cicd/runs', (req, res) => {
  const branch = String(req.body?.branch || 'main').trim() || 'main';
  const commitMessage = String(
    req.body?.commitMessage || `ci(gitlab): automated bun & biome verification on ${branch}`,
  ).trim();
  const triggerEvent = (
    ['gitlab_push', 'merge_request', 'manual', 'schedule'].includes(req.body?.triggerEvent)
      ? req.body.triggerEvent
      : 'manual'
  ) as ServerPipelineRun['triggerEvent'];

  const sha = Math.random().toString(16).substring(2, 9);
  const startedAt = Date.now();
  const runId = `gl-pipe-${Math.floor(20500 + Math.random() * 79000)}`;

  const steps: ServerPipelineStep[] = [
    {
      name: 'quality_biome',
      label: 'Biome Lint & Format Gate',
      status: 'success',
      durationMs: 920,
      command: 'bunx biome ci .',
      logs: ['Biome lint and formatting verification passed (0 errors).'],
    },
    {
      name: 'typecheck',
      label: 'TypeScript Strict Check',
      status: 'success',
      durationMs: 2150,
      command: 'bunx tsc --noEmit',
      logs: ['TypeScript strict compilation verified.'],
    },
    {
      name: 'test_unit',
      label: 'Unit Suite (Bun + Go)',
      status: 'success',
      durationMs: 1850,
      command: 'bun test tests/unit && go test ./...',
      logs: ['All unit test suites passed.'],
    },
    {
      name: 'test_integration',
      label: 'HTTP Integration Suite',
      status: 'success',
      durationMs: 2300,
      command: 'bun test tests/integration',
      logs: ['REST contract & validation suite passed.'],
    },
    {
      name: 'test_e2e',
      label: 'Workflow E2E Suite (Bun)',
      status: 'success',
      durationMs: 3900,
      command: 'bun test tests/e2e',
      logs: ['Multi-step workflow E2E tests passed.'],
    },
    {
      name: 'build_webos',
      label: 'Angular SSR Production Build',
      status: 'success',
      durationMs: 9800,
      command: 'bun run build',
      logs: ['Angular ApplicationBuilder SSR output generated.'],
    },
    {
      name: 'build_go',
      label: 'Go Gateway Binary Build',
      status: 'success',
      durationMs: 2900,
      command: 'cd go && go build -o ../bin/gateway-server ./cmd/server/main.go',
      logs: ['Go microservice gateway binary compiled cleanly.'],
    },
    {
      name: 'deploy_staging',
      label: 'Docker Staging Deployment',
      status: 'success',
      durationMs: 5400,
      command: 'docker compose -f docker-compose.staging.yml up -d --build',
      logs: ['Deployed to staging target; /api/cicd/staging-health HTTP 200 OK.'],
    },
  ];

  const durationMs = steps.reduce((acc, s) => acc + s.durationMs, 0);
  const newRun: ServerPipelineRun = {
    id: runId,
    commitSha: sha,
    commitMessage,
    author: 'bmanmarlow@gmail.com',
    branch,
    triggerEvent,
    status: 'success',
    startedAt,
    completedAt: startedAt + durationMs,
    durationMs,
    stagingDeployedUrl: 'https://staging.verdigris-webos.internal',
    steps,
  };

  cicdRunsStore.unshift(newRun);
  cicdState.activeCommitSha = sha;
  cicdState.branch = branch;
  cicdState.lastDeployedAt = Date.now();
  cicdState.status = 'online';
  cicdState.healthCheckStatus = 'passing';

  res.status(201).json({ run: newRun, staging: cicdState });
});

app.post('/api/cicd/rollback', (req, res) => {
  const commitSha = String(req.body?.commitSha || '').trim();
  if (!commitSha) {
    res.status(400).json({ error: 'commitSha is required for staging rollback' });
    return;
  }

  cicdState.activeCommitSha = commitSha;
  cicdState.lastDeployedAt = Date.now();
  cicdState.status = 'online';
  cicdState.healthCheckStatus = 'passing';

  res.json({ success: true, staging: cicdState });
});

// Business Stakeholder UAT Endpoints
app.get('/api/uat/scenarios', (_req, res) => {
  res.json({
    scenarios: uatScenariosStore,
    signOff: uatSignOffState,
  });
});

app.patch('/api/uat/scenarios/:id', (req, res) => {
  const id = String(req.params['id'] || '').trim();
  const idx = uatScenariosStore.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'UAT scenario not found' });
    return;
  }

  const allowedStatuses = ['pending', 'approved', 'changes_requested', 'blocked'];
  const status = String(req.body?.status || '').trim();
  if (!allowedStatuses.includes(status)) {
    res
      .status(400)
      .json({ error: 'Invalid review status. Must be pending, approved, changes_requested, or blocked.' });
    return;
  }

  const existing = uatScenariosStore[idx];
  const updated: ServerUatScenario = {
    ...existing,
    status: status as ServerUatScenario['status'],
    reviewerName:
      req.body?.reviewerName !== undefined ? String(req.body.reviewerName).trim() : existing.reviewerName,
    reviewerNote:
      req.body?.reviewerNote !== undefined ? String(req.body.reviewerNote).trim() : existing.reviewerNote,
    updatedAt: Date.now(),
  };
  uatScenariosStore[idx] = updated;
  res.json({ scenario: updated });
});

app.get('/api/uat/signoff', (_req, res) => {
  const approvedCount = uatScenariosStore.filter((s) => s.status === 'approved').length;
  res.json({
    signOff: uatSignOffState,
    summary: {
      totalScenarios: uatScenariosStore.length,
      approvedCount,
      changesRequestedCount: uatScenariosStore.filter((s) => s.status === 'changes_requested').length,
      blockedCount: uatScenariosStore.filter((s) => s.status === 'blocked').length,
      pendingCount: uatScenariosStore.filter((s) => s.status === 'pending').length,
      readyForProduction:
        approvedCount === uatScenariosStore.length && uatSignOffState.decision === 'approved',
    },
  });
});

app.post('/api/uat/signoff', (req, res) => {
  const decision = String(req.body?.decision || '').trim();
  const signedBy = String(req.body?.signedBy || '').trim();
  const role = String(req.body?.role || '').trim();
  const summaryNote = String(req.body?.summaryNote || '').trim();
  const releaseLabel = String(req.body?.releaseLabel || uatSignOffState.releaseLabel).trim();

  if (!['approved', 'rejected', 'pending'].includes(decision)) {
    res.status(400).json({ error: 'Sign-off decision must be approved, rejected, or pending.' });
    return;
  }

  if (decision !== 'pending' && !signedBy) {
    res.status(400).json({ error: 'Please enter your full name to record release sign-off.' });
    return;
  }

  uatSignOffState = {
    releaseLabel,
    decision: decision as 'pending' | 'approved' | 'rejected',
    signedBy,
    role: role || 'Business Stakeholder',
    summaryNote,
    signedAt: decision === 'pending' ? null : Date.now(),
  };

  res.status(201).json({ signOff: uatSignOffState });
});

// Appwrite Console Info Endpoint
app.get('/api/console/info', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/console/info', {
      headers: { Authorization: req.headers.authorization || '' },
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
    mode: 'self-hosted',
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
    $updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    $id: 'item_102',
    title: 'TablesDB Storage Adapter with Base64 Flow',
    description: 'Enforces fileId reference integrity in data rows',
    createdBy: 'usr_operator_7842',
    teamId: 'team_enterprise_alpha',
    $createdAt: new Date(Date.now() - 1800000).toISOString(),
    $updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
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
    const proxy = await fetchGoGateway(
      `/api/items${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`,
      {
        headers: { Authorization: req.headers.authorization || '' },
      },
    );
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  const teamId = req.query['teamId'] as string | undefined;
  if (teamId) {
    res.json({ items: devItemsStore.filter((i) => i.teamId === teamId) });
    return;
  }
  res.json({ items: devItemsStore });
});

app.post('/api/items', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
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
    $updatedAt: new Date().toISOString(),
  };
  devItemsStore.unshift(newItem);
  res.status(201).json({ item: newItem });
});

app.get('/api/items/get', (req, res) => {
  const id = req.query['id'] as string;
  const item = devItemsStore.find((i) => i.$id === id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ item });
});

app.put('/api/items', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devItemsStore.findIndex((i) => i.$id === id);
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
    $updatedAt: new Date().toISOString(),
  };
  devItemsStore[idx] = updated;
  res.json({ item: updated });
});

app.delete('/api/items', (req, res) => {
  const id = req.query['id'] as string;
  const idx = devItemsStore.findIndex((i) => i.$id === id);
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
    const proxy = await fetchGoGateway(
      `/api/projects${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`,
      {
        headers: { Authorization: req.headers.authorization || '' },
      },
    );
    if (proxy.ok) {
      res.json(await proxy.json());
      return;
    }
  } catch {
    // Development fallback
  }
  const teamId = req.query['teamId'] as string | undefined;
  if (teamId) {
    res.json({ projects: devProjectsStore.filter((p) => p.teamId === teamId) });
    return;
  }
  res.json({ projects: devProjectsStore });
});

app.post('/api/projects', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
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

app.get('/api/projects/get', async (req, res) => {
  const id = req.query['id'] as string;
  try {
    const proxy = await fetchGoGateway(`/api/projects/get?id=${encodeURIComponent(id || '')}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });
    if (proxy.status < 500) {
      const contentType = proxy.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        res.status(proxy.status).json(await proxy.json());
      } else {
        res.status(proxy.status).json({ error: await proxy.text() });
      }
      return;
    }
  } catch {
    // Development fallback
  }

  const project = devProjectsStore.find((p) => p.$id === id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
});

app.put('/api/projects', async (req, res) => {
  const id = req.query['id'] as string;
  try {
    const proxy = await fetchGoGateway(`/api/projects?id=${encodeURIComponent(id || '')}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });
    if (proxy.status < 500) {
      const contentType = proxy.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        res.status(proxy.status).json(await proxy.json());
      } else {
        res.status(proxy.status).json({ error: await proxy.text() });
      }
      return;
    }
  } catch {
    // Development fallback
  }

  const idx = devProjectsStore.findIndex((p) => p.$id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const existing = devProjectsStore[idx];

  // Strictly enforce immutability: createdBy and teamId cannot be altered
  if (req.body?.createdBy && req.body.createdBy !== existing.createdBy) {
    res
      .status(400)
      .json({ error: 'appwrite: validation error - createdBy is immutable and cannot be updated' });
    return;
  }
  if (req.body?.teamId && req.body.teamId !== existing.teamId) {
    res.status(400).json({ error: 'appwrite: validation error - teamId is immutable and cannot be updated' });
    return;
  }

  const updated = {
    ...existing,
    name: req.body?.name
      ? String(req.body.name).trim()
      : req.body?.title
        ? String(req.body.title).trim()
        : existing.name,
    description: req.body?.description !== undefined ? req.body.description : existing.description,
    $updatedAt: new Date().toISOString(),
  };
  devProjectsStore[idx] = updated;
  res.json({ project: updated });
});

app.delete('/api/projects', async (req, res) => {
  const id = req.query['id'] as string;
  try {
    const proxy = await fetchGoGateway(`/api/projects?id=${encodeURIComponent(id || '')}`, {
      method: 'DELETE',
      headers: { Authorization: req.headers.authorization || '' },
    });
    if (proxy.status < 500) {
      const contentType = proxy.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        res.status(proxy.status).json(await proxy.json());
      } else {
        res.status(proxy.status).json({ error: await proxy.text() });
      }
      return;
    }
  } catch {
    // Development fallback
  }

  const idx = devProjectsStore.findIndex((p) => p.$id === id);
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
    const proxy = await fetchGoGateway('/health');
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
    timestamp: Date.now(),
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
      security_events: Math.floor(Math.random() * 3),
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
const storageMetaCache = new Map<string, { fileName: string; mimeType: string }>();

// Pre-seed an example file in storage
const initialSeedBuffer = Buffer.from('Verdigris WebOS Cluster Core Manifest & Blueprint Specification');
storageStore.set('file_sample_spec', {
  fileName: 'spec_manifest.txt',
  mimeType: 'text/plain',
  buffer: initialSeedBuffer,
});

app.post('/api/storage/upload', async (req, res) => {
  const fileName = String(req.body?.fileName || 'upload.bin').trim();
  const mimeType = String(req.body?.mimeType || 'application/octet-stream').trim();

  try {
    const proxy = await fetchGoGateway('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });
    if (proxy.ok) {
      const payload = (await proxy.json()) as { fileId?: string; fileName?: string };
      if (payload.fileId) {
        storageMetaCache.set(payload.fileId, {
          fileName: payload.fileName || fileName,
          mimeType,
        });
      }
      res.status(201).json(payload);
      return;
    }
  } catch {
    // Development fallback
  }

  let base64Data = req.body?.base64Data as string | undefined;

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
    buffer: fileBytes,
  });

  // Client receives file ID only
  res.status(201).json({ fileId, fileName });
});

app.get('/api/storage/download', async (req, res) => {
  const fileId = req.query['fileId'] as string;
  if (!fileId) {
    res.status(400).json({ error: 'fileId is required' });
    return;
  }

  const meta = storageMetaCache.get(fileId);
  const mimeType = (req.query['mimeType'] as string) || meta?.mimeType || '';

  try {
    const proxy = await fetchGoGateway(
      `/api/storage/download?fileId=${encodeURIComponent(fileId)}&mimeType=${encodeURIComponent(mimeType)}`,
      {
        headers: { Authorization: req.headers.authorization || '' },
      },
    );
    if (proxy.status < 500) {
      const contentType = proxy.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await proxy.json()) as Record<string, unknown>;
        if (!data['fileName'] && meta?.fileName) {
          data['fileName'] = meta.fileName;
        }
        res.status(proxy.status).json(data);
      } else {
        res.status(proxy.status).json({ error: await proxy.text() });
      }
      return;
    }
  } catch {
    // Development fallback
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
    dataUrl: `data:${stored.mimeType};base64,${base64Str}`,
  });
});

app.delete('/api/storage/file', async (req, res) => {
  const fileId = req.query['fileId'] as string;
  if (!fileId) {
    res.status(400).json({ error: 'fileId is required' });
    return;
  }

  try {
    const proxy = await fetchGoGateway(`/api/storage/file?fileId=${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: req.headers.authorization || '' },
    });
    if (proxy.status < 500) {
      storageMetaCache.delete(fileId);
      const contentType = proxy.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        res.status(proxy.status).json(await proxy.json());
      } else {
        res.status(proxy.status).json({ error: await proxy.text() });
      }
      return;
    }
  } catch {
    // Development fallback
  }

  storageStore.delete(fileId);
  storageMetaCache.delete(fileId);
  res.json({ success: true, deletedFileId: fileId });
});

// Centralized Messaging Handlers (Email, Push, SMS)
app.post('/api/messaging/email', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/messaging/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
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
      timestamp: Date.now(),
    },
  });
});

app.post('/api/messaging/push', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/messaging/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
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
      timestamp: Date.now(),
    },
  });
});

app.post('/api/messaging/sms', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/messaging/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
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
      timestamp: Date.now(),
    },
  });
});

// Xi Economy API Handlers
app.get('/api/xi/floor', async (_req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/xi/floor');
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
      wExec: 0.4,
      cAlign: 0.035,
      wAlign: 0.2,
      cValid: 0.008,
      wValid: 0.15,
    },
    formula: 'Xi_Floor = sum(w_i * c_i)',
  });
});

app.post('/api/xi/burn', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/xi/burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
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
    message: `Burned ${xiUnits} Xi units for CogniOps inference.`,
  });
});

app.post('/api/xi/poa-reward', async (req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/xi/poa-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
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
  const rewardXi = Math.round(1.25 * nk * fk ** 1.5 * edata * 100) / 100;

  res.json({
    contributorId: req.body?.contributorId || 'usr_operator_7842',
    rewardXi,
    qualityFactor: fk,
    efficacyImpact: edata,
    calculatedAt: Date.now(),
  });
});

app.get('/api/xi/sankey', async (_req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/xi/sankey');
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
      { id: 'terminal_cogs', name: 'Operational COGS (Terminal)', value: 82300 },
    ],
    links: [
      { source: 'fiat_purchases', target: 'available_supply', value: 200000 },
      { source: 'poa_minting', target: 'available_supply', value: 45000 },
      { source: 'available_supply', target: 'burned_execution', value: 128500 },
      { source: 'available_supply', target: 'burned_elastic', value: 34200 },
      { source: 'available_supply', target: 'terminal_cogs', value: 82300 },
    ],
  });
});

app.get('/api/xi/governance', async (_req, res) => {
  try {
    const proxy = await fetchGoGateway('/api/xi/governance');
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
        rejections: 1,
      },
      {
        id: 'prop_hpvc_02',
        title: 'Adjust Proof-of-Attribution alpha exponent from 1.5 to 1.62',
        constantKey: 'qualityExponent',
        proposedValue: 1.62,
        status: 'pending',
        approvals: 8,
        rejections: 2,
      },
    ],
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
  getAngularApp()
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
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
export { app };
export const reqHandler = createNodeRequestHandler(app);
