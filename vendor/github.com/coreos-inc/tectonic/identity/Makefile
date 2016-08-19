# https://stackoverflow.com/questions/18136918/how-to-get-current-relative-directory-of-your-makefile
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(realpath $(current_dir)/..)

QUAY_ORG = coreos
IDENTITY_IMAGE = tectonic-identity
TECTONIC_VERSION = $(shell /bin/sh $(project_dir)/git-version)
DOCKER = docker

TECTONIC_IDENTITY_IMAGE = "quay.io/$(QUAY_ORG)/$(IDENTITY_IMAGE)"
TECTONIC_IDENTITY_IMAGE_LATEST = "$(TECTONIC_IDENTITY_IMAGE):vdevel-latest"
TECTONIC_IDENTITY_IMAGE_CURRENT = "$(TECTONIC_IDENTITY_IMAGE):$(TECTONIC_VERSION)"

# Directories used in targets
WORKSPACE = $(current_dir)/.workspace
TMP_DIR = $(WORKSPACE)/tmpdir
TEMPLATES_DIR = $(current_dir)/templates

# All files in $TEMPLATES_DIR with the suffix $TEMPLATES_DIR included still
TEMPLATE_FILES := $(shell find $(TEMPLATES_DIR) -type f)
# Files which we rebuild based on modtimes for
TEMPLATES := $(patsubst $(TEMPLATES_DIR)/%,$(TMP_DIR)/templates/%,$(TEMPLATE_FILES))

.PHONY: docker-image docker-image-deps clean clean-tec-bin clean-manifests clean-dashboards

all: docker-image

docker-image: $(TMP_DIR)/docker-image

docker-image-deps: $(TMP_DIR)/docker-image-deps

push-docker-image: docker-image
	@echo " DOCKER PUSH	     $(TECTONIC_IDENTITY_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_IDENTITY_IMAGE_CURRENT)
	@echo " DOCKER PUSH	     $(TECTONIC_IDENTITY_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_IDENTITY_IMAGE_LATEST)

clean:
	rm -rf $(WORKSPACE)

default: all

#####

$(TMP_DIR)/templates/%: $(TEMPLATES_DIR)/%
	@echo " TEMPLATES	$@"
	@mkdir -p $(@D)
	@cp $< $@

$(TMP_DIR)/Dockerfile: $(current_dir)/Dockerfile
	@rm -rf $@
	@mkdir -p $(TMP_DIR)
	@cp $^ $@

$(TMP_DIR)/docker-image-deps: $(TMP_DIR)/Dockerfile $(TEMPLATES)
	@touch $@

$(TMP_DIR)/docker-image: $(TMP_DIR)/docker-image-deps
	@echo " DOCKER BUILD	     $(TECTONIC_IDENTITY_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) build -t $(TECTONIC_IDENTITY_IMAGE_CURRENT) $(TMP_DIR)
	@echo " DOCKER BUILD	     $(TECTONIC_IDENTITY_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) tag  $(TECTONIC_IDENTITY_IMAGE_CURRENT) $(TECTONIC_IDENTITY_IMAGE_LATEST)
	@touch $@
