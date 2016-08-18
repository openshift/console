#!/bin/bash -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$DIR/.."
source "$ROOT/scripts/common.env.sh"

echo "Validating"
$DIR/validate.sh
echo

echo "Validation succeeded, tagging release"
echo

echo "Using $TECTONIC_RELEASE_VERSION as tag"
git tag -s $TECTONIC_RELEASE_VERSION
echo

echo "Tagged! Current tags:"
git tag -l
