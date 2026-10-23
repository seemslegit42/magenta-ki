import { apiError } from "../http/errors";
import { config } from "../config";

type PolarEvent = Record<string, unknown>;

export const polarRoutes = {
  "/api/polar/events/ingest": {
    async POST(req: Request): Promise<Response> {
      let body: { events?: unknown };
      try {
        body = (await req.json()) as { events?: unknown };
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      if (!Array.isArray(body.events)) {
        return apiError(400, "VALIDATION_ERROR", "Payload must contain an events array");
      }
      const events = body.events as PolarEvent[];
      let totalCost = 0;
      for (const e of events) {
        const meta = e["metadata"] as Record<string, unknown> | undefined;
        const cost = meta?.["_cost"] as { amount?: number } | undefined;
        if (cost?.amount) {
          totalCost += Number(cost.amount);
        }
      }
      return Response.json(
        {
          status: "success",
          ingested: events.length,
          totalCostCentsAdded: totalCost,
          timestamp: Date.now(),
        },
        { status: 202 },
      );
    },
  },

  "/api/polar/checkouts": {
    async POST(req: Request): Promise<Response> {
      let body: {
        products?: unknown;
        externalCustomerId?: string;
        customerEmail?: string;
        successUrl?: string;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      if (!Array.isArray(body.products) || body.products.length === 0) {
        return apiError(400, "VALIDATION_ERROR", "At least one product ID is required");
      }
      const checkoutId = `chk_${Math.random().toString(36).slice(2, 11)}`;
      const url = `https://checkout.polar.sh/c/${checkoutId}?embed_origin=${encodeURIComponent(config.embedOrigin)}`;
      return Response.json(
        {
          checkoutId,
          url,
          status: "open",
          products: body.products,
          externalCustomerId: body.externalCustomerId || "usr_operator_7842",
          customerEmail: body.customerEmail || "operator@verdigris.cloud",
          successUrl: (
            body.successUrl ||
            "https://verdigris.cloud/success?checkout_id={CHECKOUT_ID}"
          ).replace("{CHECKOUT_ID}", checkoutId),
        },
        { status: 201 },
      );
    },
  },

  "/api/polar/customer-state/:id": {
    async GET(req: Request & { params: { id: string } }): Promise<Response> {
      const customerId = req.params.id;
      return Response.json({
        customerId: "cus_verdigris_operator",
        externalCustomerId: customerId,
        email: "operator@verdigris.cloud",
        name: "Elena Rostova (Lead Architect)",
        subscriptions: [
          {
            id: "sub_active_core_01",
            productId: "prod_core_kernel",
            productName: "Verdigris Cloud OS Core",
            status: "active",
            currentPeriodStart: Date.now() - 86400000 * 14,
            currentPeriodEnd: Date.now() + 86400000 * 16,
            cancelAtPeriodEnd: false,
            priceAmount: 4900,
            currency: "usd",
            seats: 5,
          },
        ],
        benefits: [
          {
            id: "ben_feature_flags",
            type: "feature_flag",
            description: "Unlimited WASM OPFS and WOPI locks",
            isGranted: true,
          },
          {
            id: "ben_license_keys",
            type: "license_keys",
            description: "Cryptographic node licenses",
            isGranted: true,
          },
        ],
        meters: [
          {
            meterId: "mtr_ai_tokens",
            meterName: "AI LLM Inference Tokens",
            consumedUnits: 125000,
            creditedUnits: 5000000,
            balance: 4875000,
          },
          {
            meterId: "mtr_edge_pings",
            meterName: "Edge Gateway Requests",
            consumedUnits: 342,
            creditedUnits: 10000,
            balance: 9658,
          },
        ],
      });
    },
  },

  "/api/polar/webhooks": {
    async POST(req: Request): Promise<Response> {
      const webhookId = req.headers.get("webhook-id");
      const signature = req.headers.get("webhook-signature");
      let eventType = "unknown";
      try {
        const body = (await req.json()) as { type?: string };
        eventType = body?.type || "unknown";
      } catch {
        // empty body allowed in sandbox
      }
      if (!signature && !webhookId) {
        return Response.json({ received: true, simulated: true });
      }
      return Response.json(
        { received: true, webhookId, eventType },
        { status: 202 },
      );
    },
  },
} as const;
