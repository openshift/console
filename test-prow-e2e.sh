#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=frontend/gui_test_screenshots
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/gui_test_screenshots"
  fi
}

trap copyArtifacts EXIT

# don't log kubeadmin-password
set +x
BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
export BRIDGE_KUBEADMIN_PASSWORD
set -x
BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
export BRIDGE_BASE_ADDRESS

./contrib/create-user.sh

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
DBUS_SESSION_BUS_ADDRESS=/dev/null
export DBUS_SESSION_BUS_ADDRESS

SCENARIO="${1:-e2e}"

case $SCENARIO in
  login|olmFull|ceph|kubevirt-gating|nightly-cypress) ;; # no protractor tests
  *) CHROME_VERSION=$(google-chrome --version) ./test-protractor.sh "$SCENARIO";;
esac

# Disable color codes in Cypress since they do not render well CI test logs.
# https://docs.cypress.io/guides/guides/continuous-integration.html#Colors
export NO_COLOR=1
if [ "$SCENARIO" == "nightly-cypress" ]; then
  PACKAGE=""
  if [ $# -gt 1 ]; then
    PACKAGE="-p $2"
  fi
  ./test-cypress.sh -n true $PACKAGE
elif [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./test-cypress.sh -h true
elif [ "$SCENARIO" == "login" ]; then
  ./test-cypress.sh -p console -s 'tests/app/auth-multiuser-login.spec.ts' -h true
elif [ "$SCENARIO" == "olmFull" ]; then
  ./test-cypress.sh -p olm -h true
elif [ "$SCENARIO" == "ceph" ]; then
  ./test-cypress.sh -p ceph -h true
elif [ "$SCENARIO" == "kubevirt-gating" ]; then
  ./test-cypress.sh -p kubevirt -h true
elif [ "$SCENARIO" == "dev-console" ]; then
 ./test-cypress.sh -p dev-console -h true
elif [ "$SCENARIO" == "pipelines" ]; then
 ./test-cypress.sh -p pipelines -h true
elif [ "$SCENARIO" == "gitops" ]; then
 ./test-cypress.sh -p gitops -h true
 elif [ "$SCENARIO" == "knative" ]; then
 ./test-cypress.sh -p knative -h true
fi
