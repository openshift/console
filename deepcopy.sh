#!/usr/bin/env bash
set -e

HACK_DIR="$( cd "$( dirname "${0}" )" && pwd -P)"; export HACK_DIR
# REPO_ROOT=${HACK_DIR}/..

# rm -rf "${REPO_ROOT}"/vendor
# go mod vendor
# chmod +x "${REPO_ROOT}"/vendor/k8s.io/code-generator/*.sh

deepcopy-gen \
--input-dirs /home/jinsoo/hypercloud-console5.0/pkg/config/dynamic \
--output-package github.com/openshift/console \
-O zz_generated.deepcopy --go-header-file "${HACK_DIR}"/boilerplate.go.tmpl

# cp -r "${REPO_ROOT}"/"${TRAEFIK_MODULE_VERSION:?}"/* "${REPO_ROOT}"; rm -rf "${REPO_ROOT}"/"${TRAEFIK_MODULE_VERSION:?}"

# rm -rf "${REPO_ROOT}"/vendor
