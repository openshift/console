#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E against a live OpenShift cluster console.
#
# Usage:
#   ./test-prow-e2e.sh [e2e|release|smoke|login|olmFull] [arguments passed to: playwright test ...]
#
# Scenarios (first argument; default: e2e):
#   e2e, release  — full Playwright suite (all projects)
#   smoke         — Playwright smoke project; no Prow job, kept for manual runs
#   login         — multi-user htpasswd login spec
#   olmFull       — OLM project
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE
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

export BRIDGE_HTPASSWD_IDP="${BRIDGE_HTPASSWD_IDP:-test}"
export BRIDGE_HTPASSWD_USERNAME="${BRIDGE_HTPASSWD_USERNAME:-test}"
export BRIDGE_HTPASSWD_PASSWORD="${BRIDGE_HTPASSWD_PASSWORD:-test}"

export WORKERS="${WORKERS:-2}"
export GLOBAL_TIMEOUT_MS="${GLOBAL_TIMEOUT_MS:-6600000}"

pushd frontend

if [ ! -d node_modules ]; then
  yarn install
fi

SCENARIO="${1:-e2e}"
if [ $# -gt 0 ]; then
  shift
fi

# `--` ends this script's flags before Playwright's own (test-playwright.sh only parses -c).
case "$SCENARIO" in
  e2e | release)
    ./integration-tests/test-playwright.sh "$@"
    ;;
  smoke)
    ./integration-tests/test-playwright.sh -- --project=smoke "$@"
    ;;
  login)
    ./integration-tests/test-playwright.sh -- \
      --project=console e2e/tests/console/app/auth-multiuser-login.spec.ts "$@"
    ;;
  olmFull)
    ./integration-tests/test-playwright.sh -- --project=olm "$@"
    ;;
  *)
    echo "error: unknown scenario '$SCENARIO' (use: e2e, release, smoke, login, or olmFull)" >&2
    exit 1
    ;;
esac

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
