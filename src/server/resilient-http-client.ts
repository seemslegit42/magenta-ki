import type { ApiErrorEnvelope, CircuitState, ExternalServiceContract } from '../app/models/feedback.models';

export interface ResilientRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxRetries?: number;
  idempotencyKey?: string;
  correlationId?: string;
  allowLocalLoopback?: boolean;
  allowedHosts?: string[];
}

export class IntegrationGatewayError extends Error {
  public readonly envelope: ApiErrorEnvelope;
  public readonly httpStatus: number;

  constructor(envelope: ApiErrorEnvelope, httpStatus = 502) {
    super(envelope.message);
    this.name = 'IntegrationGatewayError';
    this.envelope = envelope;
    this.httpStatus = httpStatus;
  }
}

interface CircuitRecord {
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
  lastCheckedAt: number | null;
  lastLatencyMs: number | null;
}

const PRIVATE_IPV4_PREFIXES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
];

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

export function assertSafeOutboundUrl(
  rawUrl: string,
  options: { allowedHosts?: string[]; allowLocalLoopback?: boolean } = {},
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new IntegrationGatewayError(
      {
        code: 'INVALID_OUTBOUND_URL',
        message: 'Malformed outbound service URL.',
        retryable: false,
        correlationId: `cor_${crypto.randomUUID().slice(0, 8)}`,
        timestamp: Date.now(),
      },
      400,
    );
  }

  const host = parsed.hostname.toLowerCase();
  const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (
    parsed.protocol !== 'https:' &&
    !(options.allowLocalLoopback && isLoopbackHost && parsed.protocol === 'http:')
  ) {
    throw new IntegrationGatewayError(
      {
        code: 'UNSAFE_PROTOCOL',
        message: `Blocked non-HTTPS outbound protocol (${parsed.protocol}) for security compliance.`,
        retryable: false,
        correlationId: `cor_${crypto.randomUUID().slice(0, 8)}`,
        timestamp: Date.now(),
      },
      403,
    );
  }

  if (!options.allowLocalLoopback && (isLoopbackHost || host.endsWith('.internal') || host === '[::1]')) {
    throw new IntegrationGatewayError(
      {
        code: 'SSRF_BLOCKED_HOST',
        message: `Outbound host "${host}" rejected by SSRF boundary guard.`,
        retryable: false,
        correlationId: `cor_${crypto.randomUUID().slice(0, 8)}`,
        timestamp: Date.now(),
      },
      403,
    );
  }

  if (!options.allowLocalLoopback && PRIVATE_IPV4_PREFIXES.some((pattern) => pattern.test(host))) {
    throw new IntegrationGatewayError(
      {
        code: 'SSRF_BLOCKED_PRIVATE_IP',
        message: `Private or link-local IP "${host}" is forbidden for external integrations.`,
        retryable: false,
        correlationId: `cor_${crypto.randomUUID().slice(0, 8)}`,
        timestamp: Date.now(),
      },
      403,
    );
  }

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const normalizedAllowed = options.allowedHosts.map((h) => h.toLowerCase());
    if (!normalizedAllowed.includes(host)) {
      throw new IntegrationGatewayError(
        {
          code: 'HOST_NOT_ALLOWLISTED',
          message: `Host "${host}" is not present in the service host allowlist.`,
          retryable: false,
          correlationId: `cor_${crypto.randomUUID().slice(0, 8)}`,
          timestamp: Date.now(),
        },
        403,
      );
    }
  }

  return parsed;
}

export const EXTERNAL_SERVICE_CONTRACTS: Omit<
  ExternalServiceContract,
  'circuitState' | 'consecutiveFailures' | 'lastCheckedAt' | 'lastLatencyMs'
