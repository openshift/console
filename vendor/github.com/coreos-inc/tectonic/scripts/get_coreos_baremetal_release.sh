#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."

source "$ROOT/scripts/common.env.sh"

mkdir -p "$TMP_DIR"
mkdir -p "$BAREMETAL_TMP_DIR"
mkdir -p "$BAREMETAL_RELEASE_DIR"

set -x
curl -L -o "$TMP_DIR/coreos-baremetal.tar.gz" "$BAREMETAL_RELEASE_URL"

tar -xzf "$TMP_DIR/coreos-baremetal.tar.gz" \
    --strip-components=1 \
    -C "$BAREMETAL_RELEASE_DIR" \
    $BAREMETAL_ARCHIVE_TOP_DIR/LICENSE \
    $BAREMETAL_ARCHIVE_TOP_DIR/bootcfg \
    $BAREMETAL_ARCHIVE_TOP_DIR/scripts \
    $BAREMETAL_ARCHIVE_TOP_DIR/contrib
