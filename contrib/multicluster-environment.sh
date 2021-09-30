#!/usr/bin/env bash

# This script will set up every cluster in your kubeconfig file as a managed
# cluster and run a local bridge. The hub cluster will be your current
# kubeconfig context. Typically, you'll want to start with a fresh kubeconfig
# file. For example:
#
# $ export KUBECONFIG=multicluster.config
# $ oc login cluster1.devcluster.openshift.com:6443
# $ oc login cluster2.devcluster.openshift.com:6443
# $ oc login cluster3.devcluster.openshift.com:6443
# $ source ./contrib/multicluster-environment.sh
# $ ./bin/bridge
#
# The script will create OAuthClients on each cluster and is meant only for
# development clusters.

CURRENT_CONTEXT=$(oc config current-context)
OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID:=local-console-oauth-client}
OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET:=open-sesame}
BRIDGE_MANAGED_CLUSTERS="[]"
CA_FILE_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'bridge-ca-files')

oc get -n openshift-config-managed cm kube-root-ca.crt -o json | jq -r '.data["ca.crt"]' > "$CA_FILE_DIR/api-ca.crt"
oc get -n openshift-config-managed cm default-ingress-cert -o json | jq -r '.data["ca-bundle.crt"]' > "$CA_FILE_DIR/oauth-ca.crt"

for CONTEXT in $(oc config get-contexts -o name); do
    # Set up the OAuthClient for this cluster
    cat <<EOF | oc --context "$CONTEXT" apply -f -
    apiVersion: oauth.openshift.io/v1
    kind: OAuthClient
    metadata:
      name: "$OAUTH_CLIENT_ID"
    grantMethod: auto
    secret: "$OAUTH_CLIENT_SECRET"
    redirectURIs:
    - http://localhost:9000
EOF
    # If not the hub (current context), add the cluster to the managed cluster JSON array
    if [ "$CONTEXT" != "$CURRENT_CONTEXT" ]; then
        NAME=$(echo "$CONTEXT" | cut -f2 -d"/" | cut -f1 -d":")
        URL=$(oc --context "$CONTEXT" whoami --show-server)
        # Make a directory for CA files
        mkdir -p "$CA_FILE_DIR/$NAME"
        CA_FILE="$CA_FILE_DIR/$NAME/api-ca.crt"
        OAUTH_CA_FILE="$CA_FILE_DIR/$NAME/oauth-ca.crt"
        oc --context "$CONTEXT" get -n openshift-config-managed cm kube-root-ca.crt -o json | jq -r '.data["ca.crt"]' > "$CA_FILE"
        oc --context "$CONTEXT" get -n openshift-config-managed cm default-ingress-cert -o json | jq -r '.data["ca-bundle.crt"]' > "$OAUTH_CA_FILE"
        BRIDGE_MANAGED_CLUSTERS=$(echo "$BRIDGE_MANAGED_CLUSTERS" | \
            jq --arg name "$NAME" \
            --arg url "$URL" \
            --arg caFile "$CA_FILE" \
            --arg clientID "$OAUTH_CLIENT_ID" \
            --arg clientSecret "$OAUTH_CLIENT_SECRET" \
            --arg oauthCAFile "$OAUTH_CA_FILE" \
            '. += [{"name": $name, "apiServer": {"url": $url, "caFile": $caFile}, "oauth": {"clientID": $clientID, "clientSecret": $clientSecret, caFile: $oauthCAFile}}]')
    fi
done

export BRIDGE_MANAGED_CLUSTERS

BRIDGE_BASE_ADDRESS="http://localhost:9000"
export BRIDGE_BASE_ADDRESS

# FIXME: We should be able to get rid of this, but it requires changes to
# main.go to support `ca-file` in off-cluster mode for the k8s proxy.
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS

BRIDGE_K8S_AUTH="openshift"
export BRIDGE_K8S_AUTH

BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE

BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT

BRIDGE_CA_FILE="$CA_FILE_DIR/api-ca.crt"
export BRIDGE_CA_FILE

BRIDGE_USER_AUTH="openshift"
export BRIDGE_USER_AUTH

BRIDGE_USER_AUTH_OIDC_CLIENT_ID="$OAUTH_CLIENT_ID"
export BRIDGE_USER_AUTH_OIDC_CLIENT_ID

BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET="$OAUTH_CLIENT_SECRET"
export BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET

BRIDGE_USER_AUTH_OIDC_CA_FILE="$CA_FILE_DIR/oauth-ca.crt"
export BRIDGE_USER_AUTH_OIDC_CA_FILE

echo "Using hub cluster: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
echo "Using managed clusters:"
echo "$BRIDGE_MANAGED_CLUSTERS" | jq -r '.[].apiServer.url'
