#!/usr/bin/env bash

set -e

./test-backend.sh
./test-frontend.sh
./test-demos.sh
