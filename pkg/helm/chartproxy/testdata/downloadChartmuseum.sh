#!/bin/bash

set -e

CHARTMUSEUM_VERSION=${CHARTMUSEUM_VERSION:-0.14.0}
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
CHARTMUSEUM_ARTIFACT_URL=https://get.helm.sh/chartmuseum-v${CHARTMUSEUM_VERSION}-$GOOS-$GOARCH.tar.gz

if [ ! -f "$GOOS-$GOARCH/chartmuseum" ]; then
curl -o chartmuseum.tar.gz -O $CHARTMUSEUM_ARTIFACT_URL
tar xf chartmuseum.tar.gz
fi

exit 0

# linux-amd64/chartmuseum is available from now on