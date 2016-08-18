# https://stackoverflow.com/questions/18136918/how-to-get-current-relative-directory-of-your-makefile
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(realpath $(current_dir)/../..)

QUAY_ORG = coreos
GRAFANA = tectonic-grafana
TECTONIC_VERSION = $(shell /bin/sh $(project_dir)/git-version)
DOCKER = docker

TECTONIC_GRAFANA = "quay.io/$(QUAY_ORG)/$(GRAFANA)"
TECTONIC_GRAFANA_LATEST = "$(TECTONIC_GRAFANA):vdevel-latest"
TECTONIC_GRAFANA_CURRENT = "$(TECTONIC_GRAFANA):$(TECTONIC_VERSION)"

# Directories used in targets
WORKSPACE = $(current_dir)/.workspace
TMP_DIR = $(WORKSPACE)/tmpdir

.PHONY: docker-image docker-image-deps clean

all: docker-image

docker-image: $(TMP_DIR)/docker-image

docker-image-deps: $(TMP_DIR)/docker-image-deps

push-docker-image: docker-image
	@echo " DOCKER PUSH	     $(TECTONIC_GRAFANA_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_GRAFANA_CURRENT)
	@echo " DOCKER PUSH	     $(TECTONIC_GRAFANA_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) push $(TECTONIC_GRAFANA_LATEST)

clean:
	rm -rf $(WORKSPACE)

default: all

#####

$(TMP_DIR)/Dockerfile: $(current_dir)/Dockerfile
	@rm -rf $@
	@mkdir -p $(TMP_DIR)
	@cp $^ $@

$(TMP_DIR)/docker-image-deps: $(TMP_DIR)/Dockerfile
	@touch $@

$(TMP_DIR)/docker-image: $(TMP_DIR)/docker-image-deps
	@echo " DOCKER BUILD	     $(TECTONIC_GRAFANA_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) build -t $(TECTONIC_GRAFANA_CURRENT) $(TMP_DIR)
	@echo " DOCKER BUILD	     $(TECTONIC_GRAFANA_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) tag  $(TECTONIC_GRAFANA_CURRENT) $(TECTONIC_GRAFANA_LATEST)
	@touch $@
