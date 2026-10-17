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
    const { prompt, context } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Verdigris Cloud OS Autonomous AI Agent and System Copilot (VIP v2.4 Magenta Augmented). Context: ${JSON.stringify(context || {})}. User Request: ${prompt}`,
    });
    
    // Ingest token usage telemetry with Cost Insights (_cost in cents)
    const promptLen = prompt?.length || 10;
    const replyLen = response.text?.length || 20;
    const estimatedTokens = Math.ceil((promptLen + replyLen) / 4);
    const costCents = Math.round((estimatedTokens / 1000) * 0.075 * 1000) / 1000;

    res.json({
      reply: response.text || 'Action completed successfully in Verdigris WebOS.',
      polarUsage: {
        event: 'ai_usage',
        tokens: estimatedTokens,
        costCents,
        currency: 'usd'
      }
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: errorMessage });
  }
});

// --- Polar Billing & Metering Gateway Routes ---
app.post('/api/polar/events/ingest', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'Payload must contain an events array' });
    return;
  }
  const count = events.length;
  let totalCost = 0;
  events.forEach((e: Record<string, unknown>) => {
    const meta = e['metadata'] as Record<string, unknown> | undefined;
    const cost = meta?.['_cost'] as { amount?: number } | undefined;
    if (cost?.amount) {
      totalCost += Number(cost.amount);
    }
  });

  res.status(202).json({
    status: 'success',
    ingested: count,
    totalCostCentsAdded: totalCost,
    timestamp: Date.now()
  });
});

app.post('/api/polar/checkouts', (req, res) => {
  const { products, externalCustomerId, customerEmail, successUrl } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ error: 'At least one product ID is required' });
    return;
  }
  const checkoutId = `chk_${Math.random().toString(36).slice(2, 11)}`;
  const url = `https://checkout.polar.sh/c/${checkoutId}?embed_origin=${encodeURIComponent('http://localhost:3000')}`;

  res.status(201).json({
    checkoutId,
    url,
    status: 'open',
    products,
    externalCustomerId: externalCustomerId || 'usr_operator_7842',
    customerEmail: customerEmail || 'operator@verdigris.cloud',
    successUrl: (successUrl || 'https://verdigris.cloud/success?checkout_id={CHECKOUT_ID}').replace('{CHECKOUT_ID}', checkoutId)
  });
});

app.get('/api/polar/customer-state/:id', (req, res) => {
  const customerId = req.params.id;
  res.json({
    customerId: 'cus_verdigris_operator',
    externalCustomerId: customerId,
    email: 'operator@verdigris.cloud',
    name: 'Elena Rostova (Lead Architect)',
    subscriptions: [
      {
        id: 'sub_active_core_01',
        productId: 'prod_core_kernel',
        productName: 'Verdigris Cloud OS Core',
        status: 'active',
        currentPeriodStart: Date.now() - 86400000 * 14,
        currentPeriodEnd: Date.now() + 86400000 * 16,
        cancelAtPeriodEnd: false,
        priceAmount: 4900,
        currency: 'usd',
        seats: 5
      }
    ],
    benefits: [
      { id: 'ben_feature_flags', type: 'feature_flag', description: 'Unlimited WASM OPFS and WOPI locks', isGranted: true },
      { id: 'ben_license_keys', type: 'license_keys', description: 'Cryptographic node licenses', isGranted: true }
    ],
    meters: [
      {
        meterId: 'mtr_ai_tokens',
        meterName: 'AI LLM Inference Tokens',
        consumedUnits: 125000,
        creditedUnits: 5000000,
        balance: 4875000
      },
      {
        meterId: 'mtr_edge_pings',
        meterName: 'Edge Gateway Requests',
        consumedUnits: 342,
        creditedUnits: 10000,
        balance: 9658
      }
    ]
  });
});

app.post('/api/polar/webhooks', (req, res) => {
  const webhookId = req.header('webhook-id');
  const signature = req.header('webhook-signature');

  if (!signature && !webhookId) {
    // In sandbox simulation, allow if payload is valid
    res.status(200).json({ received: true, simulated: true });
    return;
  }

  res.status(202).json({
    received: true,
    webhookId,
    eventType: req.body?.type || 'unknown'
  });
});

// ==========================================
// The Ξ (Xi) Economy & CogniOps API Routes
// ==========================================

