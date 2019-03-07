#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=/tmp/artifacts
export ARTIFACT_DIR

function copyArtifacts {
  echo "Copying artifacts from $(pwd)..."
  cp -rv ./frontend/gui_test_screenshots "${ARTIFACT_DIR}/gui_test_screenshots"
}

trap copyArtifacts EXIT

./build.sh

oc login -u system:admin
oc adm policy add-cluster-role-to-user cluster-admin admin
oc login -u admin
source ./contrib/oc-environment.sh

./test-gui.sh crud
