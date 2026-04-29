#!/bin/bash -e
# Upload Helm charts as OCI artifacts to zot registry
# Usage: uploadOciCharts.sh --tls | --no-tls | --basic-auth

# Change to the script's directory (pkg/helm/actions/testdata/)
cd "$(dirname "$0")"

CACERT="../cacert.pem"
CHARTS_DIR="../../testdata"
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}

# Use local helm binary if available, otherwise use system helm
if [[ -x "../$GOOS-$GOARCH/helm" ]]; then
  HELM="../$GOOS-$GOARCH/helm"
elif command -v helm &> /dev/null; then
  HELM="helm"
else
  echo "Error: Helm not found. Run ./downloadHelm.sh first or install helm."
  exit 1
fi

# Push charts to OCI registry using helm push
if [[ $1 == "--tls" ]]; then
  REGISTRY="localhost:5443"
  echo "Pushing mariadb-7.3.5.tgz to oci://$REGISTRY/helm-charts..."
  $HELM push $CHARTS_DIR/mariadb-7.3.5.tgz oci://$REGISTRY/helm-charts --ca-file=$CACERT
elif [[ $1 == "--basic-auth" ]]; then
  REGISTRY="localhost:5001"
  echo "Logging in to oci://$REGISTRY with basic auth..."
  echo "hunter2" | $HELM registry login $REGISTRY --username AzureDiamond --password-stdin --plain-http
  echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
  $HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --plain-http
else
  REGISTRY="localhost:5000"
  echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
  $HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --plain-http
fi

echo "Charts pushed successfully!"
