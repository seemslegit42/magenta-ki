import { apiError } from "../http/errors";
import { config } from "../config";

/** Local stub responses (used when GO_API_URL is unset). */
function localFloor(): Response {
  return Response.json({
    xiFloorUsd: 0.0208,
    fiatPegCurrency: "CAD",
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
    formula:
      "Ξ_Floor = (0.012 * 0.25) + (0.024 * 0.40) + (0.035 * 0.20) + (0.008 * 0.15) = 0.0208 USD",
  });
}

async function proxyToGo(req: Request): Promise<Response | null> {
  if (!config.goApiUrl) {
    return null;
  }
  const url = new URL(req.url);
  const target = `${config.goApiUrl}${url.pathname}${url.search}`;
  const headers = new Headers(req.headers);
  headers.delete("host");
  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  try {
    return await fetch(target, init);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Go control plane unreachable";
    return apiError(502, "GO_UPSTREAM_ERROR", message);
  }
}

export const xiRoutes = {
  "/api/xi/floor": {
    async GET(req: Request): Promise<Response> {
      return (await proxyToGo(req)) ?? localFloor();
    },
  },

  "/api/xi/burn": {
    async POST(req: Request): Promise<Response> {
      const proxied = await proxyToGo(req);
      if (proxied) {
        return proxied;
      }
      let body: {
        customerId?: string;
        xiUnits?: number;
        reason?: string;
        isElasticAccess?: boolean;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      if (!body.customerId || body.xiUnits === undefined) {
        return apiError(
          400,
          "VALIDATION_ERROR",
          "customerId and xiUnits are required",
        );
      }
      const units = Number(body.xiUnits) || 1;
      return Response.json({
        success: true,
        burnedXi: units,
        reason: body.reason || "CogniOps agent step inference",
        isElasticAccess: Boolean(body.isElasticAccess),
        revenueRecognizedUsd: units * 1.0,
        timestamp: Date.now(),
      });
    },
  },

  "/api/xi/poa-reward": {
    async POST(req: Request): Promise<Response> {
      const proxied = await proxyToGo(req);
      if (proxied) {
        return proxied;
      }
      let body: {
        contributorId?: string;
        datasetWeightNk?: number;
        qualityFactorFk?: number;
        efficacyImpactEdata?: number;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      const nk = Number(body.datasetWeightNk) || 100;
      const fk = Math.min(1.0, Math.max(0, Number(body.qualityFactorFk) || 0.9));
      const edata = Number(body.efficacyImpactEdata) || 1.2;
      const mXi = 1.25;
      const alpha = 1.5;
      const rawReward = mXi * nk * Math.pow(fk, alpha) * edata;
      const rewardXi = Math.round(rawReward * 100) / 100;
      return Response.json({
        success: true,
        contributorId: body.contributorId || "usr_operator_7842",
        rewardXi,
        classification: "strategic_cogs_investment",
        formula: `R_Xi = ${mXi} * ${nk} * (${fk}^${alpha}) * ${edata} = ${rewardXi} Ξ`,
        timestamp: Date.now(),
      });
    },
  },

  "/api/xi/sankey": {
    async GET(req: Request): Promise<Response> {
      const proxied = await proxyToGo(req);
      if (proxied) {
        return proxied;
      }
      return Response.json({
        nodes: [
          {
            id: "fiat_sub",
            label: "Customer Payments (Subscriptions)",
            category: "input",
            value: 160000,
          },
          {
            id: "fiat_overage",
            label: "Customer Payments (Overage)",
            category: "input",
            value: 40000,
          },
          {
            id: "xi_pool",
            label: "Available Ξ Pool (Minted Supply)",
            category: "currency",
            value: 245000,
          },
          {
            id: "exec_burn",
            label: "CogniOps Execution (Revenue)",
            category: "output",
            value: 128500,
          },
          {
            id: "elastic_burn",
            label: "Elastic Feature Access (Revenue)",
            category: "output",
            value: 34200,
          },
          {
            id: "poa_invest",
            label: "Proof-of-Attribution Rewards",
            category: "investment",
            value: 45000,
          },
          {
            id: "terminal_cogs",
            label: "Operational Costs (Hosting & GPU)",
            category: "terminal",
            value: 2840.5,
          },
        ],
        links: [
          {
            source: "Customer Payments (Subscriptions)",
            target: "Available Ξ Pool (Minted Supply)",
            value: 160000,
          },
          {
            source: "Customer Payments (Overage)",
            target: "Available Ξ Pool (Minted Supply)",
            value: 40000,
          },
          {
            source: "Proof-of-Attribution Rewards",
            target: "Available Ξ Pool (Minted Supply)",
            value: 45000,
          },
          {
            source: "Available Ξ Pool (Minted Supply)",
            target: "CogniOps Execution (Revenue)",
            value: 128500,
          },
          {
            source: "Available Ξ Pool (Minted Supply)",
            target: "Elastic Feature Access (Revenue)",
            value: 34200,
          },
          {
            source: "CogniOps Execution (Revenue)",
            target: "Operational Costs (Hosting & GPU)",
            value: 2200,
          },
          {
            source: "Elastic Feature Access (Revenue)",
            target: "Operational Costs (Hosting & GPU)",
            value: 640,
          },
        ],
        totalVolumeXi: 407700,
        totalFiatInflowUsd: 200000,
        strategicCogsRatio: 0.18,
      });
    },
  },

  "/api/xi/governance": {
    async GET(req: Request): Promise<Response> {
      const proxied = await proxyToGo(req);
      if (proxied) {
        return proxied;
      }
      return Response.json({
        committee: "Hybrid Pricing & Value Committee (HPVC)",
        constants: {
          mintingMultiplier: 1.25,
          qualityExponent: 1.5,
          xiFloor: 0.0208,
          fiatPeg: "1 Ξ = 1 CAD",
        },
        proposals: [
          {
            id: "prop_hpvc_01",
            title:
              "Index Xi Floor to reflect 15% GPU cluster efficiency optimization",
            constantKey: "xiFloor",
            proposedValue: 0.0185,
            status: "approved",
            approvals: 14,
            rejections: 1,
          },
          {
            id: "prop_hpvc_02",
            title:
              "Calibrate Quality Exponent alpha from 1.5 to 1.6 for stringent DPO curation",
            constantKey: "qualityExponent",
            proposedValue: 1.6,
            status: "active",
            approvals: 8,
            rejections: 2,
          },
        ],
      });
    },
  },
} as const;
