# Simulated backends

Tags: auth, turso, gateway, demos

## Facts
- `go/internal/middleware/auth.go` — default operator if no Bearer; token not verified.
- `GatewayService` (`ts/apps/host/app/services/gateway.service.ts`) — mock tenant, fake Turso URL/logs/queries.
- Many Appwrite/Polar UI paths are client-side services with tests asserting mock behavior.

## Implication
Do not treat green unit/e2e suites as proof of live Appwrite/Turso/Polar wiring.
Live peel today: Bun Gemini + optional Go Xi routes + Bun Polar URL shaping.
