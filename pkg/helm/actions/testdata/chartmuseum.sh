#!/bin/bash
# chartmuseum server running with TLS
# Use exec so the process stays as the direct child of the Go test runner
# (ExecuteScript starts this with waitForCompletion=false). Backgrounding
# then exiting the shell can leave chartmuseum unreaped / dead before
# readiness checks on some platforms.
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
# PID stays the same across exec; stop scripts / diagnostics can read it.
echo $$ > ./chartmuseum-tls.pid
exec "$BINARY" --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key \
  > ./chartmuseum-9443.log 2>&1
