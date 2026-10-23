import { config } from "../config";

/** Apply CORS headers to a Response (or build a CORS Response for OPTIONS). */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", config.corsOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, webhook-id, webhook-signature",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsPreflight(): Response {
  return withCors(new Response(null, { status: 204 }));
}
