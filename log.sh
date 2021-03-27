#!/bin/bash

output=CHANGELOG.md
timestamp=`date`
version=$1
prev_version=$2

if [ -z $version ]; then
version=5.0.0.x
fi

if [ -z $prev_version ]; then
prev_version=5.0.0.0
fi

echo '# hypercloud-console patch note' > ./docs-internal/CHANGELOG.md
echo "${version}" >> ./docs-internal/CHANGELOG.md
echo "${prev_version}" >> ./docs-internal/CHANGELOG.md
