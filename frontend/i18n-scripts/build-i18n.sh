#!/usr/bin/env bash

set -exuo pipefail

i18next "public/!(dist)**/**/*.{js,jsx,ts,tsx}" [-oc] -c "./public/i18next-parser.config.js" -o "public/locales/\$LOCALE/\$NAMESPACE.json"

cd packages
for d in */ ; do
  i18next "${d}!(dist)**/**/*.{js,jsx,ts,tsx}" [-oc] -c "./../public/i18next-parser.config.js" -o "${d}locales/\$LOCALE/\$NAMESPACE.json"
done
