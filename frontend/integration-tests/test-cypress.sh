#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=gui_test_screenshots

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}

if [ "$(basename "$(pwd)")" != "frontend" ]; then
  echo "This script must be run from the frontend folder"
  exit 1
fi

# Disable color codes in Cypress since they do not render well CI test logs.
# https://docs.cypress.io/guides/guides/continuous-integration.html#Colors
if [ "$OPENSHIFT_CI" = true ]; then
  export NO_COLOR=1
fi

if [ ! -d node_modules ]; then
  yarn install
fi

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/gui_test_screenshots"
  fi
}

function generateReport {
  yarn run cypress-postreport
  if test -f ./packages/integration-tests-cypress/cypress-a11y-report.json; then
    yarn cypress-a11y-report
  fi
}
trap "copyArtifacts; generateReport" EXIT

while getopts p:s:h:l:n:t:i: flag
do
  case "${flag}" in
    p) pkg=${OPTARG};;
    s) spec=${OPTARG};;
    h) headless=${OPTARG};;
    n) nightly=${OPTARG};;
    t) split_total=${OPTARG};;
    i) split_index=${OPTARG};;
  esac
done

if [ $# -eq 0 ]; then
    echo "Runs Cypress tests in Test Runner or headless mode"
    echo "Usage: test-cypress [-p] <package> [-s] <filemask> [-h true] [-n true/false] [-t] <split_total> [-i] <split_index>"
    echo "  '-p <package>' may be 'console, 'olm', 'devconsole'"
    echo "  '-s <specmask>' is a file mask for spec test files, such as 'tests/monitoring/*'. Used only in headless mode when '-p' is specified."
    echo "  '-h true' runs Cypress in headless mode. When omitted, launches Cypress Test Runner"
    echo "  '-n true' runs the 'nightly' suite, all specs from selected packages in headless mode"
    echo "  '-t <split_total>' total number of parallel processes (requires cypress-split plugin)"
    echo "  '-i <split_index>' index of current parallel process, 0-based (requires cypress-split plugin)"
    echo "Examples:"
    echo "  test-cypress.sh                                       // displays this help text"
    echo "  test-cypress.sh -p console                            // opens Cypress Test Runner for console tests"
    echo "  test-cypress.sh -p olm                                // opens Cypress Test Runner for OLM tests"
    echo "  test-cypress.sh -p dev-console                        // opens Cypress Test Runner for Dev-Console tests"
    echo "  test-cypress.sh -p knative                            // opens Cypress Test Runner for knative tests"
    echo "  test-cypress.sh -p shipwright                         // opens Cypress Test Runner for shipwright tests"
    echo "  test-cypress.sh -p webterminal                        // opens Cypress Test Runner for webterminal tests"
    echo "  test-cypress.sh -h true                               // runs all packages in headless mode"
    echo "  test-cypress.sh -p olm -h true                        // runs OLM tests in headless mode"
    echo "  test-cypress.sh -p console -s 'tests/crud/*' -h true  // runs console CRUD tests in headless mode"
    echo "  test-cypress.sh -n true                               // runs the whole nightly suite"
    echo "  test-cypress.sh -p console -h true -t 4 -i 0          // runs console tests in parallel (process 1 of 4)"
    trap EXIT
    exit;
fi

if [ -n "${nightly-}" ] && [ -z "${pkg-}" ]; then
  # do not fail fast, let all suites run
  set +e
  err=0
  trap 'err=1' ERR

  yarn run test-cypress-dev-console-nightly
  yarn run test-cypress-helm-nightly
  # yarn run test-cypress-shipwright-nightly
  yarn run test-cypress-topology-nightly
  yarn run test-cypress-knative-nightly
  yarn run test-cypress-webterminal-nightly

  exit $err;
fi

# Export parallelization environment variables if set
if [ -n "${split_total-}" ]; then
  export SPLIT_TOTAL=$split_total
fi

if [ -n "${split_index-}" ]; then
  export SPLIT_INDEX=$split_index
fi

if [ -n "${headless-}" ] && [ -z "${pkg-}" ]; then
  # If parallelization is enabled, use parallel scripts for console package
  if [ -n "${split_total-}" ] && [ -n "${split_index-}" ]; then
    echo "Running console tests in parallel mode: shard $((SPLIT_INDEX + 1))/$SPLIT_TOTAL"
    yarn run test-cypress-console-parallel
  else
    yarn run test-cypress-console-headless
  fi
  yarn run test-cypress-dev-console-headless
  yarn run test-cypress-olm-headless
  yarn run test-cypress-webterminal-headless
  yarn run test-cypress-helm-headless
  yarn run test-cypress-knative-headless
  yarn run test-cypress-topology-headless
  # yarn run test-cypress-shipwright-headless
  exit;
fi

yarn_script="test-cypress"

if [ -n "${pkg-}" ]; then
    yarn_script="$yarn_script-$pkg"
fi

# Check if parallelization is requested for console package
if [ -n "${pkg-}" ] && [ "$pkg" == "console" ] && [ -n "${headless-}" ] && [ -n "${split_total-}" ] && [ -n "${split_index-}" ]; then
  echo "Running console tests in parallel mode: shard $((SPLIT_INDEX + 1))/$SPLIT_TOTAL"
  yarn_script="$yarn_script-parallel"
elif [ -n "${nightly-}" ]; then
  yarn_script="$yarn_script-nightly"
elif [ -n "${headless-}" ]; then
  yarn_script="$yarn_script-headless"
fi

if [ -n "${spec-}" ] && [ -z "${nightly-}"]; then
  yarn_script="$yarn_script --spec '$spec'"
fi

yarn run $yarn_script
