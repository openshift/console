#!/bin/bash

# Kill chartmuseum by PID file — avoids killing processes owned by other
# test packages running in parallel (see OCPBUGS-115318).
if [ -f chartmuseum-chartproxy.pid ]; then
  pid=$(< chartmuseum-chartproxy.pid)
  if [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
    kill -TERM "$pid" 2>/dev/null || echo "chartmuseum (chartproxy) is not currently running."
  else
    echo "chartmuseum (chartproxy) PID file contains invalid value: $pid" >&2
  fi
  rm -f chartmuseum-chartproxy.pid
fi
