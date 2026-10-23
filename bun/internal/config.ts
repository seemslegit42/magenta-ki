/** Bun control-plane configuration (peer to go/). */

export const config = {
  port: Number(process.env.BUN_API_PORT || process.env.PORT || 1991),
  host: process.env.BUN_API_HOST || "0.0.0.0",
  /** When set, /api/xi/* is proxied to the Go control plane (Phase C). */
  goApiUrl: (process.env.GO_API_URL || "").replace(/\/$/, ""),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  development: process.env.NODE_ENV !== "production",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  embedOrigin: process.env.EMBED_ORIGIN || "http://localhost:3000",
} as const;
