#!/usr/bin/env bash

set -u

PUBLIC_PATH="$1/${BUNDLER:-webpack}"
shift
SERVER_OPTS="$@"

./node_modules/.bin/http-server $PUBLIC_PATH -p 9001 -c-1 --cors $SERVER_OPTS
