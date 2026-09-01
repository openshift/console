#!/bin/bash

# Kill chartmuseum processes by PID file — avoids killing processes owned
# by other test packages running in parallel (see OCPBUGS-115318).
for pidfile in chartmuseum-tls.pid chartmuseum-no-tls.pid chartmuseum-basicauth.pid; do
  if [ -f "$pidfile" ]; then
    pid=$(< "$pidfile")
    if [[ "$pid" =~ ^[0-9]+$ ]]; then
      kill -TERM "$pid" 2>/dev/null || echo "chartmuseum ($pidfile) is not currently running."
    else
      echo "chartmuseum ($pidfile) contains invalid PID: $pid" >&2
    fi
    rm -f "$pidfile"
  fi
done
