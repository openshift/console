#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=/tmp/artifacts
export ARTIFACT_DIR

function copyArtifacts {
  echo "Copying artifacts from $(pwd)..."
  cp -rv ./gui_test_screenshots "${ARTIFACT_DIR}/gui_test_screenshots"
}

trap copyArtifacts EXIT

./build.sh

oc login -u kubeadmin -p $(cat "${ARTIFACT_DIR}/installer/auth/kubeadmin-password")

source ./contrib/oc-environment.sh

kubectl create -f https://raw.githubusercontent.com/operator-framework/operator-lifecycle-manager/master/deploy/okd/manifests/0.8.0/0000_30_06-rh-operators.configmap.yaml
kubectl create -f https://raw.githubusercontent.com/operator-framework/operator-lifecycle-manager/master/deploy/okd/manifests/0.8.0/0000_30_09-rh-operators.catalogsource.yaml

. ./test-gui.sh e2e
