# shellcheck shell=bash
#
# NOTE: This script is for native Kubernetes. If connecting to an OpenShift
# cluster instead, use contrib/oc-environment.sh.
#
# This file is an example of how you might set up your environment to run the
# OpenShift console during development when connecting to a native Kubernetes
# cluster. To use it for running bridge, do
#
# . contrib/environment.sh
# ./bin/bridge
#
# You'll need a working kubectl, and you'll need jq installed and in your path
# for this script to work correctly.
#
# This will use the first secret it finds in the default namespace. All secrets
# must be valid or removed from the namespace.
#
# The environment variables beginning with "BRIDGE_" act just like bridge
# command line arguments - in fact. to get more information about any of them,
# you can run ./bin/bridge --help

BRIDGE_USER_AUTH="disabled"
export BRIDGE_USER_AUTH

BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE

BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(kubectl config view -o json | jq '{myctx: .["current-context"], ctxs: .contexts[], clusters: .clusters[]}' | jq 'select(.myctx == .ctxs.name)' | jq 'select(.ctxs.context.cluster ==  .clusters.name)' | jq '.clusters.cluster.server' -r)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT

BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS

BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_AUTH

secretname=$(kubectl get serviceaccount default --namespace=kube-system -o jsonpath='{.secrets[0].name}')
BRIDGE_K8S_AUTH_BEARER_TOKEN=$(kubectl get secret "$secretname" --namespace=kube-system -o template --template='{{.data.token}}' | base64 --decode)
export BRIDGE_K8S_AUTH_BEARER_TOKEN

echo "Using $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
