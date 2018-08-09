#!/usr/bin/env bash

set -euo pipefail


BRIDGE_K8S_AUTH_BEARER_TOKEN=$(kubectl config view -o json | jq '{myctx: .["current-context"], ctxs: .contexts[], users: .users[]}' | jq 'select(.myctx == .ctxs.name)' | jq 'select(.ctxs.context.user ==  .users.name)' | jq '.users.user.token' -r)
export BRIDGE_K8S_AUTH_BEARER_TOKEN
if [ -z "$BRIDGE_K8S_AUTH_BEARER_TOKEN" ];
then
	echo "no BRIDGE_K8S_AUTH_BEARER_TOKEN!?"
	exit 1
fi

BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(kubectl config view -o json | jq '{myctx: .["current-context"], ctxs: .contexts[], clusters: .clusters[]}' | jq 'select(.myctx == .ctxs.name)' | jq 'select(.ctxs.context.cluster ==  .clusters.name)' | jq '.clusters.cluster.server' -r)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT
if [ -z "$BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT" ];
then
	echo "no BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT!?"
	exit 1
fi

BRIDGE_BASE_PATH="/path-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c10)/"
export BRIDGE_BASE_PATH

# TODO: eventually test auth
./bin/bridge \
  --k8s-mode="off-cluster" \
  --user-auth="disabled" \
  --k8s-mode-off-cluster-skip-verify-tls=true \
  --k8s-auth="bearer-token" \
  --k8s-mode-off-cluster-endpoint="$BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT" \
  --k8s-auth-bearer-token="$BRIDGE_K8S_AUTH_BEARER_TOKEN" &

echo $! > bridge.pid

cd frontend
yarn run webdriver-update --quiet > /dev/null 2>&1

if [ $# -gt 0 ] && [ -n "$1" ];
then
  yarn run test-suite --suite "$1" --params.openshift true
else
  yarn run test-gui --params.openshift true
fi

kill "$(cat ../bridge.pid)"
