#!/bin/bash
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
BINARY="./$GOOS-$GOARCH/chartmuseum"
mkdir -p ./chartstore-9181
if [ ! -x "$BINARY" ]; then
  echo "ERROR: chartmuseum binary not found at $BINARY" >&2
  exit 1
fi
echo "Starting chartmuseum (no TLS) on port 9181..." >&2
if ! echo $$ > ./chartmuseum-no-tls.pid; then
  echo "ERROR: failed to write PID file ./chartmuseum-no-tls.pid" >&2
  exit 1
fi
exec "$BINARY" --debug --port=9181 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9181"

