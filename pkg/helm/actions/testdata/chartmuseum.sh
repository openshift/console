#!/bin/bash
# chartmuseum server running
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
./$GOOS-$GOARCH/chartmuseum --debug --port=9443 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9443" \
  --tls-cert=./server.crt --tls-key=./server.key