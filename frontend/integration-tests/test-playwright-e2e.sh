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
#   ARTIFACT_DIR — Prow/OpenShift CI artifact root (default: /tmp/artifacts). On EXIT, copies
#     frontend/test-results → $ARTIFACT_DIR/playwright-test-results
#     frontend/playwright-report → $ARTIFACT_DIR/playwright-report (CI HTML report)
#     junit → $ARTIFACT_DIR/junit-playwright.xml
#

set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:-${ARTIFACT_DIR}/installer}
export ARTIFACT_DIR

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

copy_playwright_artifacts_to_dir() {
  # Validate ARTIFACT_DIR is set and is an absolute path
  if [ -z "$ARTIFACT_DIR" ]; then
    echo "Error: ARTIFACT_DIR is not set" >&2
    return 1
  fi
  case "$ARTIFACT_DIR" in
    /) echo "Error: ARTIFACT_DIR must not be '/'" >&2; return 1 ;;
    /*) ;; # absolute path, OK
    *) echo "Error: ARTIFACT_DIR must be an absolute path, got: $ARTIFACT_DIR" >&2; return 1 ;;
  esac

  mkdir -p "$ARTIFACT_DIR"
  local copied=false

  if [ -d test-results ]; then
    local dest="${ARTIFACT_DIR}/playwright-test-results"
    # Safety check before rm -rf to prevent accidental deletion
    if [ -n "$dest" ] && [ "$dest" != "/" ]; then
      rm -rf "$dest"
    fi
    mkdir -p "$dest"
    if cp -a test-results/. "$dest/"; then
      copied=true
      # Remove JUnit XML files from the bulk copy so Prow Spyglass doesn't
      # parse them as duplicates of the top-level junit-playwright.xml.
      rm -f "$dest"/*.xml
      echo "Copied Playwright test-results (traces, screenshots, videos) to ${dest}"
    else
      echo "Warning: failed to copy test-results to ${dest}" >&2
    fi
    if [ -f test-results/junit-results.xml ]; then
      cp -a test-results/junit-results.xml "${ARTIFACT_DIR}/playwright-standard-junit.xml" && \
        echo "Copied standard JUnit report to ${ARTIFACT_DIR}/playwright-standard-junit.xml"
    fi
    if [ -f test-results/prow-junit-results.xml ]; then
      cp -a test-results/prow-junit-results.xml "${ARTIFACT_DIR}/junit-playwright.xml" && \
        echo "Copied Prow JUnit report to ${ARTIFACT_DIR}/junit-playwright.xml"
    elif [ -f test-results/junit-results.xml ]; then
      cp -a test-results/junit-results.xml "${ARTIFACT_DIR}/junit-playwright.xml" && \
        echo "Copied JUnit report to ${ARTIFACT_DIR}/junit-playwright.xml (Prow report not available)"
    fi
  fi

  if [ -d playwright-report ]; then
    local report_dest="${ARTIFACT_DIR}/playwright-report"
    # Safety check before rm -rf to prevent accidental deletion
    if [ -n "$report_dest" ] && [ "$report_dest" != "/" ]; then
      rm -rf "$report_dest"
    fi
    if cp -a playwright-report "$report_dest"; then
      copied=true
      echo "Copied Playwright HTML report to ${report_dest} (open index.html)"
    else
      echo "Warning: failed to copy playwright-report to ${report_dest}" >&2
    fi
  fi

  if [ "$copied" = false ]; then
    echo "Warning: no test-results/ or playwright-report/ under $(pwd); nothing copied to ${ARTIFACT_DIR}" >&2
  else
    echo "Playwright artifacts root: ${ARTIFACT_DIR}"
  fi
}

copyArtifacts() {
  local test_exit_code=$?
  local copy_exit_code=0
  set +e
  copy_playwright_artifacts_to_dir
  copy_exit_code=$?
  set -e
  if [ "$test_exit_code" -ne 0 ]; then
    exit "$test_exit_code"
  fi
  if [ "$copy_exit_code" -ne 0 ]; then
    exit "$copy_exit_code"
  fi
  exit 0
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
