#!/bin/bash
set -eu

PACKAGE_NAME="$1"

LATEST_VERSION=$(npm view "$PACKAGE_NAME" dist-tags.latest)
LATEST_TARBALL=$(npm pack "${PACKAGE_NAME}@${LATEST_VERSION}" 2>/dev/null)
OUTPUT_DIR="dist/published-$(echo "$LATEST_TARBALL" | cut -f -3 -d '.')"

mkdir -p "$OUTPUT_DIR" && rm -rf "$OUTPUT_DIR/*"
tar -xzf "$LATEST_TARBALL" -C "$OUTPUT_DIR"
rm -f "$LATEST_TARBALL"

echo "$OUTPUT_DIR"
