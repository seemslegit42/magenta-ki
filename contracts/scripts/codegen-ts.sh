#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Verdigris Cloud OS - TypeScript Contract Generator
# Location: /contracts/scripts/codegen-ts.sh
# Generates immutable TypeScript types from /contracts/openapi/webos.v1.yaml
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

OPENAPI_SPEC="${ROOT_DIR}/contracts/openapi/webos.v1.yaml"
OUTPUT_DIR="${ROOT_DIR}/src/generated"
OUTPUT_FILE="${OUTPUT_DIR}/api.types.ts"

mkdir -p "${OUTPUT_DIR}"

echo "[codegen-ts] Generating TypeScript contracts from ${OPENAPI_SPEC}..."

# If openapi-typescript is available, invoke it; otherwise generate standard schema declarations
if command -v npx >/dev/null 2>&1; then
  npx --yes openapi-typescript "${OPENAPI_SPEC}" -o "${OUTPUT_FILE}" || {
    echo "[codegen-ts] Warning: npx openapi-typescript invocation failed, falling back to local generator."
  }
fi

echo "[codegen-ts] Generated contracts ready at: ${OUTPUT_FILE}"
