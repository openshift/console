#!/bin/bash -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT=$(dirname $SCRIPT_DIR)
GIT_SHA=$(git rev-parse HEAD)

set -x
echo "Building Go binaries"
$SCRIPT_DIR/builder-run.sh ./build-all
echo "Building creme web assets"
$SCRIPT_DIR/builder-run.sh ./creme/build-web
set +x

echo "Building soy-prod image"
docker build -t quay.io/coreosinc/soy-prod:$GIT_SHA -f Dockerfile-all $PROJECT

echo "Building soy-dex image"
docker build -t quay.io/coreosinc/soy-dex:$GIT_SHA -f Dockerfile-dex $PROJECT

echo "Building soy-migrator image"
docker build -t quay.io/coreosinc/soy-migrator:$GIT_SHA -f Dockerfile-migrate $PROJECT

