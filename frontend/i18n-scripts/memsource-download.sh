#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

while getopts p: flag
do
  case "${flag}" in
      p) PROJECT_ID=${OPTARG};;
      *) echo "usage: $0 [-p]" >&2
      exit 1;;
  esac
done

echo "Checking if git workspace is clean"
GIT_STATUS="$(git status --short --untracked-files -- public/locales packages/**/locales)"
if [ -n "$GIT_STATUS" ]; then
  echo "There are uncommitted files in public or package locales folders. Remove or commit the files, then run this script again."
  git diff
  exit 1
fi

echo "Downloading PO files from Project ID \"$PROJECT_ID\""

DOWNLOAD_PATH="$(mktemp -d)" || { echo "Failed to create temp folder"; exit 1; }

# Memsource job listing is limited to 50 jobs per page
# We need to pull all the files down by page and stop when we reach a page with no data
for i in "${LANGUAGES[@]}"
do
  COUNTER=0
  CURRENT_PAGE=( $(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number 0 -c uid) )
  until [ -z "$CURRENT_PAGE" ]
  do
    ((COUNTER++))
    echo Downloading page "$COUNTER"
    memsource job download --project-id "$PROJECT_ID" --output-dir "$DOWNLOAD_PATH/$i" --job-id "${CURRENT_PAGE[@]}"
    CURRENT_PAGE=$(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number "$COUNTER" -c uid | tr '\n' ' ')
  done
done

echo Importing downloaded PO files into OpenShift
for i in "${LANGUAGES[@]}"
do
  # We don't treat zh-cn as a dialect in i18next right now, so we need to alter it to zh
  if [ "$i" == 'zh-cn' ]
  then
    yarn po-to-i18n -d "$DOWNLOAD_PATH/$i" -l 'zh'
  else
    yarn po-to-i18n -d "$DOWNLOAD_PATH/$i" -l "$i"
  fi
done

echo Creating commit
git add public/locales
git add packages/**/locales
git commit -m "chore(i18n): update translations

Adding latest translations from Memsource project https://cloud.memsource.com/web/project2/show/$PROJECT_ID"
