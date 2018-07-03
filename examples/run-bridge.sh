#!/bin/bash -e

./bin/bridge \
    --base-address=http://localhost:9000 \
    --ca-file=examples/ca.crt \
    --k8s-auth=openshift \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=$OPENSHIFT_API \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --listen=http://127.0.0.1:9000 \
    --public-dir=./frontend/public/dist \
    --user-auth=openshift \
    --user-auth-oidc-client-id=tectonic-console \
    --user-auth-oidc-client-secret=$OAUTH_SECRET \
    --user-auth-oidc-issuer-url=$OPENSHIFT_API
    --logo-image-name=origin
