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
echo "Starting chartmuseum TLS on port 9443..." >&2
"$BINARY" --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key \
  > ./chartmuseum-9443.log 2>&1 &
CM_PID=$!
echo $CM_PID > ./chartmuseum-tls.pid
sleep 1
if ! kill -0 $CM_PID 2>/dev/null; then
  echo "ERROR: chartmuseum (TLS) exited immediately. Log:" >&2
  cat ./chartmuseum-9443.log >&2
  exit 1
fi
echo "chartmuseum TLS started (PID $CM_PID)" >&2