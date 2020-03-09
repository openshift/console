#!/usr/bin/env bash

set -e

#
# USAGE:
#
# With env vars:
#   MYVAR=foo OTHERVAR=bar DOCKER_ENV=MYVAR,OTHERVAR ./builder-run.sh ./my-script --my-script-arg1 --my-script-arg2
#
# Without env vars:
#   ./builder-run.sh ./my-script --my-script-arg1 --my-script-arg2

BUILDER_IMAGE="quay.io/coreos/tectonic-console-builder:v20"

# forward whitelisted env variables to docker
ENV_STR=()
VOLUME_MOUNT=()
for VAR in ${DOCKER_ENV//,/ }; do
    if [ "$VAR" = 'KUBECONFIG' ]
    then
      VOLUME_MOUNT=("-v" "$KUBECONFIG:/kube/config")
      ENV_STR+=("-e" "KUBECONFIG=/kube/config")
    else
      ENV_STR+=("-e" "$VAR=${!VAR}")
    fi
done

docker run "${ENV_STR[@]}" --rm --net=host \
       --user="${BUILDER_RUN_USER}" \
       "${VOLUME_MOUNT[@]}" \
       -v "$(pwd)":/go/src/github.com/openshift/console \
       --shm-size=512m \
       -w /go/src/github.com/openshift/console \
       "$BUILDER_IMAGE" "$@"
