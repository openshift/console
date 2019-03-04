#!/usr/bin/env bash

set -exuo pipefail

./bin/bridge \
    --base-address=http://localhost:9000 \
    --ca-file=examples/ca.crt \
    --k8s-auth=openshift \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=$(oc whoami --show-server) \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --listen=http://127.0.0.1:9000 \
    --public-dir=./frontend/public/dist \
    --user-auth=openshift \
    --user-auth-oidc-client-id=console-oauth-client \
    --user-auth-oidc-client-secret-file=examples/console-client-secret \
    --user-auth-oidc-ca-file=examples/ca.crt
