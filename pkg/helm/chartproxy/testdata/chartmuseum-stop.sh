#!/bin/bash

# Kill chartmuseum by PID file — avoids killing processes owned by other
# test packages running in parallel (see OCPBUGS-115318).
if [ -f chartmuseum-chartproxy.pid ]; then
  kill -TERM $(< chartmuseum-chartproxy.pid) 2>/dev/null || echo "chartmuseum (chartproxy) is not currently running."
  rm -f chartmuseum-chartproxy.pid
fi
