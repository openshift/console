#!/bin/bash
curl -v \
    -H 'Content-Type: application.json' \
    -H 'Accept: application/json' \
    -H "Authorization: Bearer $QUAY_API_KEY" \
    'https://quay.io:443/api/v1/organization/coreos/robots' -XGET |\
    jq '.robots[]'
