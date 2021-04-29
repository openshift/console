#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

# Before running this tool, you must first install the unofficial Memsource CLI client: https://github.com/unofficial-memsource/memsource-cli-client#pip-install
# You also have to configure it with your login info: https://github.com/unofficial-memsource/memsource-cli-client#configuration-red-hat-enterprise-linux-derivatives

# You must also install the GitHub command line utility: brew install gh
# On MacOS, you must also install rename, a GNU command line utility: brew install rename

# Example CLI usage for this script: yarn memsource-download -p 6sB6qwpbRkGCeBQq4hUyK1
# The project ID can be obtained from the Memsource project URL
# (the series of numbers and letters after /show/)
# i.e. https://cloud.memsource.com/web/project2/show/FBfZeTEWPYaC4VXhgrW0R2

while getopts p: flag
do
    case "${flag}" in
        p) PROJECT_ID=${OPTARG};;
        *) echo "usage: $0 [-p]" >&2
        exit 1;;
    esac
done

echo "Downloading PO files from Project ID \"$PROJECT_ID\""


# Clean up PO file directory
rm -rf downloaded_po_files

echo Creating PR
git checkout -b translation-update
git add *
git commit -m "UI Translation update"
git push -u origin head
gh pr create --title "UI Translation update" --body "Adding latest translations for all languages from Memsource project id #$PROJECT_ID" --fill
git branch -d translation-update
