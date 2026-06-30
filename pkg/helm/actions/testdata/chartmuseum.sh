#!/bin/bash
# chartmuseum server running
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
BINARY="./$GOOS-$GOARCH/chartmuseum"
mkdir -p ./chartstore-9443
if [ ! -x "$BINARY" ]; then
  echo "ERROR: chartmuseum binary not found or not executable at $BINARY" >&2
  ls -la "./$GOOS-$GOARCH/" >&2
  exit 1
fi
echo "Starting chartmuseum TLS on port 9443..." >&2
exec "$BINARY" --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key