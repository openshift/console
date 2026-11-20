#!/usr/bin/env bash

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo 'create-user.sh requires jq for the HyperShift setup.' >&2
  exit 1
fi

BASEDIR=$(dirname "${BASH_SOURCE[0]}")/..

createHostedUsers() (
  set +x
  local management_kubeconfig="${MGMT_KUBECONFIG:-${SHARED_DIR:+${SHARED_DIR}/kubeconfig}}"
  local cluster_name="${CLUSTER_NAME:-}"
  local namespace="${HC_NAMESPACE:-clusters}"
  if [ -z "$cluster_name" ] && [ -n "${SHARED_DIR:-}" ] && [ -s "$SHARED_DIR/cluster-name" ]; then
    cluster_name=$(cat "$SHARED_DIR/cluster-name")
  fi
  if [ ! -s "$management_kubeconfig" ] || [ -z "$cluster_name" ]; then
    echo 'HyperShift setup requires MGMT_KUBECONFIG and CLUSTER_NAME or their CI files in SHARED_DIR.' >&2
    exit 1
  fi

  local -a management_oc=(oc --kubeconfig="$management_kubeconfig" -n "$namespace")
  local hosted_cluster secret_name cluster_uid patch attempt temp_dir username password admin_password
  hosted_cluster=$("${management_oc[@]}" get hostedcluster "$cluster_name" -o json)
  if ! jq -e '(.spec.configuration.authentication.type // "IntegratedOAuth") == "IntegratedOAuth"' <<< "$hosted_cluster" >/dev/null; then
    echo 'HyperShift htpasswd setup requires integrated OAuth.' >&2
    exit 1
  fi
  cluster_uid=$(jq -er '.metadata.uid' <<< "$hosted_cluster")
  secret_name="console-e2e-htpasswd-${cluster_uid}"
  temp_dir=$(mktemp -d)
  trap 'rm -rf "$temp_dir"' EXIT

  # A per-run password for the e2e-admin user, so the cluster-admin
  # credentials are never a fixed public value.
  admin_password=$(openssl rand -base64 24)

  # The HostedCluster reads the htpasswd file from its management namespace.
  {
    sed -n 's/^[[:space:]]*htpasswd: //p' "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml" | base64 -d
    printf '\ne2e-admin:%s\n' "$(openssl passwd -apr1 "$admin_password")"
  } > "$temp_dir/htpasswd"
  # Owned by the HostedCluster so the secret is garbage-collected with it.
  "${management_oc[@]}" create secret generic "$secret_name" --from-file=htpasswd="$temp_dir/htpasswd" --dry-run=client -o json |
    jq --arg cluster "$cluster_name" --arg uid "$cluster_uid" \
      '.metadata.ownerReferences = [{apiVersion: "hypershift.openshift.io/v1beta1", kind: "HostedCluster", name: $cluster, uid: $uid}]' |
    "${management_oc[@]}" apply -f - >/dev/null

  # Preserve other providers and retry if the operator updates the HostedCluster concurrently.
  for attempt in 1 2 3 4 5; do
    patch=$(jq -c --arg secret "$secret_name" '{
      metadata: {resourceVersion: .metadata.resourceVersion},
      spec: {configuration: {oauth: {identityProviders: (
        [.spec.configuration.oauth.identityProviders[]? | select(.name != "test")] +
        [{name: "test", mappingMethod: "claim", type: "HTPasswd", htpasswd: {fileData: {name: $secret}}}]
      )}}}
    }' <<< "$hosted_cluster")
    if "${management_oc[@]}" patch hostedcluster "$cluster_name" --type=merge -p "$patch" >/dev/null; then
      break
    fi
    if [ "$attempt" -eq 5 ]; then
      exit 1
    fi
    sleep 5
    hosted_cluster=$("${management_oc[@]}" get hostedcluster "$cluster_name" -o json)
  done

  # Configuring a hosted identity provider disables kubeadmin.
  oc create clusterrolebinding e2e-admin --clusterrole=cluster-admin --user=e2e-admin --dry-run=client -o yaml | oc apply -f - >/dev/null

  oc config view --raw --flatten --minify > "$temp_dir/guest-kubeconfig"
  for username in test e2e-admin; do
    password=test
    if [ "$username" = 'e2e-admin' ]; then
      password=$admin_password
    fi
    echo "Waiting for the HyperShift test login for $username..." >&2
    for ((attempt = 1; attempt <= 40; attempt++)); do
      cp "$temp_dir/guest-kubeconfig" "$temp_dir/login-kubeconfig"
      if oc --kubeconfig="$temp_dir/login-kubeconfig" login --username="$username" --password="$password" > "$temp_dir/login.log" 2>&1; then
        break
      fi
      if [ "$attempt" -eq 40 ]; then
        echo "Timed out waiting for the HyperShift test login for $username." >&2
        cat "$temp_dir/login.log" >&2
        exit 1
      fi
      sleep 15
    done
  done
  # The generated admin password is this function's only stdout line; every
  # other output goes to stderr so the caller can capture it.
  printf '%s\n' "$admin_password"
)

createStandaloneUser() (
  set -x

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
      echo "authentication operator: maximum retries reached (duration: $durationStr)"
      exit 1
    fi
  }

  # Add htpasswd IDP
  # Skip wait for authentication operator to start Progressing when the Secret already exists.
  # And ignore any kind of errors when the Secret doesn't exist.
  htpasswd_secret_name=$(oc get --ignore-not-found secret -n openshift-config htpass-secret -o name 2> /dev/null)

  if [ "$htpasswd_secret_name" == "" ]; then
    oc create -f "$BASEDIR/frontend/packages/console-shared/src/test-data/htpasswd-secret.yaml"
    oc patch oauths cluster --patch "$(cat "$BASEDIR/frontend/packages/console-shared/src/test-data/patch-htpasswd.yaml")" --type=merge
    set +x
    echo "waiting for authentication operator to start Progressing 'test' idp..."
    waitForAuthOperatorProgressing "True"
    echo "waiting for authentication operator to finish Progressing 'test' idp..."
    waitForAuthOperatorProgressing "False"
    set -x
  fi
)

control_plane_topology=$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.status.controlPlaneTopology}')
managed_label=$(oc get infrastructures.config.openshift.io cluster -o 'jsonpath={.metadata.labels.hypershift\.openshift\.io/managed}')
export PLAYWRIGHT_HYPERSHIFT=false
if [ "$control_plane_topology" = 'External' ] && [ "$managed_label" = 'true' ]; then
  # Capture and export the generated admin password untraced: bash prints
  # assignment results under xtrace, and the entrypoints source this script
  # with tracing enabled.
  was_tracing=false
  [[ $- == *x* ]] && was_tracing=true
  set +x
  admin_password=$(createHostedUsers)
  export PLAYWRIGHT_HYPERSHIFT=true
  export OPENSHIFT_USERNAME=e2e-admin
  export BRIDGE_KUBEADMIN_PASSWORD="$admin_password"
  unset admin_password
  if $was_tracing; then set -x; fi
else
  createStandaloneUser
fi
