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
# long-lived cluster, clean up afterwards:
#   oc delete clusterrolebinding e2e-admin
#   oc delete user test e2e-admin; oc delete identity test:test test:e2e-admin
#   oc --kubeconfig=<mgmt> -n <ns> patch hostedcluster <name> --type=merge \
#     -p "$(oc --kubeconfig=<mgmt> -n <ns> get hostedcluster <name> -o json \
#       | jq -c 'if ([.spec.configuration.oauth.identityProviders // [] | .[] | select(.name != "test")] | length) > 0
#                then {spec:{configuration:{oauth:{identityProviders:[.spec.configuration.oauth.identityProviders // [] | .[] | select(.name != "test")]}}}}
#                else {spec:{configuration:{oauth:null}}} end')"
#   oc --kubeconfig=<mgmt> -n <ns> delete secret console-e2e-htpasswd
#     (only when no other HostedCluster in the namespace still references it:
#     the secret name is shared)
# The patch removes only the suite's 'test' provider so providers owned by
# other configurations keep working. When no other provider remains it
# removes the whole oauth configuration instead: unrelated oauth settings
# such as tokenConfig are lost, which is recoverable, unlike the lockout an
# empty provider list would cause - kubeadmin is only restored once the
# configuration is gone.
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
# carries the password as an argument. No trap-based cleanup: this script is
# sourced, and a trap here would clobber the caller's; both files are removed
# on the normal paths and only ever live in the run's temporary directory.
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
# guest precisely. (Older HyperShift releases that do not set the label
# fall back to the standalone branch; those releases are EOL.) The
# topology is exported for callers that only need the coarser signal.
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
# The suite's fixture entry, extracted once for both branches. Untraced
# because the decoded hash must not reach the logs.
set +x
fixture_hash="$(sed -n 's/^[[:space:]]*htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d | tr -d '\n')"
if [ -z "$fixture_hash" ]; then
  echo "could not extract the htpasswd fixture from htpasswd-secret.yaml" >&2
  exit 1
fi
set -x