app.get('/api/xi/floor', (_req, res) => {
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
    formula: 'Ξ_Floor = (0.012 * 0.25) + (0.024 * 0.40) + (0.035 * 0.20) + (0.008 * 0.15) = 0.0208 USD'
  });
});

app.post('/api/xi/burn', (req, res) => {
  const { customerId, xiUnits, reason, isElasticAccess } = req.body;
  if (!customerId || !xiUnits) {
    res.status(400).json({ error: 'customerId and xiUnits are required' });
    return;
  }

  const units = Number(xiUnits) || 1;
  res.json({
    success: true,
    burnedXi: units,
    reason: reason || 'CogniOps agent step inference',
    isElasticAccess: Boolean(isElasticAccess),
    revenueRecognizedUsd: units * 1.0,
    timestamp: Date.now()
  });
});

app.post('/api/xi/poa-reward', (req, res) => {
  const { contributorId, datasetWeightNk, qualityFactorFk, efficacyImpactEdata } = req.body;
  const nk = Number(datasetWeightNk) || 100;
  const fk = Math.min(1.0, Math.max(0, Number(qualityFactorFk) || 0.9));
  const edata = Number(efficacyImpactEdata) || 1.2;
  const mXi = 1.25;
  const alpha = 1.5;

  const rawReward = mXi * nk * Math.pow(fk, alpha) * edata;
  const rewardXi = Math.round(rawReward * 100) / 100;

  res.json({
    success: true,
    contributorId: contributorId || 'usr_operator_7842',
    rewardXi,
    classification: 'strategic_cogs_investment',
    formula: `R_Xi = ${mXi} * ${nk} * (${fk}^${alpha}) * ${edata} = ${rewardXi} Ξ`,
    timestamp: Date.now()
  });
});

app.get('/api/xi/sankey', (_req, res) => {
  res.json({
    nodes: [
      { id: 'fiat_sub', label: 'Customer Payments (Subscriptions)', category: 'input', value: 160000 },
      { id: 'fiat_overage', label: 'Customer Payments (Overage)', category: 'input', value: 40000 },
      { id: 'xi_pool', label: 'Available Ξ Pool (Minted Supply)', category: 'currency', value: 245000 },
      { id: 'exec_burn', label: 'CogniOps Execution (Revenue)', category: 'output', value: 128500 },
      { id: 'elastic_burn', label: 'Elastic Feature Access (Revenue)', category: 'output', value: 34200 },
      { id: 'poa_invest', label: 'Proof-of-Attribution Rewards', category: 'investment', value: 45000 },
      { id: 'terminal_cogs', label: 'Operational Costs (Hosting & GPU)', category: 'terminal', value: 2840.50 }
    ],
    links: [
      { source: 'Customer Payments (Subscriptions)', target: 'Available Ξ Pool (Minted Supply)', value: 160000 },
      { source: 'Customer Payments (Overage)', target: 'Available Ξ Pool (Minted Supply)', value: 40000 },
      { source: 'Proof-of-Attribution Rewards', target: 'Available Ξ Pool (Minted Supply)', value: 45000 },
      { source: 'Available Ξ Pool (Minted Supply)', target: 'CogniOps Execution (Revenue)', value: 128500 },
      { source: 'Available Ξ Pool (Minted Supply)', target: 'Elastic Feature Access (Revenue)', value: 34200 },
      { source: 'CogniOps Execution (Revenue)', target: 'Operational Costs (Hosting & GPU)', value: 2200 },
      { source: 'Elastic Feature Access (Revenue)', target: 'Operational Costs (Hosting & GPU)', value: 640 }
    ],
    totalVolumeXi: 407700,
    totalFiatInflowUsd: 200000,
    strategicCogsRatio: 0.18
  });
});

app.get('/api/xi/governance', (_req, res) => {
  res.json({
    committee: 'Hybrid Pricing & Value Committee (HPVC)',
    constants: {
      mintingMultiplier: 1.25,
      qualityExponent: 1.5,
      xiFloor: 0.0208,
      fiatPeg: '1 Ξ = 1 CAD'
    },
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
        title: 'Calibrate Quality Exponent alpha from 1.5 to 1.6 for stringent DPO curation',
        constantKey: 'qualityExponent',
        proposedValue: 1.6,
        status: 'active',
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
