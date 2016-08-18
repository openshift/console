#!/bin/bash -ex

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

go run "$SCRIPT_DIR/bf-catalog.go" create-units "$SCRIPT_DIR/definitions/units.json"

products=(aggregating premium-managed-linux professional-services quay-enterprise tectonic-enterprise tectonic-lab tectonic-starter training)
for product in ${products[@]}; do
    go run "$SCRIPT_DIR/bf-catalog.go" \
        create-rate-plans \
        --create-product=true \
        "$SCRIPT_DIR/definitions/$product/product.json" \
        $(find "$SCRIPT_DIR/definitions/$product/plans" -name "*.json" | \
            grep -v 'deleted')
done
