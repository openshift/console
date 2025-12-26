#!/bin/bash -e
# Download Helm CLI for pushing OCI charts

GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
HELM_VERSION=${HELM_VERSION:-v3.19.0}
HELM_ARTIFACT_URL="https://get.helm.sh/helm-${HELM_VERSION}-${GOOS}-${GOARCH}.tar.gz"

mkdir -p "$GOOS-$GOARCH"

if [[ ! -f "$GOOS-$GOARCH/helm" ]]; then
  echo "Downloading Helm ${HELM_VERSION}..."
  curl -L -o helm.tar.gz "$HELM_ARTIFACT_URL"
  tar xzf helm.tar.gz --strip-components=1 -C "$GOOS-$GOARCH" "${GOOS}-${GOARCH}/helm"
  chmod +x "$GOOS-$GOARCH/helm"
fi

exit 0

