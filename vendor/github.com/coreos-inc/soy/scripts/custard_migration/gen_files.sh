#!/bin/bash
CUR="$(dirname $0)"

if [[ -z $TECTONIC_PG_TECTONIC_USER || -z $TECTONIC_PG_TECTONIC_PASS || \
    -z $TECTONIC_PG_TECTONIC_HOST || -z $TECTONIC_PG_TECTONIC_PORT || \
    -z $TECTONIC_PG_TECTONIC_DATABASE || -z $QUAY_API_KEY ]]; then

    echo "Must set
\$TECTONIC_PG_TECTONIC_USER
\$TECTONIC_PG_TECTONIC_PASS
\$TECTONIC_PG_TECTONIC_HOST
\$TECTONIC_PG_TECTONIC_PORT
\$TECTONIC_PG_TECTONIC_DATABASE
\$QUAY_API_KEY"
    exit 1

fi

$CUR/dump_accounts_full.sh > $CUR/files/accounts_all.csv
$CUR/dump_purchases_full.sh > $CUR/files/purchases_all.csv
$CUR/robot_accounts.sh > $CUR/files/robots_accounts.json

