#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Verdigris Cloud OS - Go Contract Generator
# Location: /contracts/scripts/codegen-go.sh
# Generates Go types and Chi router contracts from /contracts/
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

OPENAPI_SPEC="${ROOT_DIR}/contracts/openapi/webos.v1.yaml"
SQL_SCHEMA="${ROOT_DIR}/contracts/sql/schema.sql"
GO_OUT_DIR="${ROOT_DIR}/go/pkg/contracts"

mkdir -p "${GO_OUT_DIR}"

echo "[codegen-go] Generating Go contracts from OpenAPI & SQL..."

if command -v oapi-codegen >/dev/null 2>&1; then
  oapi-codegen -generate types,chi-server -package contracts \
    "${OPENAPI_SPEC}" > "${GO_OUT_DIR}/api.gen.go"
  echo "[codegen-go] Generated ${GO_OUT_DIR}/api.gen.go"
else
  echo "[codegen-go] oapi-codegen not installed; stubbing target directory for Phase 2."
fi

if command -v sqlc >/dev/null 2>&1; then
  (cd "${ROOT_DIR}" && sqlc generate)
  echo "[codegen-go] sqlc models generated"
fi

echo "[codegen-go] Pipeline complete."
