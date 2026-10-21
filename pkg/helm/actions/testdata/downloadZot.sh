#!/bin/bash -e

GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
ZOT_VERSION=${ZOT_VERSION:-2.1.6}
ZOT_ARTIFACT_URL="https://github.com/project-zot/zot/releases/download/v$ZOT_VERSION/zot-$GOOS-$GOARCH"

mkdir -p "$GOOS-$GOARCH"

if [[ ! -f "$GOOS-$GOARCH/zot" ]]; then
  curl -fL -o "$GOOS-$GOARCH/zot" "$ZOT_ARTIFACT_URL"
  chmod +x "$GOOS-$GOARCH/zot"
fi

exit 0
