#!/usr/bin/env bash
# Stand-in for production's logging on a kind cluster made by
# royal-road/dev/kind-up.sh: VictoriaLogs (single node, same version as
# production), a few workloads in three namespaces, the plugin + tenancy proxy
# from royal-road/deploy/logging-view-plugin.yaml, and a ServiceAccount that may
# read logs in team-a only. Then push-logs.py ships log lines with Alloy's labels.
#
# Usage: kind-demo.sh <cluster-name> <plugin-image>
#   e.g. kind-demo.sh rr-logs rr-logging-view-plugin:test
set -euo pipefail

NAME=${1:?cluster name}
IMAGE=${2:?plugin image}
export KUBECONFIG=${KIND_KUBECONFIG:-/tmp/kind-${NAME}.kubeconfig}
HERE=$(cd "$(dirname "$0")" && pwd)
DEPLOY=$HERE/../../../deploy/logging-view-plugin.yaml
VL_IMAGE=docker.io/victoriametrics/victoria-logs:v1.53.0@sha256:251121fa882af99b95ba0c230a4a2f412ea602d2698c64a96c58dc9842bb755d

kind load docker-image --name "$NAME" "$IMAGE"

kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata: {name: logging}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: victorialogs, namespace: logging}
spec:
  selector: {matchLabels: {app: victorialogs}}
  template:
    metadata: {labels: {app: victorialogs}}
    spec:
      containers:
        - name: victorialogs
          image: $VL_IMAGE
          args: [-httpListenAddr=:9428, -retentionPeriod=7d, -storageDataPath=/data]
          ports: [{containerPort: 9428}]
          volumeMounts: [{name: data, mountPath: /data}]
      volumes: [{name: data, emptyDir: {}}]
---
apiVersion: v1
kind: Service
metadata: {name: victorialogs, namespace: logging}
spec:
  selector: {app: victorialogs}
  ports: [{port: 9428}]
---
apiVersion: v1
kind: Namespace
metadata: {name: console}
EOF

for ns in team-a team-b; do kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -; done
kubectl -n team-a create deployment web --image=registry.k8s.io/pause:3.10 --replicas=2 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n team-b create deployment api --image=registry.k8s.io/pause:3.10 --dry-run=client -o yaml | kubectl apply -f -

# A user who may read logs in team-a only (the "view" ClusterRole includes pods/log).
kubectl -n team-a create serviceaccount team-a-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl -n team-a create rolebinding team-a-dev-view --clusterrole=view \
  --serviceaccount=team-a:team-a-dev --dry-run=client -o yaml | kubectl apply -f -

sed -e 's/<console-namespace>/console/g' \
  -e "s#ghcr.io/royal-road/logging-view-plugin:<logging-view-plugin-sha>#$IMAGE#g" \
  -e 's#<victorialogs-url>#http://victorialogs.logging.svc:9428#g' \
  -e 's/<console-pod-label-key>: <console-pod-label-value>/app: console/' \
  -e 's/<victorialogs-namespace>/logging/' \
  -e 's/<victorialogs-label-key>: <victorialogs-label-value>/app: victorialogs/' \
  "$DEPLOY" | kubectl apply -f -
# kind images are loaded, not pulled.
kubectl -n console patch deployment logging-view-plugin --type json -p '[
  {"op":"add","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"Never"},
  {"op":"add","path":"/spec/template/spec/containers/1/imagePullPolicy","value":"Never"}]'

kubectl -n logging rollout status deploy/victorialogs --timeout=180s
kubectl -n console rollout status deploy/logging-view-plugin --timeout=180s
kubectl -n team-a rollout status deploy/web --timeout=180s
kubectl -n team-b rollout status deploy/api --timeout=180s
