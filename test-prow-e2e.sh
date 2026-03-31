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

# Parallelization environment variables (default to 4 shards)
# In Prow CI matrix jobs, SPLIT_INDEX will be set by the matrix (0, 1, 2, 3)
# If not set, we're likely in a non-matrix context
SPLIT_TOTAL="${SPLIT_TOTAL:-4}"
SPLIT_INDEX="${SPLIT_INDEX:-}"

if [ "$SCENARIO" == "nightly-cypress" ]; then
  PACKAGE=""
  if [ $# -gt 1 ]; then
    PACKAGE="-p $2"
  fi
  ./integration-tests/test-cypress.sh -n true $PACKAGE
elif [ "$SCENARIO" == "e2e-parallel" ]; then
  # Explicit parallel execution mode for console tests
  if [ -z "$SPLIT_INDEX" ]; then
    echo "Error: e2e-parallel requires SPLIT_INDEX environment variable when SPLIT_TOTAL is set"
    echo "This scenario is designed for Prow CI matrix jobs where SPLIT_INDEX is set by the matrix."
    echo "Example: SPLIT_TOTAL=4 SPLIT_INDEX=0 $0 e2e-parallel"
    exit 1
  fi
  echo "Running parallel e2e tests: shard $((SPLIT_INDEX + 1))/$SPLIT_TOTAL"
  ./integration-tests/test-cypress.sh -p console -h true -t "$SPLIT_TOTAL" -i "$SPLIT_INDEX"
elif [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  # Default behavior: Run console tests in parallel (if SPLIT_INDEX is set)
  # Other packages run sequentially
  if [ -n "$SPLIT_INDEX" ]; then
    echo "Running parallel e2e tests: shard $((SPLIT_INDEX + 1))/$SPLIT_TOTAL"
    ./integration-tests/test-cypress.sh -p console -h true -t "$SPLIT_TOTAL" -i "$SPLIT_INDEX"
  else
    echo "Running e2e tests in sequential mode (set SPLIT_INDEX to enable parallel execution)"
    echo "For parallel execution in Prow CI, use matrix jobs with SPLIT_INDEX set to 0-$((SPLIT_TOTAL - 1))"
    ./integration-tests/test-cypress.sh -h true
  fi
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
