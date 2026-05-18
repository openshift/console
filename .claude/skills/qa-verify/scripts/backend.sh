#!/bin/bash
# backend.sh — Start or stop the OpenShift Console backend server
# Usage: backend.sh --start <id>     Start server, save PID/log
#        backend.sh --stop <id>      Stop server by saved PID
#        backend.sh --status <id>    Check if server is running
set -euo pipefail

ACTION=""
ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start)  ACTION="start";  shift; ID="${1:-}"; shift || true ;;
    --stop)   ACTION="stop";   shift; ID="${1:-}"; shift || true ;;
    --status) ACTION="status"; shift; ID="${1:-}"; shift || true ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$ACTION" ] || [ -z "$ID" ]; then
  echo "Usage: backend.sh --start|--stop|--status <id>" >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
RUN_DIR="${REPO_ROOT}/.artifacts/qa-verify/servers/${ID}"

case "$ACTION" in
  start)
    # Fail fast if port 9000 is already in use
    if lsof -ti :9000 >/dev/null 2>&1; then
      echo "ERROR: Port 9000 is already in use (PID: $(lsof -ti :9000 | head -1))" >&2
      echo "Stop the existing process first: kill $(lsof -ti :9000 | head -1)" >&2
      exit 1
    fi

    mkdir -p "$RUN_DIR"

    cd "$REPO_ROOT"
    nohup bash -c "source ./contrib/oc-environment.sh && ./bin/bridge -branding openshift" \
      > "${RUN_DIR}/server.log" 2>&1 &
    echo $! > "${RUN_DIR}/server.pid"

    echo "Waiting for server on port 9000..."
    for i in $(seq 1 90); do
      if ! kill -0 "$(cat "${RUN_DIR}/server.pid")" 2>/dev/null; then
        echo "ERROR: Server process exited unexpectedly. Last log:" >&2
        tail -20 "${RUN_DIR}/server.log" >&2
        rm -f "${RUN_DIR}/server.pid"
        exit 1
      fi
      if curl -s --max-time 5 --connect-timeout 3 http://localhost:9000 >/dev/null 2>&1; then
        echo "Server ready (PID: $(cat "${RUN_DIR}/server.pid"))"
        exit 0
      fi
      sleep 2
    done

    echo "ERROR: Server did not start within 3 minutes" >&2
    kill "$(cat "${RUN_DIR}/server.pid")" 2>/dev/null || true
    rm -f "${RUN_DIR}/server.pid"
    exit 1
    ;;

  stop)
    if [ -f "${RUN_DIR}/server.pid" ]; then
      PID=$(cat "${RUN_DIR}/server.pid")
      kill "$PID" 2>/dev/null || true
      rm -f "${RUN_DIR}/server.pid"
      sleep 3
      if kill -0 "$PID" 2>/dev/null; then
        echo "WARNING: Process $PID still running after SIGTERM, sending SIGKILL" >&2
        kill -9 "$PID" 2>/dev/null || true
        sleep 1
      fi
      echo "Server stopped (was PID: $PID)"
    else
      echo "No server found for id: $ID (already stopped)" >&2
      exit 0
    fi
    ;;

  status)
    if [ -f "${RUN_DIR}/server.pid" ] && kill -0 "$(cat "${RUN_DIR}/server.pid")" 2>/dev/null; then
      echo "Running (PID: $(cat "${RUN_DIR}/server.pid"))"
      exit 0
    else
      echo "Not running"
      exit 1
    fi
    ;;
esac
