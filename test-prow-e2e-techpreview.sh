#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E tech-preview tests against a live OpenShift cluster.
# Runs the tests tagged @techpreview in the spec sources (test/test.describe `tag` option).
#
# The main e2e job (test-prow-e2e.sh) excludes these tests via --grep-invert @techpreview.
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

# Set up the e2e users and the admin persona credentials
# (OPENSHIFT_USERNAME, BRIDGE_KUBEADMIN_PASSWORD). Sourced so that the setup
# runs and the exported variables reach this shell.
source ./contrib/create-user.sh
BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
export BRIDGE_BASE_ADDRESS

# Tests tagged @standalone require a standalone control plane and are
# excluded when the cluster reports an external control plane topology. This job selects
# @techpreview tests, so the invert must never contain @techpreview.
# CONTROL_PLANE_TOPOLOGY is exported by create-user.sh, which fails fast if
# it cannot be read. Left unquoted so it expands to zero or two arguments.
grep_invert_args=""
if [ "${CONTROL_PLANE_TOPOLOGY:-}" == "External" ]; then
  grep_invert_args="--grep-invert @standalone"
fi

pushd frontend

if [ ! -d node_modules ]; then
  yarn install
fi

./integration-tests/test-playwright.sh -- --grep @techpreview $grep_invert_args "$@"

popd
