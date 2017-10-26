#!/usr/bin/env bash

# We basically only check anchors that start with https:// to avoid false positives
URLS=$(git grep 'href="https://[^"]*"' -- 'frontend/public/*' | grep -o 'https://[^"]*"' | sed s'/.$//' | sort | uniq)

for url in $URLS; do
  curl -f -o /dev/null --silent "$url"
  # shellcheck disable=SC2181
  if [ $? -eq 0 ]
  then
    echo "good link: $url"
  else
    echo "BAD LINK: $url"
    exit 1
  fi
done
