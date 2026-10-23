import { dbMode, getDb, syncDb } from "../db/client";
import { config } from "../config";
import { apiError } from "../http/errors";

function isSafeSingleStatement(sql: string): boolean {
  const trimmed = sql.trim();
  if (!trimmed) return false;
  // Reject stacked statements / comments that hide extras.
  const withoutStrings = trimmed.replace(/'([^']|'')*'/g, "");
  if (withoutStrings.includes(";")) return false;
  return true;
}

export const dbRoutes = {
  "/api/db/health": {
    async GET(): Promise<Response> {
      return Response.json({
        mode: dbMode(),
        url: config.tursoUrl,
        syncConfigured: Boolean(config.tursoSyncUrl && config.tursoAuthToken),
      });
    },
  },

  "/api/db/query": {
    async POST(req: Request): Promise<Response> {
      let body: { sql?: string; args?: unknown[] };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return apiError(400, "INVALID_JSON", "Request body must be JSON");
      }
      if (!body.sql || typeof body.sql !== "string") {
        return apiError(400, "VALIDATION_ERROR", "sql is required");
      }
      if (!isSafeSingleStatement(body.sql)) {
        return apiError(
          400,
          "VALIDATION_ERROR",
          "Only a single parameterized SQL statement is allowed",
        );
      }
      try {
        const result = await getDb().execute({
          sql: body.sql,
          args: Array.isArray(body.args) ? body.args : [],
        });
        const columns = result.columns ?? [];
        const rows = result.rows.map((row) =>
          columns.map((col) => (row as Record<string, unknown>)[col]),
        );
        return Response.json({ columns, rows, rowsAffected: result.rowsAffected });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Query failed";
        return apiError(400, "QUERY_FAILED", message);
      }
    },
  },

  "/api/db/sync": {
    async POST(): Promise<Response> {
      try {
        const result = await syncDb();
        return Response.json(result, {
          status: result.synced ? 200 : 200,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Sync failed";
        return apiError(502, "SYNC_FAILED", message);
      }
    },
  },
} as const;
