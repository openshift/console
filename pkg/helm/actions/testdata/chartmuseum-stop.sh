#!/bin/bash

# Stop chartmuseum processes by PID file.
source "$(dirname "${BASH_SOURCE[0]}")/../../testdata/stop_fixture.sh"

for pidfile in chartmuseum-tls.pid chartmuseum-no-tls.pid chartmuseum-basicauth.pid; do
  stop_fixture "$pidfile" chartmuseum "chartmuseum"
done
