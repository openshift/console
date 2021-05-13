#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

while getopts v:s: flag
do
  case "${flag}" in
      v) VERSION=${OPTARG};;
      s) SPRINT=${OPTARG};;
      *) echo "usage: $0 [-v] [-s]" >&2
      exit 1;;
  esac
done

BRANCH=$(git branch  --show-current)

echo "Creating project with title \"[OCP $VERSION] UI Localization - Sprint $SPRINT/Branch $BRANCH\""

PROJECT_INFO=$(memsource project create --name "[OCP $VERSION] UI Localization - Sprint $SPRINT/Branch $BRANCH" --template-id 169304 -f json)
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.uid')

echo "Exporting PO files"
yarn export-pos
echo "Exported all PO files"

echo "Creating jobs for exported PO files"
for i in "${LANGUAGES[@]}"
do
  memsource job create --filenames po-files/"$i"/*.po --target-langs "$i" --project-id "${PROJECT_ID}"
done

echo "Uploaded PO files to Memsource"

# Clean up PO file directory
rm -rf po-files
