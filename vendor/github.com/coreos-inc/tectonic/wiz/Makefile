# todo: use a .workspace like other Makefiles. the docker context for this
# build is pretty large at 280MB and can be reduced by not copying this entire
# dir to docker every docker build

mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(realpath $(current_dir)/..)

QUAY_ORG = coreos
WIZ_IMAGE = tectonic-wizard
TECTONIC_VERSION = $(shell /bin/sh $(project_dir)/git-version)
DOCKER = docker

TECTONIC_WIZ_IMAGE = "quay.io/$(QUAY_ORG)/$(WIZ_IMAGE)"
TECTONIC_WIZ_IMAGE_LATEST = "$(TECTONIC_WIZ_IMAGE):vdevel-latest"
TECTONIC_WIZ_IMAGE_CURRENT = "$(TECTONIC_WIZ_IMAGE):$(TECTONIC_VERSION)"

.PHONY: docker-image build

default: docker-image

build:
	$(current_dir)/build

docker-image: build
	@echo " DOCKER BUILD	     $(TECTONIC_WIZ_IMAGE_CURRENT)"
	@$(DOCKER) $(DOCKER_FLAGS) build -t $(TECTONIC_WIZ_IMAGE_CURRENT) $(current_dir)
	@echo " DOCKER BUILD	     $(TECTONIC_WIZ_IMAGE_LATEST)"
	@$(DOCKER) $(DOCKER_FLAGS) tag  $(TECTONIC_WIZ_IMAGE_CURRENT) $(TECTONIC_WIZ_IMAGE_LATEST)
