#!/usr/bin/env bash
#
# Creates the htpasswd 'test' user the e2e suite logs in with on the cluster
# under test and exports the admin persona credentials for the calling shell:
# OPENSHIFT_USERNAME and BRIDGE_KUBEADMIN_PASSWORD, plus the cluster's
# CONTROL_PLANE_TOPOLOGY for callers that adapt to it.
#
# SECURITY: on hosted clusters the script also provisions an 'e2e-admin' user
# with cluster-admin and the public password 'test'. This is safe on the
# ephemeral CI clusters the prow jobs use. For local runs against a
# long-lived cluster, remove the clusterrolebinding and secret afterwards:
#   oc delete clusterrolebinding e2e-admin
#   oc --kubeconfig=<mgmt> -n <ns> delete secret console-e2e-htpasswd
#
# Run directly or source it; sourcing keeps the exported variables in the
# calling shell, which is how the prow e2e entrypoints use it. Aborts the
# calling shell on failure. Requires oc and jq (see contrib/environment.sh).
# Note that sourcing also leaves this script's shell options, its helper
# functions, and its internal variables in the caller's shell.

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
  # A flatten failure (broken KUBECONFIG) is permanent, so fail fast
  # instead of retrying it for the full timeout.
  if ! oc config view --raw --flatten > "$kubeconfig_copy" 2>"$login_error"; then
    echo "could not read the effective kubeconfig:" >&2
    cat "$login_error" >&2
    rm -f "$kubeconfig_copy" "$login_error"
    if $was_tracing; then set -x; fi
    return 1
  fi
  until oc --kubeconfig="$kubeconfig_copy" login --username="$username" --password="$password" >"$login_error" 2>&1; do
    count=$((count+1))
    if [ $count -gt $maxRetries ]; then
      echo "htpasswd login for '$username' did not succeed after $((count*sleepDuration/60)) minutes; last error:" >&2
      cat "$login_error" >&2
      rm -f "$kubeconfig_copy" "$login_error"
      if $was_tracing; then set -x; fi
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
# guest precisely. (HyperShift 4.10/4.11 used an unversioned
# 'hypershift.io/managed' label key; those releases are EOL.) The topology is
# exported for callers that only need the coarser signal.
CONTROL_PLANE_TOPOLOGY="$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.status.controlPlaneTopology}')"
if [ -z "$CONTROL_PLANE_TOPOLOGY" ]; then
  echo "could not read the control plane topology of the cluster under test" >&2
  exit 1
fi
export CONTROL_PLANE_TOPOLOGY
is_hosted=false
managed_label="$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.metadata.labels.hypershift\.openshift\.io/managed}')"
if [ "$CONTROL_PLANE_TOPOLOGY" == "External" ] && [ "$managed_label" == "true" ]; then
  is_hosted=true
