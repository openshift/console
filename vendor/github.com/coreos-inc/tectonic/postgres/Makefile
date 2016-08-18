# https://stackoverflow.com/questions/18136918/how-to-get-current-relative-directory-of-your-makefile
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(realpath $(current_dir)/..)

QUAY_ORG = coreos
POSTGRES_IMAGE = tectonic-postgres
TECTONIC_VERSION = $(shell /bin/sh $(project_dir)/git-version)
DOCKER = docker

TECTONIC_POSTGRES_IMAGE = "quay.io/$(QUAY_ORG)/$(POSTGRES_IMAGE)"
TECTONIC_POSTGRES_IMAGE_LATEST = "$(TECTONIC_POSTGRES_IMAGE):vdevel-latest"
TECTONIC_POSTGRES_IMAGE_CURRENT = "$(TECTONIC_POSTGRES_IMAGE):$(TECTONIC_VERSION)"

# Directories used in targets
WORKSPACE = $(current_dir)/.workspace
TMP_DIR = $(WORKSPACE)/tmpdir
SCRIPTS_DIR = $(current_dir)/initdb-scripts

# All files in $SCRIPTS_DIR with the suffix $SCRIPTS_DIR included still
SCRIPT_FILES := $(shell find $(SCRIPTS_DIR) -type f)
# Files which we rebuild based on modtimes for
SCRIPTS_TMP := $(patsubst $(SCRIPTS_DIR)/%,$(TMP_DIR)/initdb-scripts/%,$(SCRIPT_FILES))

.PHONY: docker-image docker-image-deps clean clean-tec-bin clean-manifests clean-dashboards

all: docker-image

docker-image: $(TMP_DIR)/docker-image

docker-image-deps: $(TMP_DIR)/docker-image-deps

push-docker-image: docker-image
	@echo " DOCKER PUSH	     $(TECTONIC_POSTGRES_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_POSTGRES_IMAGE_CURRENT)
	@echo " DOCKER PUSH	     $(TECTONIC_POSTGRES_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_POSTGRES_IMAGE_LATEST)

clean:
	rm -rf $(WORKSPACE)

default: all

#####

$(TMP_DIR)/initdb-scripts/%: $(SCRIPTS_DIR)/%
	@echo " SCRIPTS	$@"
	@mkdir -p $(@D)
	@cp $< $@

$(TMP_DIR)/Dockerfile: $(current_dir)/Dockerfile
	@rm -rf $@
	@mkdir -p $(TMP_DIR)
	@cp $^ $@

$(TMP_DIR)/docker-image-deps: $(TMP_DIR)/Dockerfile $(SCRIPTS_TMP)
	@touch $@

$(TMP_DIR)/docker-image: $(TMP_DIR)/docker-image-deps
	@echo " DOCKER BUILD	     $(TECTONIC_POSTGRES_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) build -t $(TECTONIC_POSTGRES_IMAGE_CURRENT) $(TMP_DIR)
	@echo " DOCKER BUILD	     $(TECTONIC_POSTGRES_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) tag  $(TECTONIC_POSTGRES_IMAGE_CURRENT) $(TECTONIC_POSTGRES_IMAGE_LATEST)
	@touch $@