>[] = [
  {
    id: 'gemini-ai',
    name: 'Google Gemini API',
    purpose: 'AI Copilot inference, structured JSON classification, and deep feedback enrichment',
    protocol: 'HTTPS / REST JSON + SSE Streaming',
    dataFormats: 'application/json (responseSchema), text/event-stream',
    authScheme: 'Server-only X-Goog-Api-Key (GEMINI_API_KEY)',
    timeoutMs: 15000,
    maxRetries: 2,
    allowedHosts: ['generativelanguage.googleapis.com'],
    rateLimitPolicy: 'Exponential backoff + Retry-After header compliance on HTTP 429',
    securityControls: [
      'Server-side SDK only (@google/genai); zero browser key exposure',
      'User-Agent attribution header and explicit 403/429/404 error propagation',
    ],
  },
  {
    id: 'appwrite-backend',
    name: 'Appwrite BaaS & TablesDB',
    purpose: 'Multi-tenant Projects/Items persistence, IAM tokens, Object Storage buffers, and Messaging',
    protocol: 'HTTPS / REST JSON + Binary Multipart Upload',
    dataFormats: 'application/json + InputFile binary buffers (zero raw Base64 in DB)',
    authScheme: 'Server X-Appwrite-Key + Project ID + Scoped Session JWT',
    timeoutMs: 3000,
    maxRetries: 2,
    allowedHosts: ['cloud.appwrite.io', 'localhost'],
    rateLimitPolicy: 'Bounded 2x retries for idempotent reads and 300ms fast local proxy',
    securityControls: [
      'Immutable createdBy and teamId ownership enforcement on every mutation',
      'Sanitized string trimming and server-side storage ID mapping',
    ],
  },
  {
    id: 'turso-libsql',
    name: 'Turso / libSQL Edge Mesh',
    purpose: 'Distributed tenant system preferences, AgentFS metadata, and replica telemetry',
    protocol: 'HTTPS Hrana Pipeline / libsql:// SQLite Wire',
    dataFormats: 'Hrana JSON/Protobuf SQL batches with parameterized bindings',
    authScheme: 'Per-tenant short-lived Bearer JWT (TURSO_AUTH_TOKEN)',
    timeoutMs: 2500,
    maxRetries: 2,
    allowedHosts: ['turso.io', 'libsql.internal', 'localhost'],
    rateLimitPolicy: 'Connection pooling + circuit-breaker failover after 3 failures',
    securityControls: [
      'Strictly parameterized SQL queries (sqlc contracts)',
      'Tenant isolation guard blocking cross-tenant SQL predicates',
    ],
  },
  {
    id: 'polar-billing',
    name: 'Polar.sh Usage Metering & Billing',
    purpose: 'AI token sub-cent cost metering, hosted checkout creation, and license verification',
    protocol: 'HTTPS / REST JSON + Signed Webhooks',
    dataFormats: 'application/json (_cost decimal cents) + Standard Webhooks',
    authScheme: 'Server Bearer PAT (POLAR_ACCESS_TOKEN) + HMAC-SHA256 Webhooks',
    timeoutMs: 5000,
    maxRetries: 3,
    allowedHosts: ['api.polar.sh', 'sandbox-api.polar.sh'],
    rateLimitPolicy: 'Idempotency-Key required on POST /checkouts and /events/ingest retries',
    securityControls: [
      'Timing-safe HMAC-SHA256 signature verification (webhook-signature)',
      '300-second webhook timestamp replay window enforcement',
    ],
  },
  {
    id: 'wopi-office',
    name: 'WOPI Office Host Integration',
    purpose: 'Collaborative document authoring with CheckFileInfo and lock contention handling',
    protocol: 'HTTPS / WOPI REST + Binary File Streams',
    dataFormats: 'application/json metadata + application/octet-stream payloads',
    authScheme: 'Scoped WOPI access_token + X-WOPI-Lock pessimistic concurrency header',
    timeoutMs: 4000,
    maxRetries: 1,
    allowedHosts: ['localhost', 'wopi.verdigris-webos.internal'],
    rateLimitPolicy: 'No blind retries on 409 Conflict lock mismatches; surface lock holder cleanly',
    securityControls: [
      'Per-document TTL lock tokens + RBAC document permission checks',
      'File extension/MIME validation on PutFile streams',
    ],
  },
  {
    id: 'gitlab-cicd',
    name: 'GitLab CI/CD & Federation Remotes',
    purpose: 'Pipeline webhook automation, staging health probes, and remote MFE manifest loading',
    protocol: 'HTTPS / REST JSON + ESM Import Maps',
    dataFormats: 'application/json + ECMAScript Modules',
    authScheme: 'X-Gitlab-Token (crypto.timingSafeEqual) + CSP script-src allowlist',
    timeoutMs: 3000,
    maxRetries: 2,
    allowedHosts: ['gitlab.com', 'staging.verdigris-webos.internal', 'localhost'],
    rateLimitPolicy: 'Cooldown circuit breaker on staging probes (30s open window)',
    securityControls: [
      'Strict host allowlist blocking private metadata IPs (SSRF guard)',
      'No wildcard CORS on authenticated trigger/rollback routes',
    ],
  },
];

