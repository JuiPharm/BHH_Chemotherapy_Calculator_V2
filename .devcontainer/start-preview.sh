#!/usr/bin/env bash
# Codespaces browser preview, never Cloudflare --remote or deploy.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
mkdir -p v3/.staging-secrets
chmod 700 v3/.staging-secrets
exec 9>v3/.staging-secrets/.start-preview.lock
flock -w 120 -x 9 || { echo "BHH preview is being started in another Codespaces session."; exit 1; }
log="v3/.staging-secrets/codespaces-preview.log"
credentials="v3/.staging-secrets/CODESPACES_LOGIN.txt"
pidfile="v3/.staging-secrets/codespaces-preview.pid"
probe() { curl -sS --max-time 4 -o /dev/null -w '%{http_code}' http://127.0.0.1:8792/api/session 2>/dev/null || true; }
if [[ "$(probe)" != "401" ]]; then
  if [[ -f "$pidfile" ]]; then
    oldpid="$(cat "$pidfile" || true)"
    if [[ "$oldpid" =~ ^[0-9]+$ ]] && kill -0 "$oldpid" 2>/dev/null; then
      kill "$oldpid" 2>/dev/null || true
      sleep 1
    fi
  fi
  # Files are ignored, and contain only temporary artificial user details.
  rm -f "$credentials"
  if [[ ! -f node_modules/wrangler/bin/wrangler.js ]]; then
    echo "BHH: npm dependencies missing; see Codespaces creation log."
    exit 1
  fi
  nohup node v3/tests/run-staging-local.mjs --serve >"$log" 2>&1 </dev/null &
  server_pid=$!
  printf '%s\n' "$server_pid" > "$pidfile"
  ready=0
  for ((i=0;i<150;i++)); do
    if [[ "$(probe)" == "401" ]] && grep -q 'BHH STAGING LOCAL PREVIEW' "$log"; then
      ready=1
      break
    fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "BHH local preview process exited. Recent diagnostics:"
      tail -n 40 "$log" || true
      exit 1
    fi
    sleep 1
  done
  if [[ "$ready" != "1" ]]; then
    echo "BHH preview not healthy on port 8792, inspect $log"
    tail -n 30 "$log" || true
    exit 1
  fi
fi
if [[ -f "$log" ]]; then
  sed -n '/BHH STAGING LOCAL PREVIEW/,/Local D1 is temporary/p' "$log" > "$credentials"
  chmod 600 "$credentials"
fi
echo "BHH_CODESPACES_PREVIEW_OK port=8792 endpoint=/login"
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  echo "Visit https://${CODESPACE_NAME}-8792.app.github.dev/login"
fi
echo "Use the PORTS tab and keep port 8792 PRIVATE."
echo "See v3/.staging-secrets/CODESPACES_LOGIN.txt for SYNTHETIC credentials."
echo "If the forwarded link returns 502 while local port is healthy, remove/re-add port 8792 in PORTS."
