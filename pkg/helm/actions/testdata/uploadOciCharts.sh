#!/bin/bash -e
# Upload Helm charts as OCI artifacts to zot registry
# Usage: uploadOciCharts.sh --tls | --no-tls | --basic-auth

# Change to the script's directory (pkg/helm/actions/testdata/)
cd "$(dirname "$0")"
export HELM_CONFIG_HOME="${TMPDIR:-/tmp}/helm-config"
export HELM_REGISTRY_CONFIG="${HELM_CONFIG_HOME}/registry/config.json"
mkdir -p "${HELM_CONFIG_HOME}/registry"

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
mode="${1:-"--no-tls"}"
case $mode in 
  "--tls")
    REGISTRY="localhost:5443"
    echo "Pushing mariadb-7.3.5.tgz to oci://$REGISTRY/helm-charts..."
    $HELM push $CHARTS_DIR/mariadb-7.3.5.tgz oci://$REGISTRY/helm-charts --ca-file=$CACERT
  ;;
  "--basic-auth")
    REGISTRY="localhost:5001"
    echo "Logging in to oci://$REGISTRY with basic auth..."
    $HELM registry login $REGISTRY --username AzureDiamond --password "hunter2" --plain-http
    echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
    $HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --plain-http
  ;;
  "--no-tls" )
    REGISTRY="localhost:5000"
    echo "Pushing mychart-0.1.0.tgz to oci://$REGISTRY/helm-charts..."
    $HELM push $CHARTS_DIR/mychart-0.1.0.tgz oci://$REGISTRY/helm-charts --plain-http
  ;;
  *)
  echo "Unrecognized argument \"${mode}\"." >&2
  echo "Usage: uploadOciCharts.sh --tls | --no-tls | --basic-auth" >&2
  exit 2
  ;;
esac
echo "Charts pushed successfully!"