if [ "$is_hosted" == "true" ]; then
  # Reject leftover credentials from the other topology before doing any
  # work (the setup below is idempotent but slow): kubeadmin is disabled on
  # hosted clusters once OAuth is configured, and a lone preset password
  # would pair with the wrong persona. Untraced so preset values do not
  # leak into the trace; the persona defaults are applied only after the
  # setup succeeds, at the end of this branch.
  set +x
  if [ "${OPENSHIFT_USERNAME:-}" == "kubeadmin" ]; then
    echo "OPENSHIFT_USERNAME is 'kubeadmin', which is disabled on hosted clusters once OAuth is configured; unset OPENSHIFT_USERNAME and BRIDGE_KUBEADMIN_PASSWORD (likely leftovers from a standalone run in this shell)" >&2
    exit 1
  fi
  if [ -n "${BRIDGE_KUBEADMIN_PASSWORD:-}" ] && [ -z "${OPENSHIFT_USERNAME:-}" ]; then
    echo "BRIDGE_KUBEADMIN_PASSWORD is preset without OPENSHIFT_USERNAME; on hosted clusters the admin persona is the e2e-admin user, so set both or neither" >&2
    exit 1
  fi
  if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ] && [ -n "${OPENSHIFT_USERNAME:-}" ]; then
    echo "OPENSHIFT_USERNAME is preset without BRIDGE_KUBEADMIN_PASSWORD; set both or neither" >&2
    exit 1
  fi
  set -x
  # The management cluster kubeconfig: the hypershift-aws chains save it as
  # SHARED_DIR/kubeconfig, the hostedcluster workflow family as
  # SHARED_DIR/mgmt_kubeconfig, and chains derived from hypershift-conformance
  # as SHARED_DIR/hs-mc.kubeconfig (checked first, matching the idp-htpasswd
  # step's order).
  MGMT_KUBECONFIG="${MGMT_KUBECONFIG:-}"
  if [ -z "$MGMT_KUBECONFIG" ]; then
    if [ -s "${SHARED_DIR:-}/hs-mc.kubeconfig" ]; then
      MGMT_KUBECONFIG="${SHARED_DIR}/hs-mc.kubeconfig"
    elif [ -s "${SHARED_DIR:-}/mgmt_kubeconfig" ]; then
      MGMT_KUBECONFIG="${SHARED_DIR}/mgmt_kubeconfig"
    elif [ -s "${SHARED_DIR:-}/kubeconfig" ]; then
      MGMT_KUBECONFIG="${SHARED_DIR}/kubeconfig"
    fi
  fi
  if [ -z "${CLUSTER_NAME:-}" ] && [ -s "${SHARED_DIR:-}/cluster-name" ]; then
    CLUSTER_NAME="$(cat "${SHARED_DIR}/cluster-name")"
  fi
  if [ -z "${HC_NAMESPACE:-}" ] && [ -s "${SHARED_DIR:-}/hypershift-clusters-namespace" ]; then
    HC_NAMESPACE="$(cat "${SHARED_DIR}/hypershift-clusters-namespace")"
  fi
  if [ -z "${HC_NAMESPACE:-}" ] && [ -n "${MGMT_KUBECONFIG:-}" ] && [ -n "${CLUSTER_NAME:-}" ] && [ -f "$MGMT_KUBECONFIG" ]; then
    # Neither the env nor SHARED_DIR names the namespace; look the cluster
    # up by name, as the idp-htpasswd and hypershift-conformance steps do.
    hc_lookup_err="$(mktemp)"
    if HC_NAMESPACE="$(oc --kubeconfig="$MGMT_KUBECONFIG" get hostedclusters -A -o "jsonpath={range .items[?(@.metadata.name==\"$CLUSTER_NAME\")]}{.metadata.namespace}{\"\\n\"}{end}" 2>"$hc_lookup_err")"; then
      if [ "$(printf '%s' "$HC_NAMESPACE" | grep -c .)" -gt 1 ]; then
        rm -f "$hc_lookup_err"
        echo "multiple HostedClusters named '$CLUSTER_NAME': set HC_NAMESPACE to disambiguate" >&2
        exit 1
      fi
      if [ -z "$HC_NAMESPACE" ]; then
        rm -f "$hc_lookup_err"
        echo "no HostedCluster named '$CLUSTER_NAME' in the management cluster: check CLUSTER_NAME or set HC_NAMESPACE" >&2
        exit 1
      fi
    else
      # A restricted credential cannot list hostedclusters across namespaces
      # (the idp-htpasswd step documents the same limitation); fall back to
      # the conventional namespace rather than failing, but surface why.
      echo "warning: could not list HostedClusters with the management kubeconfig, defaulting the namespace to 'clusters':" >&2
      cat "$hc_lookup_err" >&2
      HC_NAMESPACE=
    fi
    rm -f "$hc_lookup_err"
  fi
  HC_NAMESPACE="${HC_NAMESPACE:-clusters}"
  if [ ! -f "$MGMT_KUBECONFIG" ] || [ ! -s "$MGMT_KUBECONFIG" ] || [ -z "${CLUSTER_NAME:-}" ]; then
    echo "hosted cluster detected: set MGMT_KUBECONFIG (management cluster kubeconfig) and CLUSTER_NAME (HostedCluster name in namespace '$HC_NAMESPACE'), either directly or via SHARED_DIR" >&2
    exit 1
  fi
  # Fail with an actionable message when the cluster does not exist under
  # the resolved name and namespace - the namespace may have defaulted
  # after a restricted-credential lookup, and the reads below would
  # otherwise surface a raw NotFound error.
  # stderr is not discarded so the underlying error (NotFound, Forbidden,
  # ...) surfaces ahead of the actionable message below.
  if ! oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" get hostedcluster "$CLUSTER_NAME" -o name >/dev/null; then
    echo "no HostedCluster named '$CLUSTER_NAME' in namespace '$HC_NAMESPACE' of the management cluster: check CLUSTER_NAME, HC_NAMESPACE, and MGMT_KUBECONFIG" >&2
    exit 1
  fi
  # This setup configures an htpasswd identity provider through the
  # HostedCluster's integrated OAuth, so it requires integrated OAuth:
  # OIDC disables the oauth server outright, and any other explicitly
  # configured authentication type is an unsupported configuration. Fail
  # fast instead of burning the login timeout. The precheck is advisory;
  # a read failure falls through to the setup's own failure modes.
  hc_auth_type="$(oc --kubeconfig="$MGMT_KUBECONFIG" get hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" -o 'jsonpath={.spec.configuration.authentication.type}' 2>/dev/null || true)"
  if [ -n "$hc_auth_type" ] && [ "$hc_auth_type" != "IntegratedOAuth" ]; then
    echo "the HostedCluster authenticates through '$hc_auth_type' rather than integrated OAuth, which this setup requires for its htpasswd identity provider" >&2
    exit 1
  fi

  # Every step below is idempotent and runs on every invocation, so a rerun
  # reconciles an interrupted or drifted setup instead of skipping it.

  # kubeadmin is disabled on hosted clusters as soon as OAuth is configured on
  # the HostedCluster, so the e2e admin persona cannot log in as kubeadmin.
  # Add an 'e2e-admin' user with cluster-admin to the same htpasswd file for
  # tests that need an admin session. The entry uses a precomputed bcrypt
  # hash of the public test password. The suite's own entries replace any
  # stale ones while other users of the secret are preserved. Disable
  # tracing so the hashes and the credential line stay out of the logs.
  set +x
  # Seed the merge from the secret the live 'test' provider references,
  # falling back to this suite's own name, so users kept under a previous
  # secret name survive (the standalone branch does the same). The command
  # substitution strips the trailing newline and keeps internal ones;
  # --ignore-not-found yields empty output for an absent secret, and any
  # other read failure aborts. The fallback secret name is fixed per
  # namespace rather than per cluster: suites running against
  # HostedClusters that share a namespace write identical suite-owned
  # entries. Foreign entries are preserved within whichever secret the
  # merge seeds from; a run whose provider references a different secret
  # repoints the merge accordingly.
  referenced_secret="$(oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" get hostedcluster "$CLUSTER_NAME" -o 'jsonpath={.spec.configuration.oauth.identityProviders[?(@.name=="test")].htpasswd.fileData.name}')"
  if [ -z "$referenced_secret" ]; then
    referenced_secret=console-e2e-htpasswd
  fi
  existing_htpasswd="$(oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" get secret "$referenced_secret" --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d)"
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
    echo "could not apply the console-e2e-htpasswd secret to the management cluster" >&2
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
  for attempt in 1 2 3 4 5; do
    if hc_json="$(oc --kubeconfig="$MGMT_KUBECONFIG" get hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" -o json)" &&
      idps="$(printf '%s' "$hc_json" | jq -c '[.spec.configuration.oauth.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "console-e2e-htpasswd"}}}]')" &&
      hc_rv="$(printf '%s' "$hc_json" | jq -r '.metadata.resourceVersion')" &&
      oc --kubeconfig="$MGMT_KUBECONFIG" patch hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$hc_rv\"},\"spec\":{\"configuration\":{\"oauth\":{\"identityProviders\":${idps}}}}}"; then
      hc_patch_succeeded=true
      break
    fi
    if [ "$attempt" -lt 5 ]; then
      echo "hostedcluster update failed (attempt $attempt/5), retrying in $((attempt * 5))s" >&2
      sleep $((attempt * 5))
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
  # hypershift derives the control-plane namespace with the dots of the
  # HostedCluster name replaced by dashes. Advisory: both logins above
  # already succeeded, and a restricted credential may not be able to read
  # the control-plane namespace (the idp-htpasswd step documents the same
  # limitation).
  if ! oc --kubeconfig="$MGMT_KUBECONFIG" -n "${HC_NAMESPACE}-${CLUSTER_NAME//./-}" rollout status deploy/oauth-openshift --timeout=10m; then
    echo "warning: could not watch the oauth rollout to completion; continuing" >&2
  fi

  # don't log a supplied password; apply the persona defaults untraced so a
  # supplied value cannot leak into the trace. The pair-consistency checks
  # already ran at the top of this branch.
  export BRIDGE_KUBEADMIN_PASSWORD="${BRIDGE_KUBEADMIN_PASSWORD:-test}"
  export OPENSHIFT_USERNAME="${OPENSHIFT_USERNAME:-e2e-admin}"
  if [ "${OPENSHIFT_USERNAME}" != "e2e-admin" ] || [ "${BRIDGE_KUBEADMIN_PASSWORD}" != "test" ]; then
    echo "warning: overridden admin credentials were not verified by this setup; only the e2e-admin user was" >&2
  fi
  set -x
