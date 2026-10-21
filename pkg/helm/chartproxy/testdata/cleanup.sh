#!/bin/bash
rm -rf ./chartstore-*
rm -rf ./ca.crt
rm -rf ./ca.key
rm -rf ./ca.srl
rm -rf ./cacert.pem
rm -rf ./server.crt
rm -rf ./server.csr
rm -rf ./server.key
GOOS=${GOOS:-$(go env GOOS)}
GOARCH=${GOARCH:-$(go env GOARCH)}
rm -rf ./$GOOS-$GOARCH
rm -rf ./chartmuseum.tar.gz