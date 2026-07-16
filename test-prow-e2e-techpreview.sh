#!/usr/bin/env bash
#
# Prow / CI entrypoint for Cypress E2E against a TechPreview OpenShift cluster console.
# Runs only Cypress packages that contain TechPreview or feature-gate suites.
# Mirrors test-prow-e2e.sh: same env setup, same CSP check.
#
# Usage:
#   ./test-prow-e2e-techpreview.sh
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE  — same as test-prow-e2e.sh
#
# Adding a new TechPreview Cypress package:
#   1. Import tech-preview-guard in the package's Cypress support entry point.
#   2. Add '-p <package>' to the invocation below.
#

set -exuo pipefail

INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

./contrib/create-user.sh

pushd frontend

# olm: OLMv1 UI is active on TechPreview clusters; OLMv1-specific tests live here.
# Add further packages as TechPreview / feature-gate Cypress tests are written.
./integration-tests/test-cypress.sh -p olm -h true

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
