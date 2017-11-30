#!/bin/sh

set -x

# Run chrome to create cert db
timeout 30 google-chrome --no-sandbox --headless --disable-gpu --dump-dom "$BRIDGE_HOST"

set -e

BRIDGE_HOST=$(echo "$BRIDGE_BASE_ADDRESS" | sed 's/https:\/\///')
echo 'GET /' | timeout 30 openssl s_client -showcerts -connect "$BRIDGE_HOST:443" | openssl x509 -outform PEM > bridge-e2e.pem
certutil -d "sql:$HOME/.pki/nssdb" -A -n bridge -t Pu,, -i bridge-e2e.pem

yarn run test-gui
