#!/bin/bash
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
./$GOOS-$GOARCH/chartmuseum --debug --port=8181 \
  --storage="local" \
  --storage-local-rootdir="./chartstore-8181" \
  --basic-auth-user="AzureDiamond" \
  --basic-auth-pass="hunter2"

