#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=frontend/gui_test_screenshots
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -rv "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/gui_test_screenshots"
  fi
}

trap copyArtifacts EXIT

export BRIDGE_AUTH_USERNAME=kubeadmin
# don't log kubeadmin-password
set +x
export BRIDGE_AUTH_PASSWORD="$(cat "${INSTALLER_DIR}/auth/kubeadmin-password")"
set -x
export BRIDGE_BASE_ADDRESS="https://$(oc get route console -n openshift-console -o jsonpath='{.spec.host}')"

oc create -f https://raw.githubusercontent.com/operator-framework/operator-lifecycle-manager/master/deploy/okd/manifests/0.8.0/0000_30_06-rh-operators.configmap.yaml
oc create -f https://raw.githubusercontent.com/operator-framework/operator-lifecycle-manager/master/deploy/okd/manifests/0.8.0/0000_30_09-rh-operators.catalogsource.yaml

./test-gui.sh e2e
