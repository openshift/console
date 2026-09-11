#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E against a live OpenShift cluster console.
#
# Usage:
#   ./test-prow-e2e.sh [e2e|release|smoke] [arguments passed to: playwright test ...]
#
# Scenarios (first argument; default: e2e):
#   e2e, release  — full Playwright suite (default project / config)
#   smoke         — Playwright smoke project (--project=smoke)
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

# Source CI runtime environment (e.g. Keycloak OIDC credentials) if available
if [ -f "${SHARED_DIR:-}/runtime_env" ]; then
  set +x
  # shellcheck disable=SC1091
  source "${SHARED_DIR}/runtime_env"
  set -x
fi

export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

if [ -n "${KEYCLOAK_ISSUER:-}" ]; then
  # --- External OIDC (Keycloak) mode ---
  export BRIDGE_AUTH_TYPE="oidc"

  # Parse admin (first) and developer (second) users from KEYCLOAK_TEST_USERS
  # Format: "user1:pass1,user2:pass2,..."
  set +x
  IFS=',' read -ra _kc_users <<< "${KEYCLOAK_TEST_USERS}"
  _kc_admin_entry="${_kc_users[0]}"
  _kc_dev_entry="${_kc_users[1]:-}"
  _kc_admin_user="${_kc_admin_entry%%:*}"
  _kc_admin_pass="${_kc_admin_entry#*:}"

  export OPENSHIFT_USERNAME="${_kc_admin_user}"
  export BRIDGE_KUBEADMIN_PASSWORD="${_kc_admin_pass}"

  if [ -n "${_kc_dev_entry}" ]; then
    _kc_dev_user="${_kc_dev_entry%%:*}"
    _kc_dev_pass="${_kc_dev_entry#*:}"
    export BRIDGE_HTPASSWD_USERNAME="${_kc_dev_user}"
    export BRIDGE_HTPASSWD_PASSWORD="${_kc_dev_pass}"
  fi
  set -x

  # Grant cluster-admin to the admin Keycloak user's OIDC identity
  _oidc_identity="oidc-user-test:${_kc_admin_user}@example.com"
  oc adm policy add-cluster-role-to-user cluster-admin "${_oidc_identity}" || true

  unset _kc_users _kc_admin_entry _kc_dev_entry _kc_admin_user _kc_admin_pass
  unset _kc_dev_user _kc_dev_pass _oidc_identity
else
  # --- Standard OAuth mode ---
  # don't log kubeadmin-password
  set +x
  export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
  set -x

  ./contrib/create-user.sh
fi

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

if [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./integration-tests/test-playwright.sh "$@"
elif [ "$SCENARIO" == "smoke" ]; then
  # End of script flags before Playwright's --project (test-playwright.sh only parses -c).
  ./integration-tests/test-playwright.sh -- --project=smoke "$@"
else
  echo "error: unknown scenario '$SCENARIO' (use: e2e, release, or smoke)" >&2
  exit 1
fi

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
