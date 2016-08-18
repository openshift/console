#!/bin/bash -ex

GIT_SHA=$(git rev-parse HEAD)

docker push quay.io/coreosinc/soy-prod:$GIT_SHA
docker push quay.io/coreosinc/soy-migrator:$GIT_SHA
docker push quay.io/coreosinc/soy-dex:$GIT_SHA
