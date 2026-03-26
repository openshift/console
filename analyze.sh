#!/usr/bin/env bash

set -euo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

# Run `yarn analyze` and save the report as artifacts in CI.

cd frontend
echo "Analyzing Webpack bundles..."
ANALYZE_RC=0
yarn run analyze || ANALYZE_RC=$?
if [ -d "$ARTIFACT_DIR" ]; then
  echo "Copying the Webpack Bundle Analyzer report to $ARTIFACT_DIR..."
  cp public/dist/report.html "${ARTIFACT_DIR}"
fi
if [ $ANALYZE_RC -ne 0 ]; then
  echo "If you haven't added a new dependency, an import might have accidentally pulled an existing dependency into the main vendor bundle."
  echo "If adding a large dependency, consider lazy loading the component with AsyncComponent."
  exit 1
fi
