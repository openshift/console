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

BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_AUTH

BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token)
export BRIDGE_K8S_AUTH_BEARER_TOKEN

echo "Using $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
