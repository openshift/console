#!/bin/bash -e
# Start zot OCI registry server with basic auth (htpasswd)
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

mkdir -p ./zot-storage-5001

./$GOOS-$GOARCH/zot serve ./testdata/zot-config-basicauth.json &
echo $! > ./zot-basicauth.pid
