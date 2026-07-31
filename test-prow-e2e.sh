#!/usr/bin/env bash

set -exuo pipefail

INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

./contrib/create-user.sh

pushd frontend

SCENARIO="${1:-e2e}"

if [ "$SCENARIO" == "nightly-cypress" ]; then
  PACKAGE=""
  if [ $# -gt 1 ]; then
    PACKAGE="-p $2"
  fi
  ./integration-tests/test-cypress.sh -n true $PACKAGE
elif [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./integration-tests/test-cypress.sh -h true
elif [ "$SCENARIO" == "login" ]; then
  ./integration-tests/test-cypress.sh -p console -s 'tests/app/auth-multiuser-login.cy.ts' -h true
elif [ "$SCENARIO" == "olmFull" ]; then
  ./integration-tests/test-cypress.sh -p olm -h true
elif [ "$SCENARIO" == "dev-console" ]; then
  ./integration-tests/test-cypress.sh -p dev-console -h true
elif [ "$SCENARIO" == "pipelines" ]; then
  ./integration-tests/test-cypress.sh -p pipelines -h true
elif [ "$SCENARIO" == "knative" ]; then
  ./integration-tests/test-cypress.sh -p knative -h true
fi

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
