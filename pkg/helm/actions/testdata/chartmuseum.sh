#!/bin/bash
# chartmuseum server running with TLS
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

echo "Starting chartmuseum TLS on port 9443..." >&2

# Verify TLS files exist
if [ ! -f ./server.crt ] || [ ! -f ./server.key ]; then
  echo "ERROR: TLS cert/key missing. Expected ./server.crt and ./server.key" >&2
  ls -la ./server.* >&2 || true
  exit 1
fi

"$BINARY" --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key \
  > ./chartmuseum-9443.log 2>&1 &
CM_PID=$!
echo $CM_PID > ./chartmuseum-tls.pid
sleep 3
if ! kill -0 $CM_PID 2>/dev/null; then
  echo "ERROR: chartmuseum (TLS) exited within 3s. Exit code:" >&2
  wait $CM_PID 2>/dev/null; echo "  $?" >&2
  echo "Log contents:" >&2
  cat ./chartmuseum-9443.log >&2
  echo "---" >&2
  exit 1
fi
echo "chartmuseum TLS started (PID $CM_PID)" >&2