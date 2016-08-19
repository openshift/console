#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/common.env.sh"

if [ $# = 0 ]; then
    echo "Must provide one argument: component's directory (identity, manager, postgres, etc)"
    exit 1
fi

jq -r \
    --arg component $1 \
    '.validation.docker_base_images[$component]' \
    $VERSIONS_MANIFEST
