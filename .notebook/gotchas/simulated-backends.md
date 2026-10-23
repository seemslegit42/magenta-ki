# Simulated backends

Tags: auth, turso, gateway, demos

## Facts
- `go/internal/middleware/auth.go` — default operator if no Bearer; token not verified (no auth product yet).
- `GatewayService` now calls Bun `/api/db/*` (live Turso local file by default).
- Many Appwrite Databases / Polar / AgentFS UI paths remain client-side mocks.
- VFS tree is live in Turso; blobs default to `data/blobs/` unless Appwrite env is complete.

## Implication
Green gateway tests with mocked `fetch` ≠ proof of a running Bun server.
Live peel today: Bun Gemini + Turso/VFS + optional Go Xi + Polar URL shaping.

