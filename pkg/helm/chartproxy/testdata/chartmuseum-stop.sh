#!/bin/bash

# Kill chartmuseum by PID file — avoids killing processes owned by other
# test packages running in parallel (see OCPBUGS-115318).
if [ -f chartmuseum-chartproxy.pid ]; then
  pid=$(< chartmuseum-chartproxy.pid)
  if [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "chartmuseum (chartproxy) is not currently running."
    elif [[ "$(ps -p "$pid" -o comm= 2>/dev/null)" == "chartmuseum" ]]; then
      kill -TERM "$pid" 2>/dev/null
    else
      echo "PID $pid from chartmuseum-chartproxy.pid is not chartmuseum, skipping" >&2
    fi
  else
    echo "chartmuseum (chartproxy) PID file contains invalid value: $pid" >&2
  fi
  rm -f chartmuseum-chartproxy.pid
fi
