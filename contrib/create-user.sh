#!/usr/bin/env bash
#
# Creates the htpasswd 'test' user the e2e suite logs in with on the cluster
# under test and exports the admin persona credentials for the calling shell:
# OPENSHIFT_USERNAME and BRIDGE_KUBEADMIN_PASSWORD.
#
# Run directly or source it; sourcing keeps the exported variables in the
# calling shell, which is how the prow e2e entrypoints use it. Aborts the
# calling shell on failure.

set -exuo pipefail

BASEDIR="$(dirname "${BASH_SOURCE[0]}")/.."

function waitForAuthOperatorProgressing {
  output=''
  count=0
  sleepDuration=15
  maxRetries=40 # 10 minutes
  action="started"
  if [ "$1" == "False" ]; then
    action="finished"
  fi

  until [ "$output" == "$1" ] || [ $count -gt $maxRetries ]; do
    output=$(oc get co/authentication -o 'jsonpath={.status.conditions[?(@.type=="Progressing")].status}')
    ((count=count+1))
    sleep $sleepDuration
  done

  secs=$((count*sleepDuration));
  printf -v durationStr '%dm:%ds' $((secs%3600/60)) $((secs%60))
  if [ "$output" == "$1" ]; then
    echo "authentication operator $action Progressing 'test' idp (duration: $durationStr)"
  else
    echo "authentication operator: maximum retries reached (duration: $durationStr)" >&2
    return 1
  fi
}

# Wait until the htpasswd IDP accepts a login for the given user. Logs in on a
# copy of the kubeconfig so the caller's credentials are not replaced.
function waitForHtpasswdLogin {
  username="$1"
  password="$2"
  count=0
  sleepDuration=15
  maxRetries=40 # 10 minutes
  kubeconfig_copy="$(mktemp)"

  until cp "${KUBECONFIG:-$HOME/.kube/config}" "$kubeconfig_copy" &&
    oc --kubeconfig="$kubeconfig_copy" login --username="$username" --password="$password" >/dev/null 2>&1; do
    count=$((count+1))
    if [ $count -gt $maxRetries ]; then
      echo "htpasswd login for '$username' did not succeed after $((count*sleepDuration/60)) minutes" >&2
      return 1
    fi
    sleep $sleepDuration
  done

  rm -f "$kubeconfig_copy"
}

# Skip the IDP setup when the 'test' idp is already configured. The oauths
# resource is readable on hosted clusters even though it is immutable there,
# so this also makes reruns against a hosted cluster idempotent.
htpasswd_idp_name="$(oc get oauths cluster -o 'jsonpath={.spec.identityProviders[?(@.name=="test")].name}' 2>/dev/null || true)"

# Hosted clusters (HyperShift) report an external control plane topology.
# Their OAuth identity providers are managed through the HostedCluster object
# in the management cluster: the guest oauths resource cannot be patched.
control_plane_topology="$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.status.controlPlaneTopology}')"

if [ "$control_plane_topology" == "External" ]; then
  if [ "$htpasswd_idp_name" != "test" ]; then
    MGMT_KUBECONFIG="${MGMT_KUBECONFIG:-${SHARED_DIR:-}/kubeconfig}"
    HC_NAMESPACE="${HC_NAMESPACE:-clusters}"
    if [ -z "${CLUSTER_NAME:-}" ] && [ -s "${SHARED_DIR:-}/cluster-name" ]; then
      CLUSTER_NAME="$(cat "${SHARED_DIR}/cluster-name")"
    fi
    if [ ! -s "$MGMT_KUBECONFIG" ] || [ -z "${CLUSTER_NAME:-}" ]; then
      echo "hosted cluster detected: set MGMT_KUBECONFIG (management cluster kubeconfig) and CLUSTER_NAME (HostedCluster name in namespace '$HC_NAMESPACE'), either directly or via SHARED_DIR" >&2
      exit 1
    fi

    # kubeadmin is disabled on hosted clusters as soon as an identity provider
    # is configured, so the e2e admin persona cannot log in as kubeadmin. Add
    # an 'e2e-admin' user with cluster-admin to the same htpasswd file for
    # tests that need an admin session.
    htpasswd_file="$(mktemp)"
    grep 'htpasswd:' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | awk '{print $2}' | base64 -d | tr -d '\n' > "$htpasswd_file"
    printf '\ne2e-admin:%s\n' "$(openssl passwd -apr1 test)" >> "$htpasswd_file"

    # The secret referenced by the HostedCluster oauth configuration is read
    # from the management cluster, not from the guest's openshift-config.
    oc --kubeconfig="$MGMT_KUBECONFIG" -n "$HC_NAMESPACE" create secret generic htpass-secret --from-file=htpasswd="$htpasswd_file" --dry-run=client -o yaml |
      oc --kubeconfig="$MGMT_KUBECONFIG" apply -f -
    rm -f "$htpasswd_file"

    oc --kubeconfig="$MGMT_KUBECONFIG" patch hostedcluster -n "$HC_NAMESPACE" "$CLUSTER_NAME" --type=merge -p '{"spec":{"configuration":{"oauth":{"identityProviders":[{"name":"test","mappingMethod":"claim","type":"HTPasswd","htpasswd":{"fileData":{"name":"htpass-secret"}}}]}}}}'
  fi

  # Reconcile the admin access and validate the logins on every run, also when
  # the 'test' idp is already configured, so a rerun completes an interrupted
  # setup instead of exporting credentials that were never established.
  oc create clusterrolebinding e2e-admin --clusterrole=cluster-admin --user=e2e-admin --dry-run=client -o yaml | oc apply -f -

  set +x
  echo "waiting for the 'test' idp to accept logins..."
  waitForHtpasswdLogin "test" "test"
  echo "waiting for the 'e2e-admin' user to accept logins..."
  waitForHtpasswdLogin "e2e-admin" "test"
  set -x

  # don't log a supplied password
  set +x
  export BRIDGE_KUBEADMIN_PASSWORD="${BRIDGE_KUBEADMIN_PASSWORD:-test}"
  set -x

  export OPENSHIFT_USERNAME="${OPENSHIFT_USERNAME:-e2e-admin}"
else
  if [ "$htpasswd_idp_name" != "test" ]; then
    oc create -f "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml"
    oc patch oauths cluster --patch "$(cat "$BASEDIR/frontend/packages/console-shared/src/test-data/patch-htpasswd.yaml")" --type=merge
    set +x
    echo "waiting for authentication operator to start Progressing 'test' idp..."
    waitForAuthOperatorProgressing "True"
    echo "waiting for authentication operator to finish Progressing 'test' idp..."
    waitForAuthOperatorProgressing "False"
    set -x
  fi

  export OPENSHIFT_USERNAME="${OPENSHIFT_USERNAME:-kubeadmin}"
  # don't log kubeadmin-password
  set +x
  export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR:-${ARTIFACT_DIR:-/tmp/artifacts}/installer}/auth/kubeadmin-password}")"
  set -x
fi
