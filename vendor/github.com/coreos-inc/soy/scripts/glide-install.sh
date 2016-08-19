#!/bin/bash -ex
glide install -u -s -v && glide vc --only-go --no-tests
