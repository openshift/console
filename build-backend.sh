#!/usr/bin/env bash

set -e

# Builds the server-side golang resources for tectonic-console. For a
# complete build, you must also run build-frontend

PROJECT_DIR=$(basename ${PWD})

GIT_TAG=`git describe --always --tags HEAD`
LD_FLAGS="-w -X github.com/openshift/console/version.Version=${GIT_TAG}"

CGO_ENABLED=0 go build -ldflags "${LD_FLAGS}" -o bin/bridge github.com/openshift/console/cmd/bridge
