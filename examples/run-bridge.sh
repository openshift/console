#!/usr/bin/env bash

set -exuo pipefail

./bin/bridge \
    --config=examples/bridge-config.yaml \
    --ca-file=examples/ca.crt \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint="$(oc whoami --show-server)" \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --k8s-mode-off-cluster-service-account-bearer-token-file=examples/token \
    --k8s-mode-off-cluster-alertmanager="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}')" \
    --k8s-mode-off-cluster-thanos="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}')" \
    --public-dir=./frontend/public/dist \
    $@
