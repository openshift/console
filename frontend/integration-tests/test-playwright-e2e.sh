#!/usr/bin/env bash
#
# Run Playwright E2E tests against OpenShift Console from the frontend workspace.
# Uses frontend/playwright.config.ts: tests live under e2e/tests/<project>/; pick a suite with
# Playwright's --project flag (project names match the `packages` array in playwright.config.ts).
#
# Usage (from repo frontend/):
#   ./integration-tests/test-playwright-e2e.sh [playwright test args...]
#   ./integration-tests/test-playwright-e2e.sh --project=helm
#   ./integration-tests/test-playwright-e2e.sh --project=smoke
#   ./integration-tests/test-playwright-e2e.sh -c [--] [playwright test args...]
#
# -c  Run contrib/create-user.sh before tests.
#
# Environment:
#   BRIDGE_BASE_ADDRESS, BRIDGE_BASE_PATH, WEB_CONSOLE_URL
#   INSTALLER_DIR, ARTIFACT_DIR, KUBEADMIN_PASSWORD_FILE
#

set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:-${ARTIFACT_DIR}/installer}

if [ "$(basename "$(pwd)")" != "frontend" ]; then
  echo "This script must be run from the frontend folder" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

RUN_CREATE_USER=false

while getopts "c" flag; do
  case "${flag}" in
    c) RUN_CREATE_USER=true ;;
    *)
      echo "Usage: $0 [-c] [--] [playwright test args...]" >&2
      echo "Example: $0 --project=helm" >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ]; then
  pass_file="${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}"
  if [ -f "$pass_file" ]; then
    export BRIDGE_KUBEADMIN_PASSWORD="$(cat "$pass_file")"
  fi
fi

if [ -z "${BRIDGE_BASE_ADDRESS:-}" ]; then
  if ! command -v oc >/dev/null 2>&1; then
    echo "error: BRIDGE_BASE_ADDRESS is unset and oc was not found in PATH." >&2
    exit 1
  fi
  if ! BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}' 2>/dev/null)" ||
    [ -z "$BRIDGE_BASE_ADDRESS" ]; then
    echo "error: BRIDGE_BASE_ADDRESS is unset and oc could not read consoles.config.openshift.io cluster status.consoleURL." >&2
    echo "       Log in with oc or export BRIDGE_BASE_ADDRESS (e.g. http://localhost:9000)." >&2
    exit 1
  fi
  export BRIDGE_BASE_ADDRESS
fi

BRIDGE_BASE_PATH=${BRIDGE_BASE_PATH:-/}
export BRIDGE_BASE_PATH
export WEB_CONSOLE_URL="${WEB_CONSOLE_URL:-${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}}"

if [ ! -d node_modules ]; then
  yarn install
fi

if [ "$RUN_CREATE_USER" = true ]; then
  "${REPO_ROOT}/contrib/create-user.sh"
  export BRIDGE_HTPASSWD_IDP="${BRIDGE_HTPASSWD_IDP:-test}"
  export BRIDGE_HTPASSWD_USERNAME="${BRIDGE_HTPASSWD_USERNAME:-test}"
  export BRIDGE_HTPASSWD_PASSWORD="${BRIDGE_HTPASSWD_PASSWORD:-test}"
fi

function copyArtifacts {
  local exit_code=$?
  if [ -d "$ARTIFACT_DIR" ] && [ -d "test-results" ]; then
    echo "Copying Playwright artifacts from $(pwd)/test-results..."
    cp -r test-results "${ARTIFACT_DIR}/playwright-test-results" 2>/dev/null || echo "Warning: failed to copy Playwright artifacts" >&2
  fi
  exit "$exit_code"
}
trap copyArtifacts EXIT

FRONTEND_ABS="$(pwd)"
playwright_bin="${FRONTEND_ABS}/node_modules/.bin/playwright"
if [ ! -f "$playwright_bin" ]; then
  echo "error: Playwright CLI not found. Install at frontend root:" >&2
  echo "       yarn add -D @playwright/test && yarn playwright install" >&2
  exit 1
fi

export CI=true

"$playwright_bin" test "$@"
