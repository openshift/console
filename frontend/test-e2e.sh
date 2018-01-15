#!/usr/bin/env bash

set -e

if [ -z "$CONSOLE_URL" ] && [ -z "$BRIDGE_BASE_ADDRESS" ]
then
  echo 'No CONSOLE_URL or BRIDGE_BASE_ADDRESS. Defaulting to http://localhost:9000/'
  CONSOLE_URL='http://localhost:9000/'
fi

if [ -z "$CONSOLE_URL" ]
then
  if [ -z "$BRIDGE_BASE_PATH" ]
  then
    echo 'No BRIDGE_BASE_PATH. Defaulting to /'
    BRIDGE_BASE_PATH=/
  fi
  CONSOLE_URL="${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}"
fi

proto=$(echo "$CONSOLE_URL" | grep :// | sed -e 's,^\(.*://\).*,\1,g')
url="${CONSOLE_URL/$proto/}" # url without protocol
host_with_port=$(echo "$url" | sed 's/\/.*$//')
# shellcheck disable=SC2001
host=$(echo "$host_with_port" | sed 's/:.*$//')
port=$(echo "$host_with_port" | grep : | sed -e 's,^.*:,:,g' -e 's,.*:\([0-9]*\).*,\1,g')

BRIDGE_BASE_ADDRESS="${proto}${host_with_port}"
BRIDGE_BASE_PATH="/$(echo "$url" | grep / | cut -d/ -f2-)"

# Run chrome to create cert db
timeout 30 google-chrome --no-sandbox --headless --disable-gpu --dump-dom "$CONSOLE_URL"

if [ "$proto" == 'https://' ]
then
  if [ -z "$port" ]; then
    port=443
  fi
  echo 'GET /' | timeout 30 openssl s_client -showcerts -connect "$host:$port" | openssl x509 -outform PEM > bridge-e2e.pem
  certutil -d "sql:$HOME/.pki/nssdb" -A -n bridge -t Pu,, -i bridge-e2e.pem
fi

export BRIDGE_BASE_ADDRESS
export BRIDGE_BASE_PATH

out=/out
set +e
mkdir -p $out
failed=1
if TAP_LOG="$out/tap.log" yarn run test-gui --output $out; then
  failed=0
fi
cp -a ./gui_test_screenshots $out/

exit $failed
