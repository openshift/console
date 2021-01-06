#!/usr/bin/env bash

set -exuo pipefail

for f in public/locales/en/* ; do
  yarn i18n-to-po -f $(basename "$f" .json) -l zh-cn
  yarn i18n-to-po -f $(basename "$f" .json) -l zh-tw
  yarn i18n-to-po -f $(basename "$f" .json) -l ja
  yarn i18n-to-po -f $(basename "$f" .json) -l ko
done

cd packages
for d in */ ; do
  if [ -d "$d/locales/en" ]
  then
    for f in $d/locales/en/* ; do
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l zh-cn
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l zh-tw
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l ja
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l ko
    done
  fi
done
