#!/usr/bin/env bash

set -exuo pipefail

myIP=$(ipconfig | grep "IPv4" -a | head -1 | awk '{print $NF}')
k8sIP='172.22.6.2'

nodePorts=$(ssh root@$k8sIP "
    HC_PORT=\$(kubectl get svc -n hypercloud4-system hypercloud4-operator-service | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    PROM_PORT=\$(kubectl get svc -n monitoring prometheus-k8s | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    GRAFANA_PORT=\$(kubectl get svc -n monitoring grafana | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    KIALI_PORT=\$(kubectl get svc -n istio-system kiali | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    JAEGER_PORT=\$(kubectl get svc -n istio-system tracing | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    APPROVAL_PORT=\$(kubectl get svc -n approval-system approval-proxy-server | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    VNC_PORT=\$(kubectl get svc -n kubevirt virtvnc | awk '{print \$5}' | awk 'match(\$0, /:[0-9]+\//){print substr(\$0,RSTART+1,RLENGTH-2)}');
    echo \"HC_PORT=\$HC_PORT PROM_PORT=\$PROM_PORT GRAFANA_PORT=\$GRAFANA_PORT KIALI_PORT=\$KIALI_PORT JAEGER_PORT=\$JAEGER_PORT APPROVAL_PORT=\$APPROVAL_PORT VNC_PORT=\$VNC_PORT;\"
")

./bin/bridge \
    --listen=http://$myIP:9000 \
    --base-address=http://$myIP:9000 \
    --tls-cert-file=tls/tls.crt \
    --tls-key-file=tls/tls.key \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=https://$k8sIP:6443 \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --k8s-auth=bearer-token \
    --k8s-auth-bearer-token=@@ \
    --public-dir=./frontend/public/dist \
    --user-auth=disabled \
    --k8s-mode-off-cluster-prometheus=http://$k8sIP:$PROM_PORT/api  \
    --k8s-mode-off-cluster-alertmanager=http://$k8sIP:$PROM_PORT/api \
    --k8s-mode-off-cluster-thanos=http://$k8sIP:$PROM_PORT/api
