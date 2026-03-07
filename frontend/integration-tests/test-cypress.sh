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

while getopts p:s:h:l:n:P: flag
do
  case "${flag}" in
    p) pkg=${OPTARG};;
    s) spec=${OPTARG};;
    h) headless=${OPTARG};;
    n) nightly=${OPTARG};;
    P) parallel=${OPTARG};;
  esac
done

if [ $# -eq 0 ]; then
    echo "Runs Cypress tests in Test Runner or headless mode"
    echo "Usage: test-cypress [-p] <package> [-s] <filemask> [-h true] [-n true/false] [-P true]"
    echo "  '-p <package>' may be 'console, 'olm', 'devconsole'"
    echo "  '-s <specmask>' is a file mask for spec test files, such as 'tests/monitoring/*'. Used only in headless mode when '-p' is specified."
    echo "  '-h true' runs Cypress in headless mode. When omitted, launches Cypress Test Runner"
    echo "  '-n true' runs the 'nightly' suite, all specs from selected packages in headless mode"
    echo "  '-P true' runs test packages in parallel (only works with -h true)"
    echo "Examples:"
    echo "  test-cypress.sh                                       // displays this help text"
    echo "  test-cypress.sh -p console                            // opens Cypress Test Runner for console tests"
    echo "  test-cypress.sh -p olm                                // opens Cypress Test Runner for OLM tests"
    echo "  test-cypress.sh -p dev-console                        // opens Cypress Test Runner for Dev-Console tests"
    echo "  test-cypress.sh -p knative                            // opens Cypress Test Runner for knative tests"
    echo "  test-cypress.sh -p shipwright                         // opens Cypress Test Runner for shipwright tests"
    echo "  test-cypress.sh -p webterminal                        // opens Cypress Test Runner for webterminal tests"
    echo "  test-cypress.sh -h true                               // runs all packages in headless mode (sequential)"
    echo "  test-cypress.sh -h true -P true                       // runs all packages in headless mode (parallel)"
    echo "  test-cypress.sh -p olm -h true                        // runs OLM tests in headless mode"
    echo "  test-cypress.sh -p console -s 'tests/crud/*' -h true  // runs console CRUD tests in headless mode"
    echo "  test-cypress.sh -n true                               // runs the whole nightly suite"
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

if [ -n "${headless-}" ] && [ -z "${pkg-}" ]; then
<<<<<<< Updated upstream
  yarn run test-cypress-console-headless
  yarn run test-cypress-dev-console-headless
  yarn run test-cypress-olm-headless
  yarn run test-cypress-webterminal-headless
  yarn run test-cypress-helm-headless
  yarn run test-cypress-knative-headless
  yarn run test-cypress-topology-headless
  # yarn run test-cypress-shipwright-headless
=======
  # Check if parallel mode is enabled
  if [ -n "${parallel-}" ]; then
    echo "=========================================="
    echo "Running Cypress tests in PARALLEL mode"
    echo "=========================================="

    # Array to store background process IDs and their package names
    declare -a pids
    declare -a packages

    # Function to run a package test in background
    run_package_test() {
      local package_name=$1
      local script_name=$2

      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $package_name"

      # Run the test and capture output to a separate log file
      yarn run "$script_name" > "${SCREENSHOTS_DIR}/${package_name}.log" 2>&1 &
      local pid=$!

      pids+=($pid)
      packages+=($package_name)

      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Started $package_name with PID $pid"
    }

    # Ensure screenshots directory exists
    mkdir -p "${SCREENSHOTS_DIR}"

    # Start all package tests in parallel
    run_package_test "console" "test-cypress-console-headless"
    run_package_test "dev-console" "test-cypress-dev-console-headless"
    run_package_test "olm" "test-cypress-olm-headless"
    run_package_test "webterminal" "test-cypress-webterminal-headless"
    run_package_test "helm" "test-cypress-helm-headless"
    run_package_test "knative" "test-cypress-knative-headless"
    run_package_test "topology" "test-cypress-topology-headless"
    run_package_test "pipelines" "test-cypress-pipelines-headless"
    # run_package_test "shipwright" "test-cypress-shipwright-headless"

    echo ""
    echo "All test packages started. Waiting for completion..."
    echo "=========================================="

    # Wait for all background processes and collect their exit statuses
    failed_packages=()
    for i in "${!pids[@]}"; do
      pid=${pids[$i]}
      package=${packages[$i]}

      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for $package (PID: $pid)..."

      if wait $pid; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ $package completed successfully"
      else
        exit_code=$?
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ $package failed with exit code $exit_code"
        failed_packages+=("$package")
      fi
    done

    echo ""
    echo "=========================================="
    echo "Parallel test execution completed"
    echo "=========================================="

    # Print summary
    if [ ${#failed_packages[@]} -eq 0 ]; then
      echo "✓ All packages passed!"
      echo ""
      echo "Individual package logs:"
      for package in "${packages[@]}"; do
        echo "  - ${SCREENSHOTS_DIR}/${package}.log"
      done
      exit 0
    else
      echo "✗ ${#failed_packages[@]} package(s) failed:"
      for package in "${failed_packages[@]}"; do
        echo "  - $package (see ${SCREENSHOTS_DIR}/${package}.log)"
      done
      exit 1
    fi
  else
    # Original sequential execution
    echo "Running Cypress tests in SEQUENTIAL mode (use -P true for parallel)"
    yarn run test-cypress-console-headless
    yarn run test-cypress-dev-console-headless
    yarn run test-cypress-olm-headless
    yarn run test-cypress-webterminal-headless
    yarn run test-cypress-helm-headless
    yarn run test-cypress-knative-headless
    yarn run test-cypress-topology-headless
    yarn run test-cypress-pipelines-headless
    # yarn run test-cypress-shipwright-headless
  fi
>>>>>>> Stashed changes
  exit;
fi

yarn_script="test-cypress"

if [ -n "${pkg-}" ]; then
    yarn_script="$yarn_script-$pkg"
fi

if [ -n "${nightly-}" ]; then
  yarn_script="$yarn_script-nightly"
elif [ -n "${headless-}" ]; then
  yarn_script="$yarn_script-headless"
fi

if [ -n "${spec-}" ] && [ -z "${nightly-}"]; then
  yarn_script="$yarn_script --spec '$spec'"
fi

yarn run $yarn_script
