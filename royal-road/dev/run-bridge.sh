#!/usr/bin/env bash
# Run the bridge off-cluster against a kind cluster made by kind-up.sh, with
# auth disabled and a cluster-admin ServiceAccount token.
#
# Usage: royal-road/dev/run-bridge.sh [name] [extra bridge flags...]
#
# Environment:
#   KIND_KUBECONFIG  kubeconfig (default /tmp/kind-<name>.kubeconfig)
#   BRIDGE_BIN       bridge binary (default ./bin/bridge; build with ./build-backend.sh)
#   PUBLIC_DIR       frontend build (default ./frontend/public/dist). To skip a
#                    frontend build, copy it out of an image:
#                      id=$(docker create ghcr.io/royal-road/console:main)
#                      docker cp "$id:/opt/bridge/static" /tmp/console-static; docker rm "$id"
#   LISTEN           listen address (default http://localhost:9000)
# Any BRIDGE_* variable already set (for example BRIDGE_PLUGINS) is passed through.
set -euo pipefail

NAME=${1:-rr-console}
shift || true
export KUBECONFIG=${KIND_KUBECONFIG:-/tmp/kind-${NAME}.kubeconfig}

BRIDGE_BIN=${BRIDGE_BIN:-./bin/bridge}
PUBLIC_DIR=${PUBLIC_DIR:-./frontend/public/dist}

export BRIDGE_USER_AUTH=disabled
export BRIDGE_K8S_MODE=off-cluster
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
BRIDGE_K8S_AUTH_BEARER_TOKEN=$(kubectl -n kube-system create token console-dev --duration=24h)
export BRIDGE_K8S_AUTH_BEARER_TOKEN
scratch=${RUN_BRIDGE_DIR:-/tmp/run-bridge-${NAME}}
mkdir -p "$scratch"
# The bridge's own ServiceAccount identity (used for e.g. dashboard ConfigMaps
# and user settings), as the in-cluster console has.
printf '%s' "$BRIDGE_K8S_AUTH_BEARER_TOKEN" >"$scratch/sa-token"
chmod 600 "$scratch/sa-token"
export BRIDGE_K8S_MODE_OFF_CLUSTER_SERVICE_ACCOUNT_BEARER_TOKEN_FILE=$scratch/sa-token
# The user-settings client ignores SKIP_VERIFY_TLS off-cluster, so trust the
# kind API server's CA instead.
kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' |
  base64 -d >"$scratch/api-ca.crt"
export SSL_CERT_FILE=$scratch/api-ca.crt
export BRIDGE_LISTEN=${LISTEN:-http://localhost:9000}
export BRIDGE_PUBLIC_DIR=$PUBLIC_DIR
# The Helm backend reads Helm's client config; keep the host user's
# ~/.config/helm (repositories, cache) out of the bridge.
helm_home=${HELM_HOME_DIR:-$scratch/helm}
export HELM_CONFIG_HOME=$helm_home/config HELM_CACHE_HOME=$helm_home/cache HELM_DATA_HOME=$helm_home/data

echo "bridge -> $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT on $BRIDGE_LISTEN"
exec "$BRIDGE_BIN" "$@"
