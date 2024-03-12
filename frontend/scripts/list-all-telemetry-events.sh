#!/bin/bash

find public packages -type f -name '*.js?' -o -name '*.ts?' \
    | grep -v __tests__ \
    | grep -v '\.spec' \
    | xargs grep "fireTelemetryEvent('.*'," -oh \
    | sed -e "s/^fireTelemetryEvent('//g;s/',$//g" \
    | sort -u
