#!/bin/bash -e
# Download Helm CLI for pushing OCI charts

GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

if [[ -z "${HELM_VERSION}" ]]; then
  echo "Error: HELM_VERSION environment variable is not set."
  echo "Please set HELM_VERSION (e.g., export HELM_VERSION=v3.19.0)"
  exit 1
fi

HELM_ARTIFACT_URL="https://get.helm.sh/helm-${HELM_VERSION}-${GOOS}-${GOARCH}.tar.gz"

mkdir -p "$GOOS-$GOARCH"

if [[ ! -f "$GOOS-$GOARCH/helm" ]]; then
  echo "Downloading Helm ${HELM_VERSION}..."
  curl -L -o helm.tar.gz "$HELM_ARTIFACT_URL"
  tar xzf helm.tar.gz --strip-components=1 -C "$GOOS-$GOARCH" "${GOOS}-${GOARCH}/helm"
  chmod +x "$GOOS-$GOARCH/helm"
fi

exit 0
