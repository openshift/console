#!/bin/bash
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
./$GOOS-$GOARCH/chartmuseum --debug --port=9181 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-9181"

