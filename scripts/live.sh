#!/usr/bin/env bash
# Runs Kardify in production mode on this Mac and exposes it to the internet
# through a free Cloudflare quick tunnel (https://<random>.trycloudflare.com).
#
#   ./scripts/live.sh start    # tunnel + build + API + web (takes ~1-2 min)
#   ./scripts/live.sh status   # show URL and process state
#   ./scripts/live.sh stop     # stop everything
#
# The URL changes on every start. Postgres (and Redis, if configured) must be running.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN="$ROOT/.run"
mkdir -p "$RUN"

pid_alive() { [[ -f "$RUN/$1.pid" ]] && kill -0 "$(cat "$RUN/$1.pid")" 2>/dev/null; }

# npm/npx wrappers don't forward SIGTERM, so kill the whole process tree.
kill_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do kill_tree "$child"; done
  kill "$1" 2>/dev/null || true
}

stop_one() {
  if pid_alive "$1"; then kill_tree "$(cat "$RUN/$1.pid")"; echo "stopped $1"; fi
  rm -f "$RUN/$1.pid"
}

start_bg() { # name, workdir, command...
  local name=$1 dir=$2; shift 2
  (cd "$dir" && nohup "$@" >"$RUN/$name.log" 2>&1 & echo $! >"$RUN/$name.pid")
}

wait_http() { # url, label
  for _ in $(seq 1 90); do curl -fsS -o /dev/null "$1" 2>/dev/null && return 0; sleep 1; done
  echo "ERROR: $2 did not start. See $RUN/$2.log" >&2; exit 1
}

cmd_stop() { for s in web api tunnel caffeinate; do stop_one "$s"; done; rm -f "$RUN/url"; }

cmd_status() {
  for s in tunnel api web; do printf '%-7s %s\n' "$s" "$(pid_alive "$s" && echo running || echo stopped)"; done
  [[ -f "$RUN/url" ]] && echo "URL     $(cat "$RUN/url")"
}

cmd_start() {
  cmd_stop >/dev/null
  for port in 3000 4000; do
    if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null; then
      echo "Port $port is busy (stop your dev server first): $(lsof -ti tcp:$port -sTCP:LISTEN | head -1)" >&2; exit 1
    fi
  done

  echo "1/4 Starting Cloudflare tunnel..."
  start_bg tunnel "$ROOT" cloudflared tunnel --no-autoupdate --url http://localhost:3000
  local url=""
  for _ in $(seq 1 60); do
    url=$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$RUN/tunnel.log" | head -1 || true)
    [[ -n "$url" ]] && break; sleep 1
  done
  [[ -z "$url" ]] && { echo "ERROR: no tunnel URL. See $RUN/tunnel.log" >&2; exit 1; }
  echo "$url" >"$RUN/url"
  echo "    $url"

  echo "2/4 Building API..."
  (cd "$ROOT/backend" && npm run build >"$RUN/api-build.log" 2>&1) || { echo "API build failed: $RUN/api-build.log" >&2; exit 1; }

  echo "3/4 Building web app for $url ..."
  (cd "$ROOT/frontend" && NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_APP_URL="$url" BACKEND_INTERNAL_URL=http://localhost:4000 \
    npx next build >"$RUN/web-build.log" 2>&1) || { echo "Web build failed: $RUN/web-build.log" >&2; exit 1; }

  echo "4/4 Starting API and web app..."
  # Variables set here override backend/.env (Node's --env-file never overrides existing env).
  start_bg api "$ROOT/backend" env NODE_ENV=production PORT=4000 FRONTEND_URL="$url" API_PUBLIC_URL="$url" \
    CORS_ORIGINS="$url,http://localhost:3000" TRUST_PROXY_HOPS=2 FRONTEND_INTERNAL_URL=http://localhost:3000 node --env-file-if-exists=.env dist/main.js
  wait_http http://localhost:4000/api/health api

  start_bg web "$ROOT/frontend" env NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 \
    BACKEND_INTERNAL_URL=http://localhost:4000 NEXT_PUBLIC_APP_URL="$url" npx next start
  wait_http http://localhost:3000/en web

  # Keep the Mac from idle-sleeping while the tunnel runs.
  start_bg caffeinate "$ROOT" caffeinate -i -w "$(cat "$RUN/tunnel.pid")"

  echo
  echo "Kardify is live: $url"
  echo "Logs: $RUN/{tunnel,api,web}.log   Stop: ./scripts/live.sh stop"
}

case "${1:-}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  *) echo "Usage: $0 {start|stop|status}"; exit 1 ;;
esac
