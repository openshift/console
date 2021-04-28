#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

for f in public/locales/en/* ; do
  for i in "${LANGUAGES[@]}"
  do
  yarn i18n-to-po -f "$(basename "$f" .json)" -l "$i"
  done
done

cd packages
for d in */ ; do
  if [ -d "$d/locales/en" ]
  then
    for f in "$d"/locales/en/* ; do
      for i in "${LANGUAGES[@]}"
      do
        yarn i18n-to-po -p "$d" -f "$(basename "$f" .json)" -l "$i"
      done
    done
  fi
done
