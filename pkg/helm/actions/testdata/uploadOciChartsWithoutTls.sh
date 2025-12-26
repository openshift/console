#!/bin/bash -e
# Upload Helm charts as OCI artifacts to zot registry (without TLS)

# Change to the script's parent directory (pkg/helm/actions/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

REGISTRY="localhost:5000"
CHARTS_DIR="../testdata"
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

# Use local helm binary if available, otherwise use system helm
if [ -x "./$GOOS-$GOARCH/helm" ]; then
  HELM="./$GOOS-$GOARCH/helm"
elif command -v helm &> /dev/null; then
  HELM="helm"
else
  echo "Error: Helm not found. Run ./downloadHelm.sh first or install helm."
  exit 1
fi

# Push charts to OCI registry using helm push
# Using --plain-http for non-TLS registry

echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
$HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --plain-http

echo "Pushing mariadb-7.3.5.tgz to oci://$REGISTRY/helm-charts..."
$HELM push $CHARTS_DIR/mariadb-7.3.5.tgz oci://$REGISTRY/helm-charts --plain-http

echo "Charts pushed successfully!"

