#!/usr/bin/env bash

set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

# Run `yarn analyze` and save the report as artifacts in CI.

cd frontend
echo "Analyzing Webpack bundles..."
yarn run analyze --no-open
if [ -d "$ARTIFACT_DIR" ]; then
  echo "Copying the Webpack Bundle Analyzer report to $ARTIFACT_DIR..."
  cp public/dist/report.html "${ARTIFACT_DIR}"
fi

MAX_BYTES=3145728 # ~3 MiB
VENDORS_MAIN_BYTES=$(jq -r '.assets[] | select(.name | match("^vendors~main-chunk.*js$")) | .size' public/dist/stats.json)
DISPLAY_VALUE=$(awk "BEGIN {printf \"%.2f\n\", $VENDORS_MAIN_BYTES/1024/1024}")
MAX_DISPLAY_VALUE=$(awk "BEGIN {printf \"%.2f\n\", $MAX_BYTES/1024/1024}")

echo "Main vendor bundle size: $DISPLAY_VALUE MiB"
if (( VENDORS_MAIN_BYTES > MAX_BYTES )); then
  echo "FAILURE: Main vendor bundle is larger than the $MAX_DISPLAY_VALUE MiB limit."
  echo "If you haven't added a new dependency, an import might have accidentally pulled an existing dependency into the main vendor bundle."
  echo "If adding a large dependency, consider lazy loading the component with AsyncComponent."
  exit 1
fi
