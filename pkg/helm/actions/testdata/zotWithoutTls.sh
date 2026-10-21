#!/bin/bash -e
# Start zot OCI registry server without TLS
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

mkdir -p ./zot-storage-5000

./$GOOS-$GOARCH/zot serve ./testdata/zot-config.json &
echo $! > ./zot-no-tls.pid
