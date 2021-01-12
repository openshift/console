#!/usr/bin/env bash

set -e 
DOCKER_REGISTRY="tmaxcloudck"
PRODUCT="hypercloud-console"
MAJOR_VERSION="0"
MINOR_VERSION="5"
PATCH_VERSION="0"
HOTFIX_VERSION="0"

#build docker image 
docker build --rm=true -t ${DOCKER_REGISTRY}/${PRODUCT}:${MAJOR_VERSION}.${MINOR_VERSION}.${PATCH_VERSION}.${HOTFIX_VERSION} -f ./Dockerfile .

docker push ${DOCKER_REGISTRY}/${PRODUCT}:${MAJOR_VERSION}.${MINOR_VERSION}.${PATCH_VERSION}.${HOTFIX_VERSION}