# Control-plane split

Tags: bun, go, angular, proxy

## Flow
1. Host `bun run dev` → Angular `:3000` (`angular.json` proxy).
2. `/api` → Bun `:1991` (`proxy.conf.json` → `bun/cmd/server/index.ts`).
3. Routes: `ai` | `polar` | `xi` (`bun/internal/handlers/index.ts`).
4. Xi peel: set `GO_API_URL` → proxy (`bun/internal/handlers/xi.ts`) → `go/cmd/server/main.go` `:8080`.

## Pointers
- `bun/internal/config.ts` — ports, `goApiUrl`, Gemini key
- `go/gateway/README.md` — peel instructions
- `bun/internal/http/errors.ts` — `{ error: { code, message } }`

## Gotcha
Without `GO_API_URL`, Xi responses are local stubs — host still works.
