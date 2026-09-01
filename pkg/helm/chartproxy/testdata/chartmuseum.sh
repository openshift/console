#!/bin/bash
# chartmuseum server running with TLS for chartproxy tests
# Use exec so the process stays as the direct child of the Go test runner.
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
BINARY="./$GOOS-$GOARCH/chartmuseum"
mkdir -p ./chartstore-9553
if [ ! -x "$BINARY" ]; then
  echo "ERROR: chartmuseum binary not found or not executable at $BINARY" >&2
  ls -la "./$GOOS-$GOARCH/" >&2
  exit 1
fi
echo "Starting chartmuseum (chartproxy) on port 9553..." >&2
echo $$ > ./chartmuseum-chartproxy.pid
exec "$BINARY" --debug --port=9553 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9553" \
  --tls-cert=./server.crt --tls-key=./server.key
