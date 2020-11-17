#!/usr/bin/env bash

set -exuo pipefail

for f in public/locales/en/* ; do
  yarn i18n-to-po -f $(basename "$f" .json) -l zh
  yarn i18n-to-po -f $(basename "$f" .json) -l ja
done

cd packages
for d in */ ; do
  if [ -d "$d/locales/en" ]
  then
    for f in $d/locales/en/* ; do
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l zh
      yarn i18n-to-po -p "$d" -f $(basename "$f" .json) -l ja
    done
  fi
done

cd ..
# remove po files that don't contain untranslated strings
# so we only send the translation team what's necessary
grep -r -L -Z 'msgstr ""' po-files | xargs rm
