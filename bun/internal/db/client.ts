/**
 * Turso / libSQL client for the Λ Ξ V O S Bun control plane.
 * Local file by default; optional embedded replica when sync URL is set.
 */
import { createClient, type Client } from "@libsql/client";
import { config } from "../config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let client: Client | null = null;

function ensureLocalDir(url: string): void {
  if (!url.startsWith("file:")) return;
  const path = url.slice("file:".length);
  if (!path || path === ":memory:") return;
  mkdirSync(dirname(path), { recursive: true });
}

export function getDb(): Client {
  if (client) return client;

  ensureLocalDir(config.tursoUrl);

  const hasSync = Boolean(config.tursoSyncUrl && config.tursoAuthToken);
  client = createClient(
    hasSync
      ? {
          url: config.tursoUrl,
          syncUrl: config.tursoSyncUrl,
          authToken: config.tursoAuthToken,
          syncInterval: config.tursoSyncInterval,
          offline: true,
        }
      : {
          url: config.tursoUrl,
        },
  );
  return client;
}

export function dbMode(): "local" | "embedded-replica" {
  return config.tursoSyncUrl && config.tursoAuthToken
    ? "embedded-replica"
    : "local";
}

export async function syncDb(): Promise<{ synced: boolean; reason?: string }> {
  if (dbMode() !== "embedded-replica") {
    return { synced: false, reason: "local-only" };
  }
  const db = getDb();
  if (typeof db.sync === "function") {
    await db.sync();
    return { synced: true };
  }
  return { synced: false, reason: "sync-unavailable" };
}
