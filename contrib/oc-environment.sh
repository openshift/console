# This file is an example of how you might set up your environment to
# run the tectonic console against OpenShift during development. To use it for running
# bridge, do
#
# . contrib/oc-environment.sh
# ./bin/bridge
#

# You'll need a working oc logged in, and you'll need jq installed and in your
# path for this script to work correctly.

# The environment variables beginning with "BRIDGE_" act just like
# bridge command line arguments - in fact. to get more information
# about any of them, you can run ./bin/bridge --help

THANOS_URL=$(oc -n openshift-monitoring get configmap sharing-config -o jsonpath='{.data.thanosURL}')
PROMETHEUS_URL=$(oc -n openshift-monitoring get configmap sharing-config -o jsonpath='{.data.prometheusURL}')
ALERTMANAGER_URL=$(oc -n openshift-monitoring get configmap sharing-config -o jsonpath='{.data.alertmanagerURL}')

export BRIDGE_USER_AUTH="disabled"
export BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER="${ALERTMANAGER_URL}"
export BRIDGE_K8S_MODE_OFF_CLUSTER_PROMETHEUS="${PROMETHEUS_URL}"
export BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS="${THANOS_URL}"

if [ -z  "${ALERTMANAGER_URL}" ]; then
    echo "ERROR: No alert manager provider"
    kill -INT $$
fi

if [ -z  "${PROMETHEUS_URL}" ]; then
    echo "ERROR: No metrics provider"
    kill -INT $$
fi

if [ -z  "${THANOS_URL}" ]; then
     echo "Warning: No Thanos server, using Prometheus instead"
     export BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS="${PROMETHEUS_URL}"
fi

echo "Using $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
