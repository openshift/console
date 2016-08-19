# https://stackoverflow.com/questions/18136918/how-to-get-current-relative-directory-of-your-makefile
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(patsubst %/,%,$(dir $(current_dir)) )

QUAY_ORG = coreos
MANAGER_IMAGE = tectonic-manager
DOCKER = docker
TECTONIC_VERSION = $(shell /bin/sh $(project_dir)/git-version)

# Directories used in targets
SCRIPTS_DIR = $(project_dir)/scripts
WORKSPACE = $(current_dir)/.workspace
TEC_DIR = $(WORKSPACE)/tec
KUBE_DIR = $(WORKSPACE)/kube

# Temp dirs
TMP_DIR = $(WORKSPACE)/tmpdir
MANAGER_MANIFESTS_TMP_DIR = $(TMP_DIR)/manifests/manager
DEPLOY_MANIFESTS_TMP_DIR = $(TMP_DIR)/manifests/manager-deployed
DASHBOARDS_TMP_DIR = $(TMP_DIR)/grafana-dashboards

# Directories containing sources
COMMON_DIR = $(project_dir)/common
MANIFESTS_DIR = $(COMMON_DIR)/manifests
MANAGER_MANIFESTS_SRC_DIR = $(MANIFESTS_DIR)/manager
DEPLOY_MANIFESTS_SRC_DIR = $(MANIFESTS_DIR)/manager-deployed
DASHBOARDS_SRC_DIR = $(COMMON_DIR)/grafana-dashboards

# Files which we rebuild based on modtimes for
MANAGER_MANIFESTS_SRC_FILES := $(shell find $(MANAGER_MANIFESTS_SRC_DIR) -name "*.yaml")
DEPLOY_MANIFESTS_SRC_FILES := $(shell find $(DEPLOY_MANIFESTS_SRC_DIR) -name "*.yaml")
DASHBOARDS_SRC := $(shell find $(DASHBOARDS_SRC_DIR) -name "*.json")
GO_FILES := $(shell find $(current_dir) -name '*.go')

MANAGER_MANIFESTS_TMP := $(patsubst $(MANAGER_MANIFESTS_SRC_DIR)/%.yaml,$(MANAGER_MANIFESTS_TMP_DIR)/%.yaml,$(MANAGER_MANIFESTS_SRC_FILES))
DEPLOY_MANIFESTS_TMP := $(patsubst $(DEPLOY_MANIFESTS_SRC_DIR)/%.yaml,$(DEPLOY_MANIFESTS_TMP_DIR)/%.yaml,$(DEPLOY_MANIFESTS_SRC_FILES))
DASHBOARDS_TMP := $(patsubst $(DASHBOARDS_SRC_DIR)/%.json,$(DASHBOARDS_TMP_DIR)/%.json,$(DASHBOARDS_SRC))

TECTONIC_MANAGER_IMAGE = "quay.io/$(QUAY_ORG)/$(MANAGER_IMAGE)"
TECTONIC_MANAGER_IMAGE_LATEST = "$(TECTONIC_MANAGER_IMAGE):vdevel-latest"
TECTONIC_MANAGER_IMAGE_CURRENT = "$(TECTONIC_MANAGER_IMAGE):$(TECTONIC_VERSION)"

# Default to what we want in production, if a dev wants to use a fake license
# they can simply run make SIGNING_TAG=dev when building
SIGNING_TAG ?= prod

.PHONY: tectonic-manager-linux tec-bin tectonic-manager tectonic-license docker-image docker-image-deps push-docker-image check-env clean clean-tec-bin clean-manifests clean-dashboards manager-manifests clean-manager-manifests

default: all

all: tec-bin docker-image

tectonic-manager-linux: $(TEC_DIR)/bin/linux_amd64/tectonic-manager

tec-bin: tectonic-manager tectonic-license

tectonic-manager: $(TEC_DIR)/bin/linux_amd64/tectonic-manager $(TEC_DIR)/bin/darwin_amd64/tectonic-manager

tectonic-license: $(TEC_DIR)/bin/linux_amd64/tectonic-license $(TEC_DIR)/bin/darwin_amd64/tectonic-license

docker-image: $(TMP_DIR)/docker-image

docker-image-deps: $(TMP_DIR)/docker-image-deps

