# shellcheck shell=bash
#
# This file is an example of how you might set up your environment to run the
# console against an OpenShift cluster during development. To use it for
# running bridge, do
#
# . contrib/oc-environment.sh
# ./bin/bridge
#
# You'll need oc, and you'll need to be logged into a cluster.
#
# The environment variables beginning with "BRIDGE_" act just like bridge
# command line arguments - in fact. to get more information about any of them,
# you can run ./bin/bridge --help

BRIDGE_USER_AUTH="disabled"
export BRIDGE_USER_AUTH

BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE

BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT

BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS

BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}')
export BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS

BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}')
export BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER

GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2>/dev/null)
if [ -n "$GITOPS_HOSTNAME" ]; then
    BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
    export BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS
fi

# This route will not exist by default. If we want olmv1 to work off cluster, we will need to
# manually create a route for the catalogd service.
CATALOGD_HOSTNAME=$(oc -n openshift-catalogd get route catalogd-route -o jsonpath='{.spec.host}' 2>/dev/null)
if [ -n "$CATALOGD_HOSTNAME" ]; then
    BRIDGE_K8S_MODE_OFF_CLUSTER_CATALOGD="https://$CATALOGD_HOSTNAME"
    export BRIDGE_K8S_MODE_OFF_CLUSTER_CATALOGD
fi

BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token)
export BRIDGE_K8S_AUTH_BEARER_TOKEN

BRIDGE_USER_SETTINGS_LOCATION="localstorage"
export BRIDGE_USER_SETTINGS_LOCATION

# This is a workaround for local setup where Helm CLI has been setup with helm repositories
HELM_REPOSITORY_CONFIG="/tmp/repositories.yaml"
export HELM_REPOSITORY_CONFIG

echo "Using $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
