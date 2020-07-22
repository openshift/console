#!/usr/bin/env bash

find frontend -type d -name 'node_modules' -prune -exec rm -rf {} \;
rm -rf frontend/.cache-loader
rm -rf frontend/public/dist
