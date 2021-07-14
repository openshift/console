#!/bin/bash
#
# Usage:
#   ./hack/update-patternfly.sh [latest|prerelease]
#
set -e

TAG="${1:-prerelease}"

test -f package.json

echo "Update PatternFly libraries to $TAG"

yarn add -W \
        "patternfly@latest" \
        "patternfly-react@latest" \
        "@patternfly/patternfly@$TAG" \
        "@patternfly/react-catalog-view-extension@$TAG" \
        "@patternfly/react-charts@$TAG" \
        "@patternfly/react-core@$TAG" \
        "@patternfly/react-table@$TAG" \
        "@patternfly/react-tokens@$TAG" \
        "@patternfly/react-topology@$TAG" \
        "@patternfly/react-virtualized-extension@$TAG" \
        --exact