else
  # The mirror of the hosted branch's guards, and like them checked before
  # any work: 'e2e-admin' is the hosted-only admin persona (this branch does
  # not provision it), so a preset username is a leftover from a hosted run
  # in this shell. Untraced so preset values do not leak into the trace.
  set +x
  if [ "${OPENSHIFT_USERNAME:-}" == "e2e-admin" ]; then
    echo "OPENSHIFT_USERNAME is 'e2e-admin', the hosted-cluster admin persona, which this setup does not provision on a standalone cluster; unset it (likely a leftover from a hosted run in this shell)" >&2
    exit 1
  fi
  set -x
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
    [ "$(oc get secret -n openshift-config console-e2e-htpasswd --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d | grep -cF "$fixture_hash")" -gt 0 ]; then
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
    # Seed the merge from the secret the live 'test' provider references,
    # falling back to this suite's own name, so users an earlier setup or an
    # administrator kept under a previous secret name survive the rename to
    # console-e2e-htpasswd. --ignore-not-found yields empty output for an
    # absent secret; any other read failure aborts instead of silently
    # dropping existing users.
    referenced_secret="$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].htpasswd.fileData.name}')"
    if [ -z "$referenced_secret" ]; then
      referenced_secret=console-e2e-htpasswd
    fi
    existing_htpasswd="$(oc get secret -n openshift-config "$referenced_secret" --ignore-not-found -o 'jsonpath={.data.htpasswd}' | base64 -d)"
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
      echo "could not apply the console-e2e-htpasswd secret" >&2
      exit 1
    fi
    rm -f "$htpasswd_file"
    # Same read-merge-patch retry as the hosted branch, for symmetry.
    # Tracing stays off so the full resource JSON does not flood the log.
    set +x
    oauths_patch_succeeded=false
    for attempt in 1 2 3 4 5; do
      if oauths_json="$(oc get oauths cluster -o json)" &&
        idps="$(printf '%s' "$oauths_json" | jq -c '[.spec.identityProviders // [] | .[] | select(.name != "test")] + [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: "console-e2e-htpasswd"}}}]')" &&
        oauths_rv="$(printf '%s' "$oauths_json" | jq -r '.metadata.resourceVersion')" &&
        oc patch oauths cluster --type=merge -p "{\"metadata\":{\"resourceVersion\":\"$oauths_rv\"},\"spec\":{\"identityProviders\":${idps}}}"; then
        oauths_patch_succeeded=true
        break
      fi
      if [ "$attempt" -lt 5 ]; then
        echo "oauths update failed (attempt $attempt/5), retrying in $((attempt * 5))s" >&2
        sleep $((attempt * 5))
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
  kubeadmin_password_file="${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}"
  if [ -z "${BRIDGE_KUBEADMIN_PASSWORD:-}" ] && [ -f "$kubeadmin_password_file" ]; then
    # Plain assignment first so a read failure aborts instead of being
    # masked by the export builtin's exit status.
    BRIDGE_KUBEADMIN_PASSWORD="$(cat "$kubeadmin_password_file")"
    export BRIDGE_KUBEADMIN_PASSWORD
  fi
  set -x
fi
