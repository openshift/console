#!/bin/bash -ex

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

DOCKER_ENV=S3_CDN_KEY,S3_CDN_SECRET DOCKER_RUN_ARGS='-w /go/src/github.com/coreos-inc/soy/creme' $SCRIPT_DIR/builder-run.sh './deploy-assets'
