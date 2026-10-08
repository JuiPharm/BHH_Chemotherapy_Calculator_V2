#!/usr/bin/env bash
# GitHub Codespaces ONLY. Starts an isolated local Wrangler+D1 staging preview.
# No wrangler login, no Cloudflare remote D1 operation, no deployment, no actual users.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
mkdir -p v3/.staging-secrets
chmod 700 v3/.staging-secrets
log="v3/.staging-secrets/codespaces-preview.log"
credentials="v3/.staging-secrets/CODESPACES_LOGIN.txt"
status="$(curl -sS -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:8792/api/session 2>/dev/null || true)"
if [[ "$status" != "401" ]]; then
  rm -f "$credentials"
  nohup node v3/tests/run-staging-local.mjs --serve >"$log" 2>&1 </dev/null &
  server_pid=$!
  printf '%s\n' "$server_pid" >v3/.staging-secrets/codespaces-preview.pid
  ready=0
  for ((i=0; i<120; i++)); do
    if grep -q 'BHH STAGING LOCAL PREVIEW' "$log" 2>/dev/null; then ready=1; break; fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "BHH local preview failed; see $log"
      tail -n 30 "$log" || true
      exit 1
    fi
    sleep 1
  done
  if [[ "$ready" != "1" ]]; then
    echo "BHH local preview did not start; see $log"
    exit 1
  fi
fi
if [[ -f "$log" ]]; then
  sed -n '/BHH STAGING LOCAL PREVIEW/,/Local D1 is temporary/p' "$log" >"$credentials"
  chmod 600 "$credentials"
fi
printf '\nBHH V3 LOCAL STAGING TEST\n'
printf '1. Open the PORTS tab and choose 8792 (keep Port Visibility PRIVATE).\n'
printf '2. Open the forwarded HTTPS browser URL; the app redirects to /login.\n'
printf '3. Read v3/.staging-secrets/CODESPACES_LOGIN.txt for FAKE tester email, password and Authenticator seeds.\n'
printf '4. Data/credentials are TEMPORARY; never use real patient data.\n'
printf '5. Stop the Codespace when testing is finished to preserve free usage.\n\n'
