#!/usr/bin/env bash

# test-prow-e2e.sh - Wrapper script for running e2e tests in Prow CI
# This script is called by the CI system and delegates to test-cypress.sh

set -euo pipefail

# Check if parallel flag is passed
PARALLEL_FLAG=""
while getopts P: flag; do
  case "${flag}" in
    P) PARALLEL_FLAG="-P ${OPTARG}";;
  esac
done

echo "================================================"
echo "Running OpenShift Console E2E Tests"
echo "================================================"
echo "Environment: ${OPENSHIFT_CI:-local}"
echo "Parallel mode: ${PARALLEL_FLAG:-disabled (sequential)}"
echo "================================================"
echo ""

# Navigate to frontend directory
cd frontend || exit 1

# Run Cypress tests
# shellcheck disable=SC2086
./integration-tests/test-cypress.sh -h true ${PARALLEL_FLAG}

<<<<<<< Updated upstream
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
=======
echo ""
echo "================================================"
echo "E2E Tests Completed"
echo "================================================"
>>>>>>> Stashed changes
