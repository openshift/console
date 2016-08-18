#!/bin/bash -ex

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$SCRIPT_DIR/unit-tests-docker.sh
$SCRIPT_DIR/build-docker-images.sh
$SCRIPT_DIR/push-images-to-quay.sh
$SCRIPT_DIR/push-assets.sh
