#!/bin/bash -e

OPENSHIFT_API="https://ec2-54-91-246-166.compute-1.amazonaws.com:8443"

../../bin/bridge \
    --base-address=http://localhost:9000 \
    --ca-file=ca.crt \
    --k8s-auth=openshift \
    --k8s-mode=off-cluster \
    --k8s-mode-off-cluster-endpoint=$OPENSHIFT_API \
    --k8s-mode-off-cluster-skip-verify-tls=true \
    --listen=http://127.0.0.1:9000 \
    --public-dir=../../frontend/public/dist \
    --user-auth=openshift \
    --user-auth-oidc-client-id=tectonic-console \
    --user-auth-oidc-client-secret=$OAUTH_SECRET \
    --user-auth-oidc-issuer-url=$OPENSHIFT_API
