#!/usr/bin/env bash

set -exuo pipefail

myIP=$(hostname -I | awk '{print $1}')

k8sIP='220.90.208.100'
# k8sIP='192.168.6.197'
BRIDGE_K8S_AUTH_BEARER_TOKEN=$(ssh root@$k8sIP "secretname=\$(kubectl get serviceaccount default --namespace=kube-system -o jsonpath='{.secrets[0].name}'); kubectl get secret "\$secretname" --namespace=kube-system -o template --template='{{.data.token}}' | base64 --decode; ")

# k8sIP='kubernetes.docker.internal'
# secretname=$(kubectl get serviceaccount default -n kube-system -o jsonpath='{.secrets[0].name}')
# echo secretname
# BRIDGE_K8S_AUTH_BEARER_TOKEN=$(kubectl get secret $secretname -n kube-system  -o template --template='{{.data.token}}' | base64 --decode )

# Should verify port number which corresponding to service in yourself!!
PROM_PORT='9090'
GRAFANA_PORT='30997'
HC_PORT='33333'
MHC_PORT='31430'

./bin/bridge \
    --listen=https://$myIP:9000 \
    --base-address=https://$myIP:9000 \
    --tls-cert-file=tls/tls.crt \
    --tls-key-file=tls/tls.key \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=https://$k8sIP:6443 \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --k8s-auth-bearer-token=${BRIDGE_K8S_AUTH_BEARER_TOKEN} \
    --public-dir=./frontend/public/dist \
    --k8s-mode-off-cluster-prometheus=http://$k8sIP:$PROM_PORT/api  \
    --k8s-mode-off-cluster-alertmanager=http://$k8sIP:$PROM_PORT/api \
    --k8s-mode-off-cluster-thanos=http://$k8sIP:$PROM_PORT/api \
    --keycloak-realm=tmax \
    --keycloak-auth-url=https://testauth.tmaxcloud.com/auth/ \
    --keycloak-client-id=hypercloud4 \
    --grafana-endpoint=http://$k8sIP:$GRAFANA_PORT/api/grafana/ \
    --kiali-endpoint=https://172.22.6.22/api/kiali/ \
    --webhook-endpoint=https://$k8sIP:31317/api/webhook/ \
    --hypercloud-endpoint=http://$k8sIP:$HC_PORT/ \
    --multi-hypercloud-endpoint=http://$k8sIP:$MHC_PORT/ \
    --user-auth=hypercloud \
    --k8s-auth=hypercloud \
    --mc-mode=true \
    --release-mode=false \
    # --mc-mode-operator=true \
    # --k8s-auth=bearer-token \
    # --mc-mode-file="$HOME/dynamic-config.yaml" \
