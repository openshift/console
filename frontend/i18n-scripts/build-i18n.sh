#!/usr/bin/env bash

set -exuo pipefail

FILE_PATTERN="{!(dist|node_modules)/**/*.{js,jsx,ts,tsx,json},*.{js,jsx,ts,tsx,json}}"

i18next "public/${FILE_PATTERN}" [-oc] -c "./i18next-parser.config.js" -o "public/locales/\$LOCALE/\$NAMESPACE.json"

cd packages
for d in */ ; do
  i18next "${d}${FILE_PATTERN}" [-oc] -c "../i18next-parser.config.js" -o "${d}locales/\$LOCALE/\$NAMESPACE.json"
done
