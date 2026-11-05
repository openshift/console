#!/bin/bash

# Stop the chartproxy chartmuseum process by PID file.
source "$(dirname "${BASH_SOURCE[0]}")/../../testdata/stop_fixture.sh"

stop_fixture chartmuseum-chartproxy.pid chartmuseum "chartmuseum (chartproxy)"
