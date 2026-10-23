/** Bun control-plane configuration (peer to go/). */

function env(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

const appwriteEndpoint = env("APPWRITE_ENDPOINT");
const appwriteProjectId = env("APPWRITE_PROJECT_ID");
const appwriteApiKey = env("APPWRITE_API_KEY");
const appwriteBucketId = env("APPWRITE_BUCKET_ID");

export const config = {
  port: Number(process.env.BUN_API_PORT || process.env.PORT || 1991),
  host: process.env.BUN_API_HOST || "0.0.0.0",
  /** When set, /api/xi/* is proxied to the Go control plane (Phase C). */
  goApiUrl: (process.env.GO_API_URL || "").replace(/\/$/, ""),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  development: process.env.NODE_ENV !== "production",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  embedOrigin: process.env.EMBED_ORIGIN || "http://localhost:3000",

  /** Local file by default; optional embedded replica via sync URL. */
  tursoUrl: env("TURSO_URL", "file:./data/lxvos-shell.db"),
  tursoSyncUrl: env("TURSO_SYNC_URL"),
  tursoAuthToken: env("TURSO_AUTH_TOKEN"),
  tursoSyncInterval: Number(process.env.TURSO_SYNC_INTERVAL || 60),

  appwriteEndpoint,
  appwriteProjectId,
  appwriteApiKey,
  appwriteBucketId,
  /** Prefer Appwrite blobs only when all required env vars are present. */
  useAppwriteBlobs: Boolean(
    appwriteEndpoint && appwriteProjectId && appwriteApiKey && appwriteBucketId,
  ),
  localBlobRoot: env("LOCAL_BLOB_ROOT", "./data/blobs"),
} as const;
