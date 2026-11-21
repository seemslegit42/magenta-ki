# GitLab Flow & Version Control Guide

This repository follows **GitLab Flow** with strict local Git hooks via **Lefthook** and automated **GitLab CI/CD** pipelines running on **Bun**, **Biome**, and **Go**.

---

## 1. Branching Strategy (GitLab Flow)

```
feature/*  ──(Merge Request + CI)──▶  main  ──(Promote)──▶  staging (Business UAT)  ──(Sign-Off)──▶  production
fix/*      ──(Merge Request + CI)──▶  main
hotfix/*   ─────────────────────────▶  production  ──(Backport MR)──▶  main
```

| Branch | Purpose | Protection & Merge Policy | Automated Pipeline Action |
| :--- | :--- | :--- | :--- |
| `main` | Always-deployable integration trunk | Protected; Merge Requests required; CI green required | Runs Biome, Bun Unit/Integration/E2E, Go tests, builds artifacts, deploys Staging |
| `staging` | Pre-production Business Stakeholder UAT environment | Protected; receives fast-forward promotions from `main` | Deploys Staging Docker + Caddy stack and exposes Business Acceptance Portal (`/uat`) |
| `production` | Live customer environment | Protected; manual release gate after Business UAT sign-off | Verifies UAT sign-off and deploys production release tag |
| `feature/*` | Short-lived feature branches (`feature/uat-portal`) | Created from `main`; deleted after Merge Request | Runs `quality` + `test` stages on every push and MR |
| `fix/*` | Non-urgent bug fixes (`fix/storage-validation`) | Created from `main`; merged via MR | Runs `quality` + `test` stages |
| `hotfix/*` | Critical production fixes (`hotfix/auth-token`) | Branched from `production`, cherry-picked back to `main` | Full test + immediate build verification |

---

## 2. Commit Message Convention

All commits are validated locally by Lefthook (`commit-msg`) using **Conventional Commits**:

```text
<type>(<optional-scope>): <short plain summary>
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `perf`, `build`, `style`, `revert`.

Examples:
- `feat(uat): add stakeholder sign-off export report`
- `fix(api): enforce immutable createdBy field on project updates`
- `ci(gitlab): cache bun dependencies across test jobs`

---

## 3. Local Git Hooks (Lefthook)

Hooks are defined in `lefthook.yml` and automatically installed via `bun run prepare` (or `bunx lefthook install`):

1. **`pre-commit`** (parallel):
   - Runs `biome check` on staged TypeScript/JS/JSON files.
   - Runs `tsc --noEmit` strict typechecking.
2. **`commit-msg`**:
   - Enforces Conventional Commits formatting.
3. **`pre-push`**:
   - Runs `bun test tests/unit tests/integration`.
   - Runs `go test ./...` automatically when the Go toolchain is present locally.

---

## 4. Merge Request Checklist

- [ ] Branch created from latest `main` using `feature/*` or `fix/*` naming.
- [ ] All Lefthook `pre-commit` and `pre-push` checks passed locally.
- [ ] New behavior includes Unit, Integration, or E2E coverage as appropriate.
- [ ] Business-facing changes are reflected in `docs/uat-plan.md` and the UAT Portal scenarios.
- [ ] `CHANGELOG.md` and `TODO.md` updated.
