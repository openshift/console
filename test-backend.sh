#!/usr/bin/env bash

set -e

#
# Run all tests (not including functional)
#   ./test-backend.sh
#   ./test-backend.sh -v
#
# Run tests for one package
#   PKG=./unit ./test-backend.sh
#   PKG=ssh ./test-backend.sh
#

export GOBIN=${PWD}/bin:${GOBIN}

# Use deps from vendor dir.
export GOFLAGS="-mod=vendor"

# Invoke ./cover for HTML output
COVER=${COVER:-"-cover"}

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}

TESTABLE="./..."
FORMATTABLE=(cmd pkg)

# user has not provided PKG override
if [ -z "${PKG}" ]; then
	TEST=${TESTABLE}
	FMT=("${FORMATTABLE[@]}")

# user has provided PKG override
else
	# strip out slashes and dots from PKG=./foo/
	TEST=${PKG//\//}
	TEST=${TEST//./}

	# only run gofmt on packages provided by user
	FMT=("${TEST[@]}")
fi

# split TEST into an array and prepend repo path to each local package
read -ra split <<<"$TEST"
TEST=("${split[@]/#/github.com/openshift/console/}")

echo "Running tests..."
if [ "$OPENSHIFT_CI" = true ]; then
    go test -v "${COVER}" "$@" "${TEST[@]}" 2>&1 | tee /tmp/artifacts/test.out
    go-junit-report < /tmp/artifacts/test.out > /tmp/artifacts/junit.xml
else
    go test "${COVER}" "$@" "${TEST[@]}"
fi

echo "Checking gofmt..."
fmtRes=$(gofmt -l "${FMT[@]}")
if [ -n "${fmtRes}" ]; then
	echo -e "gofmt checking failed:\n${fmtRes}"
	exit 255
fi

echo "Checking govet..."
vetRes=$(go vet "${TEST[@]}")
if [ -n "${vetRes}" ]; then
	echo -e "govet checking failed:\n${vetRes}"
	exit 255
fi

echo "Success"
