#!/bin/bash -ex

if [ $BILLFORWARD_ENDPOINT == "https://api.billforward.net:443/v1/" ]; then
    echo "Never reset the production Billforward products/plans! Exiting"
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

go run "$SCRIPT_DIR/bf-catalog.go" reset-bf
