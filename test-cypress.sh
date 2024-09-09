#!/usr/bin/env bash
set -euo pipefail
cd frontend

if [ ! -d node_modules ]; then
  yarn install
fi

function generateReport {
  yarn run cypress-postreport
  if test -f ./packages/integration-tests-cypress/cypress-a11y-report.json; then
    yarn cypress-a11y-report
  fi
}
trap generateReport EXIT

while getopts p:s:h:l:n: flag
do
  case "${flag}" in
    p) pkg=${OPTARG};;
    s) spec=${OPTARG};;
    h) headless=${OPTARG};;
    n) nightly=${OPTARG};;
  esac
done

if [ $# -eq 0 ]; then
    echo "Runs Cypress tests in Test Runner or headless mode"
    echo "Usage: test-cypress [-p] <package> [-s] <filemask> [-h true] [-n true/false]"
    echo "  '-p <package>' may be 'console, 'olm', 'devconsole'"
    echo "  '-s <specmask>' is a file mask for spec test files, such as 'tests/monitoring/*'. Used only in headless mode when '-p' is specified."
    echo "  '-h true' runs Cypress in headless mode. When omitted, launches Cypress Test Runner"
    echo "  '-n true' runs the 'nightly' suite, all specs from selected packages in headless mode"
    echo "Examples:"
    echo "  test-cypress.sh                                       // displays this help text"
    echo "  test-cypress.sh -p console                            // opens Cypress Test Runner for console tests"
    echo "  test-cypress.sh -p olm                                // opens Cypress Test Runner for OLM tests"
    echo "  test-cypress.sh -p dev-console                        // opens Cypress Test Runner for Dev-Console tests"
    echo "  test-cypress.sh -p gitops                             // opens Cypress Test Runner for gitops tests"
    echo "  test-cypress.sh -p knative                            // opens Cypress Test Runner for knative tests"
    echo "  test-cypress.sh -p pipelines                          // opens Cypress Test Runner for pipelines tests"
    echo "  test-cypress.sh -p shipwright                         // opens Cypress Test Runner for shipwright tests"
    echo "  test-cypress.sh -p webterminal                        // opens Cypress Test Runner for webterminal tests"
    echo "  test-cypress.sh -h true                               // runs all packages in headless mode"
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
  yarn run test-cypress-pipelines-nightly
  # yarn run test-cypress-shipwright-nightly
  yarn run test-cypress-topology-nightly
  yarn run test-cypress-knative-nightly
  # yarn run test-cypress-webterminal-nightly

  exit $err;
fi

if [ -n "${headless-}" ] && [ -z "${pkg-}" ]; then
  yarn run test-cypress-console-headless
  yarn run test-cypress-dev-console-headless
  yarn run test-cypress-olm-headless
  yarn run test-cypress-helm-headless
  yarn run test-cypress-knative-headless
  yarn run test-cypress-topology-headless
  yarn run test-cypress-pipelines-headless
  # yarn run test-cypress-shipwright-headless
  # yarn run test-cypress-webterminal-headless
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
