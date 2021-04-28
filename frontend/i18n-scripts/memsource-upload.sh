#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

# Before running this tool, you must first install the unofficial Memsource CLI client: https://github.com/unofficial-memsource/memsource-cli-client#pip-install
# You also have to configure it with your login info: https://github.com/unofficial-memsource/memsource-cli-client#configuration-red-hat-enterprise-linux-derivatives

# Example CLI usage for this script: yarn memsource-upload -v 4.8 -s "200"

while getopts v:s: flag
do
    case "${flag}" in
        v) VERSION=${OPTARG};;
        s) SPRINT=${OPTARG};;
        *) echo "usage: $0 [-v] [-s]" >&2
        exit 1;;
    esac
done

echo "Creating project with title \"[OCP $VERSION] UI Localization - Sprint $SPRINT\""

PROJECT_INFO=$(memsource project create --name "[OCP $VERSION] UI Localization - Sprint $SPRINT" --template-id 169304 -f json)
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.uid')

echo "Exporting PO files"
yarn export-pos
echo "Exported all PO files"

echo "Creating jobs for exported PO files"
for i in "${LANGUAGES[@]}"
do
  memsource job create --filenames po-files/$i/*.po --target-langs $i --project-id ${PROJECT_ID}
done

echo "Uploaded PO files to Memsource"

# Clean up PO file directory
rm -rf po-files
