#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/common.env.sh"

SED_FLAGS=""
if [ "$(uname)" == "Darwin" ]; then
    SED_FLAGS="-i.bak  -E"
else
    SED_FLAGS="-i -r"
fi

main() {
    TARGET_MANIFEST="$1"
    TARGET_VERSION="$2"
    REGEX=""

    # we do console and support separately because their versioning is done outside
    # this repository
    if [[ $TARGET_MANIFEST == *"tectonic-console"* ]]; then
        NEW_VERSION="$(jq -r '.versions.external_docker_tags["tectonic-console"]' $VERSIONS_MANIFEST)"
    elif [[ $TARGET_MANIFEST == *"tectonic-support"* ]]; then
        NEW_VERSION="$(jq -r '.versions.external_docker_tags["tectonic-support"]' $VERSIONS_MANIFEST)"
    else # Any other manifest gets the version supplied via args
        NEW_VERSION="$TARGET_VERSION"
    fi
    REGEX="s|\{\{\.componentVersion\}\}|${NEW_VERSION}|g"
    sed $SED_FLAGS "$REGEX" "$TARGET_MANIFEST"
    rm -f "${TARGET_MANIFEST}.bak"
}

main $@
