#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E tech-preview tests against a live OpenShift cluster.
# Runs the operator lifecycle metadata test suite, which requires the OLMLifecycleAndCompatibility
# feature gate to be enabled on the cluster.
#
# Run from the openshift/console repository root.
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

pushd frontend

./integration-tests/test-playwright-e2e.sh -- --project=olm e2e/tests/olm/operator-lifecycle-metadata.spec.ts "$@"

popd
