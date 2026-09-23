#!/usr/bin/env bash
set -euo pipefail

ROOT="${NEXVARY_ROOT:-/opt/nexvary-security}"
cd "$ROOT/deploy"

echo "== Docker services =="
docker compose --env-file .env -f compose.yaml ps

echo
echo "== HackGPT local API =="
curl -fsS http://127.0.0.1:8000/api/health
echo

echo
echo "== NEXVARY connector local =="
curl -fsS http://127.0.0.1:8787/api/v1/health
echo

if [[ -n "${NEXVARY_FQDN:-}" ]]; then
  echo
  echo "== HTTPS gateway =="
  curl -fsS "https://${NEXVARY_FQDN}/api/v1/health"
  echo
fi
