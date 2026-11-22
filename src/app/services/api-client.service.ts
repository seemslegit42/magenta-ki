import { Injectable } from '@angular/core';
import type { ApiClientResult, ApiErrorEnvelope } from '../models/feedback.models';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  public async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiClientResult<T>> {
    const method = options.method ?? 'GET';
    const timeoutMs = options.timeoutMs ?? 6000;
    const isIdempotent =
      method === 'GET' || method === 'PUT' || method === 'DELETE' || Boolean(options.idempotencyKey);
    const maxRetries = options.retries ?? (isIdempotent ? 1 : 0);
    const correlationId = `cor_${this.randomId()}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Correlation-Id': correlationId,
      ...(options.headers || {}),
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(path, {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(timeoutMs),
        });

        const payload = await this.safeParseJson(res);
        if (res.ok) {
          return { ok: true, data: payload as T };
        }

        const envelope = this.extractErrorEnvelope(payload, res.status, correlationId);
        const shouldRetry = isIdempotent && envelope.retryable && attempt < maxRetries;
        if (!shouldRetry) {
          return { ok: false, error: envelope };
        }

        await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
      } catch (err: unknown) {
        const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
        const envelope: ApiErrorEnvelope = {
          code: isTimeout ? 'CLIENT_TIMEOUT' : 'NETWORK_UNREACHABLE',
          message: isTimeout
            ? `Request timed out after ${timeoutMs}ms. Please retry.`
            : 'Unable to reach application API gateway.',
          retryable: true,
          correlationId,
          timestamp: Date.now(),
        };

        if (!isIdempotent || attempt >= maxRetries) {
          return { ok: false, error: envelope };
        }
        await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
      }
    }

    return {
      ok: false,
      error: {
        code: 'UNKNOWN_CLIENT_ERROR',
        message: 'Unexpected request failure.',
        retryable: false,
        correlationId,
        timestamp: Date.now(),
      },
    };
  }

  private async safeParseJson(res: Response): Promise<unknown> {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
    try {
      const text = await res.text();
      return text ? { error: text } : null;
    } catch {
      return null;
    }
  }

  private extractErrorEnvelope(payload: unknown, status: number, correlationId: string): ApiErrorEnvelope {
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      const rawErr = 'error' in obj ? obj['error'] : obj;
      if (rawErr && typeof rawErr === 'object' && 'message' in rawErr) {
        const env = rawErr as Partial<ApiErrorEnvelope>;
        return {
          code: env.code || `HTTP_${status}`,
          message: String(env.message),
          serviceId: env.serviceId,
          retryable: Boolean(env.retryable ?? status >= 500),
          upstreamStatus: status,
          correlationId: env.correlationId || correlationId,
          timestamp: env.timestamp || Date.now(),
        };
      }
      if (typeof rawErr === 'string') {
        return {
          code: `HTTP_${status}`,
          message: rawErr,
          retryable: status === 429 || status >= 500,
          upstreamStatus: status,
          correlationId,
          timestamp: Date.now(),
        };
      }
    }

    return {
      code: `HTTP_${status}`,
      message: `Request failed with HTTP ${status}.`,
      retryable: status === 429 || status >= 500,
      upstreamStatus: status,
      correlationId,
      timestamp: Date.now(),
    };
  }

  private randomId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  }
}
