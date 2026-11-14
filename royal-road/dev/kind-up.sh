#!/usr/bin/env bash
# Create a kind cluster that stands in for the production cluster described in
# FORK.md ("Verification environment"):
#   - the only OpenShift CRD production has: helmchartrepositories.helm.openshift.io
#   - Rook CRDs (no operator), so storage-related flags behave as in production
#   - the prometheus-operator Prometheus CRD, which production also has
#   - a few Helm releases with several upgrades each, so superseded revisions exist
#   - a cluster-admin ServiceAccount for running the bridge off-cluster
#
# Usage: royal-road/dev/kind-up.sh [name]
# Writes the kubeconfig to ${KIND_KUBECONFIG:-/tmp/kind-<name>.kubeconfig} and
# never touches ~/.kube/config. Re-running against an existing cluster is safe.
#
# Each kind node runs systemd, which stores keys in the kernel keyring of the
# user that owns Docker. Where that user is unprivileged on the host (rootless
# Docker, unprivileged LXC), the default kernel.keys.maxbytes=20000 fits only a
# few clusters; new containers then fail to start. Raise it on the host, e.g.
#   sysctl -w kernel.keys.maxkeys=20000 kernel.keys.maxbytes=2000000
#
# Extra CRDs from royal-road/deploy/crds/ are NOT installed here; work packages
# that add them apply them explicitly so "with and without" can be compared.
set -euo pipefail

NAME=${1:-rr-console}
export KUBECONFIG=${KIND_KUBECONFIG:-/tmp/kind-${NAME}.kubeconfig}

# openshift/api commit the console vendors (go.mod replace directive).
OPENSHIFT_API_SHA=6ab113cb736829b0cb17174b9b26d355e4cda3a0
ROOK_VERSION=v1.21.2
PROMETHEUS_OPERATOR_VERSION=v0.86.2
HELM_RELEASES=${HELM_RELEASES:-6}   # releases per namespace
HELM_UPGRADES=${HELM_UPGRADES:-5}   # upgrades per release

if ! kind get clusters 2>/dev/null | grep -qx "$NAME"; then
  # KubeletInUserNamespace lets the kubelet start when Docker itself runs in a
  # user namespace (rootless Docker, unprivileged LXC), where /dev/kmsg and
  # oom_score_adj are unavailable. It is harmless elsewhere.
  kind create cluster --name "$NAME" --kubeconfig "$KUBECONFIG" --wait 180s --config - <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
featureGates:
  KubeletInUserNamespace: true
# Don't give every pod container its own session keyring; that eats the
# keyring quota described above.
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
      NoNewKeyring = true
EOF
else
  kind export kubeconfig --name "$NAME" --kubeconfig "$KUBECONFIG"
fi
kubectl cluster-info >/dev/null

kubectl apply --server-side -f \
  "https://raw.githubusercontent.com/openshift/api/${OPENSHIFT_API_SHA}/helm/v1beta1/zz_generated.crd-manifests/00_helmchartrepositories.crd.yaml"
kubectl apply --server-side -f \
  "https://raw.githubusercontent.com/rook/rook/${ROOK_VERSION}/deploy/examples/crds.yaml"
# Production runs prometheus-operator; the console's PROMETHEUS flag (which
# gates the Overview dashboard) checks for this CRD.
kubectl apply --server-side -f \
  "https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/${PROMETHEUS_OPERATOR_VERSION}/example/prometheus-operator-crd/monitoring.coreos.com_prometheuses.yaml"

# Cluster-admin identity for the bridge (BRIDGE_USER_AUTH=disabled).
kubectl -n kube-system get sa console-dev >/dev/null 2>&1 ||
  kubectl -n kube-system create sa console-dev
kubectl get clusterrolebinding console-dev >/dev/null 2>&1 ||
  kubectl create clusterrolebinding console-dev --clusterrole=cluster-admin \
    --serviceaccount=kube-system:console-dev

# Helm releases with superseded revisions, from a chart generated locally (no
# network chart repo needed). Skipped if the first release already exists.
if ! helm status demo-0 -n helm-a >/dev/null 2>&1; then
  chartdir=$(mktemp -d)
  helm create "$chartdir/demo" >/dev/null
  for ns in helm-a helm-b helm-c; do
    for i in $(seq 0 $((HELM_RELEASES - 1))); do
      # replicaCount=0: no pods, so the cluster stays light.
      helm upgrade --install "demo-$i" "$chartdir/demo" -n "$ns" --create-namespace \
        --set replicaCount=0 >/dev/null
      for u in $(seq 1 "$HELM_UPGRADES"); do
        helm upgrade "demo-$i" "$chartdir/demo" -n "$ns" \
          --set replicaCount=0 --set podAnnotations.rev="r$u" >/dev/null
      done
    done
  done
  rm -rf "$chartdir"
fi

echo "kind cluster '$NAME' ready. KUBECONFIG=$KUBECONFIG"
echo "Helm release secrets: $(kubectl get secrets -A -l owner=helm --no-headers | wc -l)"
