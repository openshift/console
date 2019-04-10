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

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${INSTALLER_DIR}/auth/kubeadmin-password")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

# Add htpasswd IDP
oc apply -f ./frontend/integration-tests/data/htpasswd-idp.yaml

./test-gui.sh ${1:-e2e}
