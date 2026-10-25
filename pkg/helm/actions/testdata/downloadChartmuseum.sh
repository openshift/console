#!/bin/bash

set -e
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
CHARTMUSEUM_VERSION=${CHARTMUSEUM_VERSION:-0.16.0}
CHARTMUSEUM_ARTIFACT_URL=https://get.helm.sh/chartmuseum-v${CHARTMUSEUM_VERSION}-$GOOS-$GOARCH.tar.gz

if [ ! -f "$GOOS-$GOARCH/chartmuseum" ]; then
curl -fL -o chartmuseum.tar.gz $CHARTMUSEUM_ARTIFACT_URL
tar xf chartmuseum.tar.gz
chmod +x "$GOOS-$GOARCH/chartmuseum"
fi

exit 0

# linux-amd64/chartmuseum is available from now on