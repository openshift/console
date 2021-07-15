#!/bin/bash
#
# Usage:
#   scripts/update-patternfly.sh [tag]
#
# tag: latest or prerelease, prerelease by default
#
set -e

TAG="${1:-prerelease}"

test -f package.json

echo "Update PatternFly libraries to $TAG"

yarn add -W \
        "patternfly@latest" \
        "@patternfly/patternfly@$TAG" \
        "@patternfly/react-catalog-view-extension@$TAG" \
        "@patternfly/react-charts@$TAG" \
        "@patternfly/react-core@$TAG" \
        "@patternfly/react-table@$TAG" \
        "@patternfly/react-tokens@$TAG" \
        "@patternfly/react-topology@$TAG" \
        "@patternfly/react-virtualized-extension@$TAG" \
        "@patternfly/quickstarts@latest" \
        --exact