manager-manifests: $(MANAGER_MANIFESTS_TMP)

push-docker-image: docker-image
	@echo " DOCKER PUSH	     $(TECTONIC_MANAGER_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_MANAGER_IMAGE_CURRENT)
	@echo " DOCKER PUSH	     $(TECTONIC_MANAGER_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_MANAGER_IMAGE_LATEST)

clean:
	rm -rf $(WORKSPACE)

clean-tec-bin:
	rm -f $(TEC_BINS)

clean-manager-manifests:
	@echo "Cleaning manager manifests"
	@rm -rf $(MANAGER_MANIFESTS_TMP_DIR)

clean-manifests:
	@echo "Cleaning manager-managed manifests"
	@rm -rf $(DEPLOY_MANIFESTS_TMP_DIR)

clean-dashboards:
	@echo "Cleaning dashboards"
	@rm -rf $(DASHBOARDS_TMP)

#####

.PRECIOUS: $(TEC_BINS)

export CGO_ENABLED=0
export GO15VENDOREXPERIMENT=1

GFLAGS = -tags "netgo $(SIGNING_TAG)" -installsuffix netgo
TECTONICGFLAGS = -ldflags "-X github.com/coreos-inc/tectonic/manager/pkg/version.Version=$(TECTONIC_VERSION)"

$(TEC_DIR)/bin/linux_amd64/%: $(GO_FILES)
	@echo " TEC		$@"
	@mkdir -p $(@D)
	@$(eval export GOOS=linux)
	@$(eval export GOARCH=amd64)
	@go build $(GFLAGS) $(TECTONICGFLAGS) -o $@ github.com/coreos-inc/tectonic/manager/cmd/$(@F)

$(TEC_DIR)/bin/darwin_amd64/%: $(GO_FILES)
	@echo " TEC		$@"
	@mkdir -p $(@D)
	@$(eval export GOOS=darwin)
	@$(eval export GOARCH=amd64)
	@go build $(GFLAGS) $(TECTONICGFLAGS) -o $@ github.com/coreos-inc/tectonic/manager/cmd/$(@F)

$(DASHBOARDS_TMP_DIR)/%.json: $(DASHBOARDS_SRC_DIR)/%.json
	@echo " DASHBOARDS	$@"
	@mkdir -p $(@D)
	@cp $< $@

$(MANAGER_MANIFESTS_TMP_DIR)/%.yaml: $(MANAGER_MANIFESTS_SRC_DIR)/%.yaml
	@echo " MANIFESTS	$@"
	@mkdir -p $(@D)
	@cp $< $@
	@$(SCRIPTS_DIR)/update_manifest_tags.sh $@ $(TECTONIC_VERSION)

$(DEPLOY_MANIFESTS_TMP_DIR)/%.yaml: $(DEPLOY_MANIFESTS_SRC_DIR)/%.yaml
	@echo " MANIFESTS	$@"
	@mkdir -p $(@D)
	@cp $< $@
	@$(SCRIPTS_DIR)/update_manifest_tags.sh $@ $(TECTONIC_VERSION)

$(TMP_DIR)/bin/tectonic-manager: $(TEC_DIR)/bin/linux_amd64/tectonic-manager
	@echo " TEC		$@"
	@mkdir -p $(@D)
	@cp $^ $@

$(TMP_DIR)/Dockerfile: $(current_dir)/Dockerfile
	@rm -rf $@
	@mkdir -p $(TMP_DIR)
	@cp $^ $@

$(TMP_DIR)/docker-image-deps: $(TMP_DIR)/Dockerfile $(TMP_DIR)/bin/tectonic-manager $(MANAGER_MANIFESTS_TMP) $(DEPLOY_MANIFESTS_TMP) $(DASHBOARDS_TMP)
	@touch $@

$(TMP_DIR)/docker-image: $(TMP_DIR)/docker-image-deps
	@echo " DOCKER BUILD	     $(TECTONIC_MANAGER_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) build -t $(TECTONIC_MANAGER_IMAGE_CURRENT) $(TMP_DIR)
	@echo " DOCKER BUILD	     $(TECTONIC_MANAGER_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) tag  $(TECTONIC_MANAGER_IMAGE_CURRENT) $(TECTONIC_MANAGER_IMAGE_LATEST)
	@touch $@