export class ResilientHttpClient {
  private readonly circuits = new Map<string, CircuitRecord>();
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: {
    failureThreshold?: number;
    cooldownMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    this.failureThreshold = options?.failureThreshold ?? 3;
    this.cooldownMs = options?.cooldownMs ?? 30_000;
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  private getOrCreateCircuit(serviceId: string): CircuitRecord {
    let record = this.circuits.get(serviceId);
    if (!record) {
      record = {
        state: 'closed',
        consecutiveFailures: 0,
        openedAt: null,
        lastCheckedAt: null,
        lastLatencyMs: null,
      };
      this.circuits.set(serviceId, record);
    }
    return record;
  }

  public getCircuitSnapshot(serviceId: string): CircuitRecord {
    const rec = this.getOrCreateCircuit(serviceId);
    if (rec.state === 'open' && rec.openedAt !== null && Date.now() - rec.openedAt >= this.cooldownMs) {
      rec.state = 'half-open';
    }
    return { ...rec };
  }

  public recordSuccess(serviceId: string, latencyMs: number): void {
    this.circuits.set(serviceId, {
      state: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastCheckedAt: Date.now(),
      lastLatencyMs: latencyMs,
    });
  }

  public recordFailure(serviceId: string, latencyMs: number | null = null): void {
    const current = this.getOrCreateCircuit(serviceId);
    const failures = current.consecutiveFailures + 1;
    const shouldOpen = current.state === 'half-open' || failures >= this.failureThreshold;
    this.circuits.set(serviceId, {
      state: shouldOpen ? 'open' : 'closed',
      consecutiveFailures: failures,
      openedAt: shouldOpen ? Date.now() : current.openedAt,
      lastCheckedAt: Date.now(),
      lastLatencyMs: latencyMs,
    });
  }

  public listContractsWithHealth(): ExternalServiceContract[] {
    return EXTERNAL_SERVICE_CONTRACTS.map((contract) => {
      const circuit = this.getCircuitSnapshot(contract.id);
      return {
        ...contract,
        circuitState: circuit.state,
        consecutiveFailures: circuit.consecutiveFailures,
        lastCheckedAt: circuit.lastCheckedAt,
        lastLatencyMs: circuit.lastLatencyMs,
      };
    });
  }

  public async requestJson<T>(
    serviceId: string,
    url: string,
    options: ResilientRequestOptions = {},
  ): Promise<T> {
    const correlationId = options.correlationId || `cor_${crypto.randomUUID().slice(0, 8)}`;
    const method = options.method ?? 'GET';
    const timeoutMs = options.timeoutMs ?? 4000;
    const maxRetries = options.maxRetries ?? 2;
    const canRetryMethod = IDEMPOTENT_METHODS.has(method) || Boolean(options.idempotencyKey);

    assertSafeOutboundUrl(url, {
      allowedHosts: options.allowedHosts,
      allowLocalLoopback: options.allowLocalLoopback,
    });

    const snapshot = this.getCircuitSnapshot(serviceId);
    if (snapshot.state === 'open') {
      throw new IntegrationGatewayError(
        {
          code: 'CIRCUIT_OPEN',
          message: `Integration "${serviceId}" is temporarily paused after repeated upstream failures.`,
          serviceId,
          retryable: true,
          correlationId,
          timestamp: Date.now(),
        },
        503,
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Correlation-Id': correlationId,
      ...(options.headers || {}),
    };
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    let lastError: IntegrationGatewayError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startedAt = Date.now();
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body: options.body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        const latencyMs = Math.max(1, Date.now() - startedAt);

        if (response.ok) {
          this.recordSuccess(serviceId, latencyMs);
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return (await response.json()) as T;
          }
          return (await response.text()) as unknown as T;
        }

        const retryable = RETRYABLE_HTTP_STATUSES.has(response.status);
        if (response.status >= 500 || response.status === 429) {
          this.recordFailure(serviceId, latencyMs);
        }

        lastError = new IntegrationGatewayError(
          {
            code: response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_HTTP_ERROR',
            message: `Upstream "${serviceId}" responded with HTTP ${response.status}.`,
            serviceId,
            retryable,
            upstreamStatus: response.status,
            correlationId,
            timestamp: Date.now(),
          },
          response.status >= 500 ? 502 : response.status,
        );

        if (!retryable || !canRetryMethod || attempt === maxRetries) {
          throw lastError;
        }

        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
        const backoffMs =
          retryAfterMs > 0
            ? Math.min(retryAfterMs, 2000)
            : Math.floor(Math.random() * Math.min(1200, 120 * 2 ** attempt));
        if (backoffMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      } catch (err: unknown) {
        if (err instanceof IntegrationGatewayError) {
          if (!err.envelope.retryable || !canRetryMethod || attempt === maxRetries) {
            throw err;
          }
          lastError = err;
          continue;
        }

        const latencyMs = Math.max(1, Date.now() - startedAt);
        this.recordFailure(serviceId, latencyMs);

        const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
        lastError = new IntegrationGatewayError(
          {
            code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK_ERROR',
            message: isTimeout
              ? `Integration "${serviceId}" timed out after ${timeoutMs}ms.`
              : `Network error reaching integration "${serviceId}".`,
            serviceId,
            retryable: true,
            correlationId,
            timestamp: Date.now(),
          },
          504,
        );

        if (!canRetryMethod || attempt === maxRetries) {
          throw lastError;
        }

        const jitterMs = Math.floor(Math.random() * Math.min(1000, 100 * 2 ** attempt));
        if (jitterMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, jitterMs));
        }
      }
    }

    throw (
      lastError ||
      new IntegrationGatewayError(
        {
          code: 'UPSTREAM_UNKNOWN_FAILURE',
          message: `Integration "${serviceId}" failed unexpectedly.`,
          serviceId,
          retryable: false,
          correlationId,
          timestamp: Date.now(),
        },
        502,
      )
    );
  }
}
