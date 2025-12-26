#!/bin/bash -e
# Upload Helm charts as OCI artifacts to zot registry (with TLS)

# Change to the script's parent directory (pkg/helm/actions/)
cd "$(dirname "$0")"

REGISTRY="localhost:5443"
CACERT="./cacert.pem"
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
echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
$HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --ca-file=$CACERT

echo "Charts pushed successfully!"
