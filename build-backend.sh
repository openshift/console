#!/usr/bin/env bash

set -e

# Builds the server-side golang resources for tectonic-console. For a
# complete build, you must also run build-frontend

# Use deps from vendor dir.
export GOFLAGS="-mod=vendor"

GIT_TAG=${SOURCE_GIT_TAG:-$(git describe --always --tags HEAD)}
LD_FLAGS="-w -X github.com/openshift/console/pkg/version.Version=${GIT_TAG}"

go build -ldflags "${LD_FLAGS}" -o bin/bridge github.com/openshift/console/cmd/bridge

# get json file of k8s api resource 
mkdir tmp
echo "clone from git reposit of resource-schema"
git clone https://github.com/tmax-cloud/resource-schema.git ./tmp
echo "move json file from tmp folder"
cp -r ./tmp/management ./tmp/network ./tmp/storage ./tmp/workload ./api
echo "delete tmp folder"
rm -rf ./tmp 