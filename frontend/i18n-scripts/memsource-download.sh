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

# Memsource job listing is limited to 50 jobs per page
# We need to pull all the files down by page and stop when we reach a page with no data
for i in "${LANGUAGES[@]}"
do
  COUNTER=0
  CURRENT_PAGE=$(memsource job list --project-id $PROJECT_ID --target-lang $i -f value --page-number 0 -c uid | tr '\n' ' ')
  until [ -z "$CURRENT_PAGE" ]
  do
    ((COUNTER++))
    echo Downloading page $COUNTER
    memsource job download --project-id $PROJECT_ID --output-dir downloaded_po_files/$i --job-id $CURRENT_PAGE
    CURRENT_PAGE=$(memsource job list --project-id $PROJECT_ID --target-lang $i -f value --page-number $COUNTER -c uid | tr '\n' ' ')
  done
done

# Memsource gives us weird file names back, so we need to clean them up
# in order to use our existing name-based sorting mechanism.
echo Cleaning up files
cd downloaded_po_files
for i in "${LANGUAGES[@]}"
do
  cd $i
  rename 's/%3D/=/' *
  cd ..
done
cd ..

echo Importing downloaded PO files into OpenShift
for i in "${LANGUAGES[@]}"
do
  # We don't treat zh-cn as a dialect in i18next right now, so we need to alter it to zh
  if [ $i == 'zh-cn' ]
  then
    yarn po-to-i18n -d downloaded_po_files/$i -l 'zh'
  else
    yarn po-to-i18n -d downloaded_po_files/$i -l $i
  fi
done

# Clean up PO file directory
rm -rf downloaded_po_files

echo Creating PR
git checkout master
git checkout -b translation-update
git add *
git commit -m "UI Translation update"
git push -u origin head
gh pr create --title "UI Translation update" --body "Adding latest translations for all languages from Memsource project id #$PROJECT_ID" --fill
git branch -d translation-update
