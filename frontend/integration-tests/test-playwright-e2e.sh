#!/usr/bin/env bash
#
# Run Playwright E2E tests against OpenShift Console from the frontend workspace.
# Same operational idea as test-cypress.sh: run from ./frontend, optional cluster-derived
# BRIDGE_* / PLAYWRIGHT_BASE_URL, optional kubeadmin + create-user, then invoke Playwright
# in frontend/ or a subdirectory package.
#
# Prerequisites (typical):
#   - oc logged in (unless BRIDGE_BASE_ADDRESS is already set)
#   - In the target directory: yarn add -D @playwright/test && yarn playwright install
#   - playwright.config.{ts,js,mts,mjs} under that directory
#
# Usage (always from repo frontend/):
#   ./integration-tests/test-playwright-e2e.sh [playwright test arguments...]
#   ./integration-tests/test-playwright-e2e.sh -d packages/my-plugin/e2e tests/smoke.spec.ts
#   ./integration-tests/test-playwright-e2e.sh -c
#
# Options:
#   -d <path>   Directory relative to frontend/ where Playwright is installed (default: .)
#   -c          Run contrib/create-user.sh first (Prow-style htpasswd idp; needs repo root)
#
# Environment:
#   BRIDGE_BASE_ADDRESS           If unset, from oc get consoles.config.openshift.io cluster
#   BRIDGE_BASE_PATH              Default /
#   PLAYWRIGHT_BASE_URL           Default ${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}
#   INSTALLER_DIR, ARTIFACT_DIR, KUBEADMIN_PASSWORD_FILE   Kubeadmin password for login flows
#   OPENSHIFT_CI                  If true, sets NO_COLOR=1 (same as test-cypress.sh)
#

set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:-${ARTIFACT_DIR}/installer}
OPENSHIFT_CI=${OPENSHIFT_CI:-false}

if [ "$(basename "$(pwd)")" != "frontend" ]; then
  echo "This script must be run from the frontend folder" >&2
  exit 1
fi

if [ "$OPENSHIFT_CI" = true ]; then
  export NO_COLOR=1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# integration-tests/ -> frontend/ -> openshift/console repo root
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ]; then
  pass_file="${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}"
  if [ -f "$pass_file" ]; then
    set +x
    export BRIDGE_KUBEADMIN_PASSWORD="$(cat "$pass_file")"
    set -x
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
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}}"

PLAYWRIGHT_REL_DIR="."
RUN_CREATE_USER=false
while getopts "d:c" flag; do
  case "${flag}" in
    d) PLAYWRIGHT_REL_DIR="${OPTARG}" ;;
    c) RUN_CREATE_USER=true ;;
    *) echo "Usage: $0 [-d <dir-under-frontend>] [-c] [--] [playwright test args...]" >&2
       exit 1
       ;;
  esac
done
shift $((OPTIND - 1))

if [ ! -d node_modules ]; then
  yarn install
fi

if [ "$RUN_CREATE_USER" = true ]; then
  "${REPO_ROOT}/contrib/create-user.sh"
fi

FRONTEND_ABS="$(pwd)"
TARGET_DIR="${FRONTEND_ABS}/${PLAYWRIGHT_REL_DIR}"
if [ ! -d "$TARGET_DIR" ]; then
  echo "error: Playwright directory does not exist: $TARGET_DIR" >&2
  exit 1
fi
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
if [[ "${TARGET_DIR}" != "${FRONTEND_ABS}" && "${TARGET_DIR}" != "${FRONTEND_ABS}/"* ]]; then
  echo "error: resolved path must stay under ${FRONTEND_ABS}" >&2
  exit 1
fi

cd "$TARGET_DIR"

playwright_bin="${TARGET_DIR}/node_modules/.bin/playwright"
if [ ! -f "$playwright_bin" ]; then
  # When running from a subfolder without its own node_modules, fall back to frontend root bin
  playwright_bin="${FRONTEND_ABS}/node_modules/.bin/playwright"
fi
if [ ! -f "$playwright_bin" ]; then
  echo "error: Playwright CLI not found. Install in $TARGET_DIR or frontend root:" >&2
  echo "       yarn add -D @playwright/test && yarn playwright install" >&2
  exit 1
fi

exec "$playwright_bin" test "$@"
