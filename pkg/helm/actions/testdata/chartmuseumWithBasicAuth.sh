#!/bin/bash
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
BINARY="./$GOOS-$GOARCH/chartmuseum"
mkdir -p ./chartstore-8181
if [ ! -x "$BINARY" ]; then
  echo "ERROR: chartmuseum binary not found at $BINARY" >&2
  exit 1
fi
echo "Starting chartmuseum (basic auth) on port 8181..." >&2
exec "$BINARY" --debug --port=8181 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-8181" \
  --basic-auth-user="AzureDiamond" \
  --basic-auth-pass="hunter2"

