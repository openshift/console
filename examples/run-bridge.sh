#!/usr/bin/env bash

set -exo pipefail

./bin/bridge \
    --config=examples/config.yaml \
    --ca-file=examples/ca.crt \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint="$(oc whoami --show-server)" \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --public-dir=./frontend/public/dist \
    --k8s-mode-off-cluster-service-account-bearer-token-file=examples/token \
    --k8s-mode-off-cluster-alertmanager="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}')" \
    --k8s-mode-off-cluster-thanos="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}')" \
    $@
