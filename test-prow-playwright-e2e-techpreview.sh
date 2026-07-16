#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E against a TechPreview OpenShift cluster console.
# Runs only tests tagged @tech-preview or @feature-gate.
# Mirrors test-prow-playwright-e2e.sh: same env setup, same artifact handling.
#
# Usage:
#   ./test-prow-playwright-e2e-techpreview.sh [playwright test args...]
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE  — same as test-prow-playwright-e2e.sh
#

set -exuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${REPO_ROOT}"

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

if [ -z "$ARTIFACT_DIR" ]; then
  echo "Error: ARTIFACT_DIR is not set" >&2
  exit 1
fi
case "$ARTIFACT_DIR" in
  /) echo "Error: ARTIFACT_DIR must not be '/'" >&2; exit 1 ;;
  /*) ;;
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

pushd frontend

./integration-tests/test-playwright-e2e.sh -- --grep "@tech-preview|@feature-gate" "$@"

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
