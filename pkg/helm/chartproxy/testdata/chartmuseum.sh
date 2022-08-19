#!/bin/bash
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
./$GOOS-$GOARCH/chartmuseum --debug --port=9553 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9553" \
  --tls-cert=./server.crt --tls-key=./server.key 
