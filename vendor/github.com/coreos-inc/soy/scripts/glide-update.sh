#!/bin/bash -ex
glide up -u -s -v && glide vc --only-go --no-tests
