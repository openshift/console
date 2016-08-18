#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."

VERSIONS_MANIFEST="$ROOT/versions-manifest.json"

TECTONIC_RELEASE_VERSION="$(jq -r '.versions.tectonic_release' $VERSIONS_MANIFEST)"
TECTONIC_RELEASE_TARBALL_FILE="tectonic-$TECTONIC_RELEASE_VERSION.tar.gz"

WORKSPACE_DIR="$ROOT/.workspace"
TMP_DIR="$WORKSPACE_DIR/tmpdir"
BAREMETAL_TMP_DIR="$TMP_DIR/coreos-baremetal"

TECTONIC_RELEASE_DIR="$WORKSPACE_DIR/$TECTONIC_RELEASE_VERSION"
TECTONIC_RELEASE_TOP_DIR="$TECTONIC_RELEASE_DIR/tectonic"
BAREMETAL_RELEASE_DIR="$TECTONIC_RELEASE_TOP_DIR/coreos-baremetal"
BOOTSTRAP_RELEASE_DIR="$TECTONIC_RELEASE_TOP_DIR/tectonic-installer"

BAREMETAL_RELEASE_VERSION="$(jq -r '.versions.coreos_baremetal' $VERSIONS_MANIFEST)"
BAREMETAL_RELEASE_URL="https://github.com/coreos/coreos-baremetal/releases/download/${BAREMETAL_RELEASE_VERSION}/coreos-baremetal-${BAREMETAL_RELEASE_VERSION}-linux-amd64.tar.gz"
BAREMETAL_ARCHIVE_TOP_DIR="coreos-baremetal-${BAREMETAL_RELEASE_VERSION}-linux-amd64"

