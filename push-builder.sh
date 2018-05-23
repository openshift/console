#!/usr/bin/env bash

set -e

# This script pushes the builder docker image to quay.io. You'll need
# it when you introduce new build-time dependencies or change go
# versions, etc.

if [ -z "${DOCKER_TAG}" ]; then
    echo "Please provide DOCKER_TAG env var and try again."
    exit 1
fi

DOCKER_IMAGE=quay.io/coreos/tectonic-console-builder:${DOCKER_TAG}

docker build --rm=true -t "${DOCKER_IMAGE}" - < Dockerfile-builder
docker push "${DOCKER_IMAGE}"

echo "Pushed ${DOCKER_IMAGE}"
