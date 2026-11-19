#!/usr/bin/env bash
#
# Creates the htpasswd 'test' user the e2e suite logs in with on the cluster
# under test and exports the admin persona credentials for the calling shell:
# OPENSHIFT_USERNAME and BRIDGE_KUBEADMIN_PASSWORD, plus the cluster's
# CONTROL_PLANE_TOPOLOGY for callers that adapt to it.
#
# Run directly or source it; sourcing keeps the exported variables in the
# calling shell, which is how the prow e2e entrypoints use it. Aborts the
# calling shell on failure. Requires oc and jq (see contrib/environment.sh).

set -exuo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required by this script" >&2
  exit 1
fi

BASEDIR="$(dirname "${BASH_SOURCE[0]}")/.."

function waitForAuthOperatorProgressing {
  local output=''
  local count=0
  local sleepDuration=15
  local maxRetries=40 # 10 minutes
  local action="started"
  if [ "$1" == "False" ]; then
    action="finished"
  fi

  until [ "$output" == "$1" ] || [ $count -gt $maxRetries ]; do
    output=$(oc get co/authentication -o 'jsonpath={.status.conditions[?(@.type=="Progressing")].status}')
    count=$((count+1))
    sleep $sleepDuration
  done

  local secs=$((count*sleepDuration));
  local durationStr
  printf -v durationStr '%dm:%ds' $((secs%3600/60)) $((secs%60))
  if [ "$output" == "$1" ]; then
    echo "authentication operator $action Progressing 'test' idp (duration: $durationStr)"
  else
    echo "authentication operator: maximum retries reached (duration: $durationStr)" >&2
    return 1
  fi
}

# Wait until the htpasswd IDP accepts a login for the given user. Logs in on a
# copy of the effective kubeconfig so the caller's credentials are not
# replaced. Tracing stays disabled for the whole function: the login command
# carries the password as an argument.
function waitForHtpasswdLogin {
  local username="$1"
  local password="$2"
  local count=0
  local sleepDuration=15
  local maxRetries=40 # 10 minutes
  local kubeconfig_copy
  local login_error
  kubeconfig_copy="$(mktemp)"
  login_error="$(mktemp)"
  local was_tracing=false
  [[ $- == *x* ]] && was_tracing=true
  set +x

  # Write the effective configuration to the copy: KUBECONFIG may list
  # several files, and flattening also embeds referenced certificate files.
  until oc config view --raw --flatten > "$kubeconfig_copy" 2>"$login_error" &&
    oc --kubeconfig="$kubeconfig_copy" login --username="$username" --password="$password" >"$login_error" 2>&1; do
    count=$((count+1))
    if [ $count -gt $maxRetries ]; then
      echo "htpasswd login for '$username' did not succeed after $((count*sleepDuration/60)) minutes; last error:" >&2
      cat "$login_error" >&2
      rm -f "$kubeconfig_copy" "$login_error"
      return 1
    fi
    sleep $sleepDuration
  done

  rm -f "$kubeconfig_copy" "$login_error"
  if $was_tracing; then set -x; fi
}

# Hosted clusters (HyperShift) report an external control plane topology, but
# so do other offerings (e.g. IBM ROKS); the label the hosted cluster config
# operator sets on the guest Infrastructure resource identifies a HyperShift
# guest precisely. The topology is exported for callers that only need the
# coarser signal.
export CONTROL_PLANE_TOPOLOGY="$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.status.controlPlaneTopology}')"
is_hosted=false
if [ "$CONTROL_PLANE_TOPOLOGY" == "External" ] &&
  [ "$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.metadata.labels.hypershift\.openshift\.io/managed}')" == "true" ]; then
  is_hosted=true
fi

