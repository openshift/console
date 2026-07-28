#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E against a live OpenShift cluster console.
# Mirrors test-prow-e2e.sh: kubeadmin password, BRIDGE_BASE_ADDRESS from the cluster,
# contrib/create-user.sh, then tests under frontend/, and the same CSP check as Cypress Prow.
#
# Run from the openshift/console repository root (same as test-prow-e2e.sh).
#
# Usage:
#   ./test-prow-playwright-e2e.sh [e2e|release|smoke] [arguments passed to: playwright test ...]
#
# Scenarios (first argument; default: e2e):
#   e2e, release  — full Playwright suite (default project / config)
#   smoke         — Playwright smoke project (--project=smoke)
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE   same as test-prow-e2e.sh
#

set -exuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${REPO_ROOT}"

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

# Validate ARTIFACT_DIR is set and is an absolute path
if [ -z "$ARTIFACT_DIR" ]; then
  echo "Error: ARTIFACT_DIR is not set" >&2
  exit 1
fi
case "$ARTIFACT_DIR" in
  /) echo "Error: ARTIFACT_DIR must not be '/'" >&2; exit 1 ;;
  /*) ;; # absolute path, OK
  *) echo "Error: ARTIFACT_DIR must be an absolute path, got: $ARTIFACT_DIR" >&2; exit 1 ;;
esac

export ARTIFACT_DIR INSTALLER_DIR
mkdir -p "${ARTIFACT_DIR}"

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

./contrib/create-user.sh

export WORKERS="${WORKERS:-2}"

pushd frontend

SCENARIO="${1:-e2e}"
if [ $# -gt 0 ]; then
  shift
fi

if [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./integration-tests/test-playwright-e2e.sh "$@"
elif [ "$SCENARIO" == "smoke" ]; then
  # End of script flags before Playwright's --project (test-playwright-e2e.sh only parses -c).
  ./integration-tests/test-playwright-e2e.sh -- --project=smoke "$@"
else
  echo "error: unknown scenario '$SCENARIO' (use: e2e, release, or smoke)" >&2
  exit 1
fi

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
