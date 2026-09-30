#!/bin/bash

# Kill chartmuseum processes by PID file — avoids killing processes owned
# by other test packages running in parallel (see OCPBUGS-115318).
for pidfile in chartmuseum-tls.pid chartmuseum-no-tls.pid chartmuseum-basicauth.pid; do
  if [ -f "$pidfile" ]; then
    pid=$(< "$pidfile")
    if [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
      if ! kill -0 "$pid" 2>/dev/null; then
        echo "chartmuseum ($pidfile) is not currently running."
      elif [[ "$(ps -p "$pid" -o comm= 2>/dev/null)" == "chartmuseum" ]]; then
        kill -TERM "$pid" 2>/dev/null
      else
        echo "PID $pid from $pidfile is not chartmuseum, skipping" >&2
      fi
    else
      echo "chartmuseum ($pidfile) contains invalid PID: $pid" >&2
    fi
    rm -f "$pidfile"
  fi
done
