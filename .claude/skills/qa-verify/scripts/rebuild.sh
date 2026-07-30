#!/bin/bash
# rebuild.sh — Clean and rebuild frontend + backend in parallel
# Usage: rebuild.sh
# Runs clean then build for both frontend and backend concurrently.
# Exits non-zero if either build fails.
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "==> Cleaning..."
./clean-frontend.sh &
CLEAN_FE=$!
./clean-backend.sh &
CLEAN_BE=$!
wait $CLEAN_FE $CLEAN_BE

echo "==> Building frontend + backend in parallel..."
./build-frontend.sh &
BUILD_FE=$!
./build-backend.sh &
BUILD_BE=$!

FE_OK=0
BE_OK=0
wait $BUILD_FE || FE_OK=$?
wait $BUILD_BE || BE_OK=$?

if [ $FE_OK -ne 0 ]; then
  echo "ERROR: Frontend build failed (exit $FE_OK)" >&2
fi
if [ $BE_OK -ne 0 ]; then
  echo "ERROR: Backend build failed (exit $BE_OK)" >&2
fi

if [ $FE_OK -ne 0 ] || [ $BE_OK -ne 0 ]; then
  exit 1
fi

echo "==> Build complete"
