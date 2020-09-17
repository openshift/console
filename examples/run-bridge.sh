#!/usr/bin/env bash

set -exuo pipefail

myIP=$(hostname -I | awk '{print $1}')
k8sIP='172.22.6.2'

BRIDGE_K8S_AUTH_BEARER_TOKEN=$(ssh root@$k8sIP "secretname=\$(kubectl get serviceaccount default --namespace=kube-system -o jsonpath='{.secrets[0].name}'); kubectl get secret "\$secretname" --namespace=kube-system -o template --template='{{.data.token}}' | base64 --decode; ")

PROM_PORT='9090'

./bin/bridge \
    --listen=https://$myIP:9000 \
    --base-address=https://$myIP:9000 \
    --tls-cert-file=tls/tls.crt \
    --tls-key-file=tls/tls.key \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=https://$k8sIP:6443 \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --k8s-auth=bearer-token \
    --k8s-auth-bearer-token=${BRIDGE_K8S_AUTH_BEARER_TOKEN} \
    --public-dir=./frontend/public/dist \
    --user-auth=disabled \
    --k8s-mode-off-cluster-prometheus=http://$k8sIP:$PROM_PORT/api  \
    --k8s-mode-off-cluster-alertmanager=http://$k8sIP:$PROM_PORT/api \
    --k8s-mode-off-cluster-thanos=http://$k8sIP:$PROM_PORT/api
