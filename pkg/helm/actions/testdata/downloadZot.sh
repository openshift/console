#!/bin/bash -e

GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
ZOT_VERSION=${ZOT_VERSION:-v2.1.6}
ZOT_ARTIFACT_URL="https://github.com/project-zot/zot/releases/download/$ZOT_VERSION/zot-$GOOS-$GOARCH"

mkdir -p "$GOOS-$GOARCH"

if [ ! -f "$GOOS-$GOARCH/zot" ]; then
  curl -L -o "$GOOS-$GOARCH/zot" "$ZOT_ARTIFACT_URL"
  chmod +x "$GOOS-$GOARCH/zot"
fi

exit 0