fi
export CLUSTER_IS_HOSTED="$is_hosted"

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
  if [ ! -f "$MGMT_KUBECONFIG" ] || [ ! -s "$MGMT_KUBECONFIG" ] || [ -z "${CLUSTER_NAME:-}" ]; then
    echo "hosted cluster detected: set MGMT_KUBECONFIG (management cluster kubeconfig) and CLUSTER_NAME (HostedCluster name in namespace '$HC_NAMESPACE'), either directly or via SHARED_DIR" >&2
    exit 1
  fi

  # Every step below is idempotent and runs on every invocation, so a rerun
  # reconciles an interrupted or drifted setup instead of skipping it.

  # kubeadmin is disabled on hosted clusters as soon as OAuth is configured on
  # the HostedCluster, so the e2e admin persona cannot log in as kubeadmin.
  # Add an 'e2e-admin' user with cluster-admin to the same htpasswd file for
  # tests that need an admin session. The entry uses a precomputed bcrypt
  # hash of the public test password. The suite's own entries replace any
  # stale ones while other users of the secret are preserved. Disable tracing so the hashes and the
  # credential line stay out of the logs.
  set +x
  fixture_hash="$(sed -n 's/^[[:space:]]*htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d | tr -d '\n')"
  if [ -z "$fixture_hash" ]; then
    echo "could not extract the htpasswd fixture from htpasswd-secret.yaml" >&2
    exit 1
  fi
  # The command substitution strips the trailing newline and keeps internal
  # ones; --ignore-not-found yields empty output for an absent secret, and
  # any other read failure aborts.
  existing_htpasswd="$(oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" get secret console-e2e-htpasswd --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d)"
  existing_htpasswd="$(printf '%s\n' "$existing_htpasswd" | grep -v -E '^(test|e2e-admin):' || true)"
  htpasswd_file="$(mktemp)"
  {
    if [ -n "$existing_htpasswd" ]; then
      printf '%s\n' "$existing_htpasswd"
    fi
    printf '%s\n' "$fixture_hash"
    # shellcheck disable=SC2016
    # bcrypt (cost 5) of the public test password
    printf 'e2e-admin:%s\n' '$2y$05$zUpdrRXiI5KjSQrV9cBi4uWxb85/ki7Wmnfc9NI8y1HAj0H6mkH1.'
  } > "$htpasswd_file"
  set -x

  # The secret referenced by the HostedCluster oauth configuration is read
  # from the management cluster, not from the guest's openshift-config.
  # Guarded so the file is removed on failure too.
  if ! oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" create secret generic console-e2e-htpasswd --from-file=htpasswd="$htpasswd_file" --dry-run=client -o yaml |
    oc --kubeconfig="$MGMT_KUBECONFIG" apply -f -; then
    rm -f "$htpasswd_file"
    echo "could not apply the console-e2e-htpasswd to the management cluster" >&2
    exit 1
  fi
  rm -f "$htpasswd_file"

  # Merge the suite's 'test' provider into the existing identity providers
  # instead of replacing the list, so providers referenced by other
  # configurations keep working; identityProviders is an atomic list, so the
  # merge is done client-side. The resourceVersion makes the patch fail on a
  # conflicting concurrent modification instead of silently overwriting it;
  # the HyperShift operator bumps the resourceVersion with routine status
  # writes, so the whole read-merge-patch sequence is retried with a short
  # backoff before giving up. Tracing stays off so the full resource JSON
  # does not flood the CI log.
  set +x
  hc_patch_succeeded=false
  for attempt in 1 2 3; do
    if hc_json="$(oc --kubeconfig="$MGMT_KUBECONFIG" get hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" -o json)" &&
      idps="$(printf '%s' "$hc_json" | jq -c '[.spec.configuration.oauth.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "console-e2e-htpasswd"}}}]')" &&
      hc_rv="$(printf '%s' "$hc_json" | jq -r '.metadata.resourceVersion')" &&
      oc --kubeconfig="$MGMT_KUBECONFIG" patch hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$hc_rv\"},\"spec\":{\"configuration\":{\"oauth\":{\"identityProviders\":${idps}}}}}"; then
      hc_patch_succeeded=true
      break
    fi
    if [ "$attempt" -lt 3 ]; then
      echo "hostedcluster update failed (attempt $attempt/3), retrying in 5s" >&2
      sleep 5
    fi
  done
  set -x
  if [ "$hc_patch_succeeded" != "true" ]; then
    echo "could not update the hostedcluster identity providers" >&2
    exit 1
  fi

  oc create clusterrolebinding e2e-admin --clusterrole=cluster-admin --user=e2e-admin --dry-run=client -o yaml | oc apply -f -

  set +x
  echo "waiting for the 'test' idp to accept logins..."
  waitForHtpasswdLogin "test" "test"
  echo "waiting for the 'e2e-admin' user to accept logins..."
  waitForHtpasswdLogin "e2e-admin" "test"
  echo "waiting for the oauth rollout to complete..."
  oc --kubeconfig="$MGMT_KUBECONFIG" -n "${HC_NAMESPACE}-${CLUSTER_NAME}" rollout status deploy/oauth-openshift --timeout=10m

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
  # console-e2e-htpasswd. A provider that merely shares the name is reconfigured
  # rather than trusted.
  fixture_configured=false
  # Disable tracing: the secret-data test expands the base64 htpasswd blob
  # (which can contain non-fixture hashes) into the traced command. The
  # test entry must match the fixture hash so a foreign provider of the
  # same name is reconfigured rather than trusted.
  set +x
  if [ "$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].type}' 2>/dev/null || true)" == "HTPasswd" ] &&
    [ "$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].htpasswd.fileData.name}' 2>/dev/null || true)" == "console-e2e-htpasswd" ] &&
    [ "$(oc get secret -n openshift-config console-e2e-htpasswd --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d | grep -c "^test:$(sed -n 's/^[[:space:]]*htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d | tr -d '\n')\$")" -gt 0 ]; then
    fixture_configured=true
  fi
  set -x

  if [ "$fixture_configured" != "true" ]; then
    # Merge the fixture's 'test' entry into any existing console-e2e-htpasswd data
    # instead of replacing it, so users a custom configuration may have
    # added to the same secret keep working; the suite's own entry replaces
    # any stale one. The oauths patch merges the suite's 'test' provider
    # into the existing identity providers (see the hosted branch) and
    # carries the resourceVersion so a conflicting concurrent modification
    # fails instead of overwriting it.
    set +x
    fixture_hash="$(sed -n 's/^[[:space:]]*htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d | tr -d '\n')"
    if [ -z "$fixture_hash" ]; then
      echo "could not extract the htpasswd fixture from htpasswd-secret.yaml" >&2
      exit 1
    fi
    # --ignore-not-found yields empty output for an absent secret; any other
    # read failure aborts instead of silently dropping existing users.
    existing_htpasswd="$(oc get secret -n openshift-config console-e2e-htpasswd --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d)"
    existing_htpasswd="$(printf '%s\n' "$existing_htpasswd" | grep -v -E '^(test|e2e-admin):' || true)"
    htpasswd_file="$(mktemp)"
    {
      if [ -n "$existing_htpasswd" ]; then
        printf '%s\n' "$existing_htpasswd"
      fi
      printf '%s\n' "$fixture_hash"
    } > "$htpasswd_file"
    set -x
    if ! oc -n openshift-config create secret generic console-e2e-htpasswd --from-file=htpasswd="$htpasswd_file" --dry-run=client -o yaml |
      oc apply -f -; then
      rm -f "$htpasswd_file"
      echo "could not apply the console-e2e-htpasswd" >&2
      exit 1
    fi
    rm -f "$htpasswd_file"
    # Same read-merge-patch retry as the hosted branch, for symmetry.
    # Tracing stays off so the full resource JSON does not flood the log.
    set +x
    oauths_patch_succeeded=false
    for attempt in 1 2 3; do
      if oauths_json="$(oc get oauths cluster -o json)" &&
        idps="$(printf '%s' "$oauths_json" | jq -c '[.spec.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "console-e2e-htpasswd"}}}]')" &&
        oauths_rv="$(printf '%s' "$oauths_json" | jq -r '.metadata.resourceVersion')" &&
        oc patch oauths cluster --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$oauths_rv\"},\"spec\":{\"identityProviders\":${idps}}}"; then
        oauths_patch_succeeded=true
        break
      fi
      if [ "$attempt" -lt 3 ]; then
        echo "oauths update failed (attempt $attempt/3), retrying in 5s" >&2
        sleep 5
      fi
    done
    set -x
    if [ "$oauths_patch_succeeded" != "true" ]; then
      echo "could not update the cluster identity providers" >&2
      exit 1
    fi
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
  # still proceed (the admin auth setup warns and the login fails clearly
  # without credentials)
  set +x
  if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ] &&
    [ -f "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}" ]; then
    # Plain assignment first so a read failure aborts instead of being
    # masked by the export builtin's exit status.
    BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}")"
    export BRIDGE_KUBEADMIN_PASSWORD
  fi
  set -x
fi
