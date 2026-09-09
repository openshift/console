#!/usr/bin/env bash

set -exuo pipefail

FILE_PATTERN="{!(dist|node_modules)/**/*.{js,jsx,ts,tsx,json},*.{js,jsx,ts,tsx,json}}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
I18NEXT="${SCRIPT_DIR}/../node_modules/.bin/i18next"

"$I18NEXT" "public/${FILE_PATTERN}" [-oc] -c "./i18next-parser.config.js" -o "public/locales/\$LOCALE/\$NAMESPACE.json"

cd packages
for d in */ ; do
  "$I18NEXT" "${d}${FILE_PATTERN}" [-oc] -c "../i18next-parser.config.js" -o "${d}locales/\$LOCALE/\$NAMESPACE.json"
done