if [ "$is_hosted" == "true" ]; then
  # The management cluster kubeconfig: the hypershift-aws chains save it as
  # SHARED_DIR/kubeconfig, the hostedcluster workflow family as
  # SHARED_DIR/mgmt_kubeconfig.
  MGMT_KUBECONFIG="${MGMT_KUBECONFIG:-}"
  if [ -z "$MGMT_KUBECONFIG" ]; then
    if [ -s "${SHARED_DIR:-}/mgmt_kubeconfig" ]; then
      MGMT_KUBECONFIG="${SHARED_DIR}/mgmt_kubeconfig"
    elif [ -s "${SHARED_DIR:-}/kubeconfig" ]; then
      MGMT_KUBECONFIG="${SHARED_DIR}/kubeconfig"
    fi
  fi
  HC_NAMESPACE="${HC_NAMESPACE:-clusters}"
  if [ -z "${CLUSTER_NAME:-}" ] && [ -s "${SHARED_DIR:-}/cluster-name" ]; then
    CLUSTER_NAME="$(cat "${SHARED_DIR}/cluster-name")"
  fi
  if [ ! -s "$MGMT_KUBECONFIG" ] || [ -z "${CLUSTER_NAME:-}" ]; then
    echo "hosted cluster detected: set MGMT_KUBECONFIG (management cluster kubeconfig) and CLUSTER_NAME (HostedCluster name in namespace '$HC_NAMESPACE'), either directly or via SHARED_DIR" >&2
    exit 1
  fi

  # Every step below is idempotent and runs on every invocation, so a rerun
  # reconciles an interrupted or drifted setup instead of skipping it.

  # kubeadmin is disabled on hosted clusters as soon as OAuth is configured on
  # the HostedCluster, so the e2e admin persona cannot log in as kubeadmin.
  # Add an 'e2e-admin' user with cluster-admin to the same htpasswd file for
  # tests that need an admin session. The entry uses a precomputed bcrypt
  # hash of the public test password; the fixture's own entry uses an apr1
  # hash. Disable tracing so the hashes and the credential line stay out of
  # the logs.
  fixture_hash="$(sed -n 's/^  htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d | tr -d '\n')"
  if [ -z "$fixture_hash" ]; then
    echo "could not extract the htpasswd fixture from htpass-secret.yaml" >&2
    exit 1
  fi
  htpasswd_file="$(mktemp)"
  set +x
  {
    printf '%s' "$fixture_hash"
    printf '\ne2e-admin:%s\n' '$2y$05$zUpdrRXiI5KjSQrV9cBi4uWxb85/ki7Wmnfc9NI8y1HAj0H6mkH1.'
  } > "$htpasswd_file"
  set -x

  # The secret referenced by the HostedCluster oauth configuration is read
  # from the management cluster, not from the guest's openshift-config.
  oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" create secret generic htpass-secret --from-file=htpasswd="$htpasswd_file" --dry-run=client -o yaml |
    oc --kubeconfig="$MGMT_KUBECONFIG" apply -f -
  rm -f "$htpasswd_file"

  # Merge the suite's 'test' provider into the existing identity providers
  # instead of replacing the list, so providers referenced by other
  # configurations keep working; identityProviders is an atomic list, so the
  # merge is done client-side. The resourceVersion makes the patch fail on a
  # conflicting concurrent modification instead of silently overwriting it.
  hc_json="$(oc --kubeconfig="$MGMT_KUBECONFIG" get hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" -o json)"
  idps="$(printf '%s' "$hc_json" | jq -c '[.spec.configuration.oauth.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "htpass-secret"}}}]')"
  hc_rv="$(printf '%s' "$hc_json" | jq -r '.metadata.resourceVersion')"
  oc --kubeconfig="$MGMT_KUBECONFIG" patch hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$hc_rv\"},\"spec\":{\"configuration\":{\"oauth\":{\"identityProviders\":${idps}}}}}"

  oc create clusterrolebinding e2e-admin --clusterrole=cluster-admin --user=e2e-admin --dry-run=client -o yaml | oc apply -f -

  set +x
  echo "waiting for the 'test' idp to accept logins..."
  waitForHtpasswdLogin "test" "test"
  echo "waiting for the 'e2e-admin' user to accept logins..."
  waitForHtpasswdLogin "e2e-admin" "test"

  # don't log a supplied password; check the override pair untraced so a
  # supplied value cannot leak into the trace
  export BRIDGE_KUBEADMIN_PASSWORD="${BRIDGE_KUBEADMIN_PASSWORD:-test}"
  export OPENSHIFT_USERNAME="${OPENSHIFT_USERNAME:-e2e-admin}"
  if [ "${OPENSHIFT_USERNAME}" != "e2e-admin" ] || [ "${BRIDGE_KUBEADMIN_PASSWORD}" != "test" ]; then
    echo "warning: overridden admin credentials were not verified by this setup; only the e2e-admin user was" >&2
  fi
  set -x
else
  # Skip the fixture setup when it is already configured on the cluster: an
  # identity provider named 'test' of type HTPasswd backed by the suite's
  # htpass-secret. A provider that merely shares the name is reconfigured
  # rather than trusted.
  fixture_configured=false
  if [ "$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].type}' 2>/dev/null || true)" == "HTPasswd" ] &&
    [ "$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].htpasswd.fileData.name}' 2>/dev/null || true)" == "htpass-secret" ]; then
    fixture_configured=true
  fi

  if [ "$fixture_configured" != "true" ]; then
    # Apply instead of create so a pre-existing htpass-secret is reconciled
    # with the fixture content instead of failing with AlreadyExists. The
    # patch merges the suite's 'test' provider into the existing identity
    # providers (see the hosted branch) and carries the resourceVersion so a
    # conflicting concurrent modification fails instead of overwriting it.
    oc apply -f "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml"
    oauths_json="$(oc get oauths cluster -o json)"
    idps="$(printf '%s' "$oauths_json" | jq -c '[.spec.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "htpass-secret"}}}]')"
    oauths_rv="$(printf '%s' "$oauths_json" | jq -r '.metadata.resourceVersion')"
    oc patch oauths cluster --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$oauths_rv\"},\"spec\":{\"identityProviders\":${idps}}}"
    set +x
    echo "waiting for authentication operator to start Progressing 'test' idp..."
    waitForAuthOperatorProgressing "True"
    echo "waiting for authentication operator to finish Progressing 'test' idp..."
    waitForAuthOperatorProgressing "False"
    set -x
  fi

  export OPENSHIFT_USERNAME="${OPENSHIFT_USERNAME:-kubeadmin}"
  # don't log kubeadmin-password; keep a supplied password and tolerate an
  # absent password file so local runs without an installer directory can
  # still proceed (the tests skip themselves without credentials)
  set +x
  if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ] &&
    [ -f "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}" ]; then
    export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}")"
  fi
  set -x
fi
