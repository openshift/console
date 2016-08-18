#!/bin/bash -ex
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT=$(dirname $SCRIPT_DIR)

docker build -t quay.io/coreosinc/soy-pg-test -f Dockerfile-pg-test $ROOT
