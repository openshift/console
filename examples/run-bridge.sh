#!/usr/bin/env bash

set -exuo pipefail

myIP=$(hostname -I | awk '{print $1}')

# Default K8S Endpoint is public POC environment 
k8sIP='220.90.208.100' 
#k8sIP='172.23.4.201' 
BRIDGE_K8S_AUTH_BEARER_TOKEN=$(ssh root@$k8sIP "secretname=\$(kubectl get serviceaccount console-system-admin --namespace=console-system -o jsonpath='{.secrets[0].name}'); kubectl get secret "\$secretname" --namespace=console-system -o template --template='{{.data.token}}' | base64 --decode; ")
#BRIDGE_K8S_AUTH_BEARER_TOKEN=$(ssh root@$k8sIP "secretname=\$(kubectl get serviceaccount default --namespace=kube-system -o jsonpath='{.secrets[0].name}'); kubectl get secret "\$secretname" --namespace=kube-system -o template --template='{{.data.token}}' | base64 --decode; ")


# Should verify port number which corresponding to Service in yourself!!
PROM_PORT='9090'
GRAFANA_PORT='30997'
HC_PORT='32440'
MHC_PORT='32440'
KIBANA_PORT='31005'

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
    --kibana-endpoint=https://$k8sIP:$KIBANA_PORT/api/kibana/ \
    --user-auth=hypercloud \
    --k8s-auth=hypercloud \
    --mc-mode=true \
    --release-mode=true \
    # --mc-mode-operator=true \
    # --k8s-auth=bearer-token \
    # --mc-mode-file="$HOME/dynamic-config.yaml" \
