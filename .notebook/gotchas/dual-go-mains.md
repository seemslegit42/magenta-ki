# Dual Go mains

Tags: go, entrypoints

## Two packages named main
- Documented: `go/cmd/server/main.go` — stdlib mux, Xi + items + console.
- Also: `go/app.go` — Gin + Appwrite SDK + Blades + `internal/patterns/*` (~600 LOC).

## Risk
`go run .` from `go/` vs `go run ./cmd/server` hit different surfaces.

## Docs
- Peel docs assume `cmd/server` (`go/gateway/README.md`, root `README.md`).
