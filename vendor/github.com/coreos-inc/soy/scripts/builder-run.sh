#!/bin/bash -e
#
# USAGE:
#
# With env vars:
#   MYVAR=foo OTHERVAR=bar DOCKER_ENV=MYVAR,OTHERVAR ./builder-run.sh ./my-script --my-script-arg1 --my-script-arg2
#
# Without env vars:
#   ./scripts/builder-run.sh ./my-script --my-script-arg1 --my-script-arg2


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $(realpath "$SCRIPT_DIR/../build-env")

# forward whitelisted env variables to docker
ENV_STR=""
for VAR in ${DOCKER_ENV//,/ }; do
    ENV_STR="$ENV_STR -e $VAR=${!VAR}"
done

BUILDER_IMAGE="$IMAGE_REGISTRY/$BUILDER_REPO:$BUILDER_TAG"
# docker pull "$BUILDER_IMAGE"
PROJECT=$(dirname $SCRIPT_DIR)
set -x
docker run $ENV_STR --rm -v $PROJECT:/go/src/${PROJECT_REPO} -w /go/src/$PROJECT_REPO $DOCKER_RUN_ARGS $BUILDER_IMAGE $@
