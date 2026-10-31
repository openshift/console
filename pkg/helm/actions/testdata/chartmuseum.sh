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

# Verify binary can execute (catches glibc/library incompatibility)
if ! "$BINARY" --version > /dev/null 2>&1; then
  echo "ERROR: chartmuseum binary cannot execute (likely library incompatibility)" >&2
  echo "ldd output:" >&2
  ldd "$BINARY" >&2 || true
  file "$BINARY" >&2 || true
  exit 1
fi

# Verify TLS files exist
if [ ! -f ./server.crt ] || [ ! -f ./server.key ]; then
  echo "ERROR: TLS cert/key missing. Expected ./server.crt and ./server.key" >&2
  ls -la ./server.* >&2 || true
  exit 1
fi

echo "Starting chartmuseum TLS on port 9443..." >&2
# PID stays the same across exec; stop scripts / diagnostics can read it.
if ! echo $$ > ./chartmuseum-tls.pid; then
  echo "ERROR: failed to write PID file ./chartmuseum-tls.pid" >&2
  exit 1
fi
exec "$BINARY" --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key \
  > ./chartmuseum-9443.log 2>&1
