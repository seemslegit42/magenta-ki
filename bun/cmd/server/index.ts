/**
 * Bun control-plane entry (peer to go/cmd/server/main.go).
 * Serves /api/* — Angular NF host proxies here in development.
 */
import { config } from "../../internal/config";
import { apiRoutes } from "../../internal/handlers";
import { corsPreflight, withCors } from "../../internal/middleware/cors";

type RouteHandler = (req: Request) => Response | Promise<Response>;
type MethodMap = Record<string, RouteHandler>;

/** Wrap every method handler so responses get CORS headers. */
function withCorsRoutes(
  routes: Record<string, MethodMap>,
): Record<string, MethodMap> {
  const out: Record<string, MethodMap> = {};
  for (const [path, methods] of Object.entries(routes)) {
    const wrapped: MethodMap = {};
    for (const [method, handler] of Object.entries(methods)) {
      wrapped[method] = async (req: Request) => withCors(await handler(req));
    }
    // Preflight on each path
    wrapped.OPTIONS = () => corsPreflight();
    out[path] = wrapped;
  }
  return out;
}

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  development: config.development,
  routes: withCorsRoutes(apiRoutes as unknown as Record<string, MethodMap>),
  fetch(req) {
    if (req.method === "OPTIONS") {
      return corsPreflight();
    }
    return withCors(new Response("Not Found", { status: 404 }));
  },
});

console.log(
  `ΛΞVOS Bun control plane listening on ${server.url} (GO_API_URL=${config.goApiUrl || "unset — local Xi stubs"})`,
);
