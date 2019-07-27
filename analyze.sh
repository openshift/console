#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

# Run `yarn analyze` and save the report as artifacts in CI.

pushd frontend
yarn run analyze --no-open
if [ -d "$ARTIFACT_DIR" ]; then
  echo "Copying the Webpack Bundle Analyzer report to $ARTIFACT_DIR..."
  cp public/dist/report.html "${ARTIFACT_DIR}"
fi
# Print chunk sizes, largest first.
jq -r '.assets|sort_by(.size)|reverse|.[]|select(.name|test("js$"))|"\(.size/1024|ceil) KiB => \(.name)"' public/dist/stats.json
popd
