#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/awsutil.sh"
source "$ROOT/scripts/common.env.sh"

check_aws_creds

echo "Retrieving coreos-baremetal release"
"$ROOT/scripts/get_coreos_baremetal_release.sh"

echo "Retrieving bootstrap binaries"
"$ROOT/scripts/get_bootstrap_bins.sh"

tar -cvzf "$TECTONIC_RELEASE_TARBALL_FILE" -C "$TECTONIC_RELEASE_DIR" .

echo "Release tarball is available at $PWD/$TECTONIC_RELEASE_TARBALL_FILE"

