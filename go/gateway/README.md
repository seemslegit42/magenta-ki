# Go Gateway (Phase 2 / Phase C)

Authoritative Ξ Economy routes already live in [`../cmd/server/main.go`](../cmd/server/main.go):

- `GET /api/xi/floor`
- `POST /api/xi/burn`
- `POST /api/xi/poa-reward`
- `GET /api/xi/sankey`
- `GET /api/xi/governance`

## Peel from Bun

The Bun control plane (`bun/cmd/server`) proxies `/api/xi/*` to Go when:

```bash
export GO_API_URL=http://127.0.0.1:8080
bun run bun:api
```

Start Go first:

```bash
cd go && go run ./cmd/server
```

Until `GO_API_URL` is set, Bun serves local Xi stubs so the Angular host keeps working.
