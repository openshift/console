#!/bin/bash
rm -rf ./chartstore-*
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
rm -rf ./$GOOS-$GOARCH
rm -rf ./chartmuseum.tar.gz