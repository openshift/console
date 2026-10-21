#!/bin/bash -e
# Start zot OCI registry server with TLS
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

mkdir -p ./zot-storage-5443

./$GOOS-$GOARCH/zot serve ./testdata/zot-config-tls.json &
echo $! > ./zot.pid
