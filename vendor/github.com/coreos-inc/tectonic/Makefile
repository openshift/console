mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )

# components (with a Makefile)
components = manager wiz identity postgres monitoring
build_component_targets = $(addprefix make-, $(components))

# Tells make to pass through any variables through to sub-makes
export

.PHONY: default all clean bootstrap release

default: all

all: $(build_component_targets) bootstrap

make-%: $(current_dir)/%/Makefile
	make -f $<

make-clean-%: $(current_dir)/%/Makefile
	make -f $< clean

bootstrap:
	$(current_dir)/bootstrap/build

release:
	@bash -c "source $(current_dir)/scripts/awsutil.sh && check_aws_creds"
	$(current_dir)/scripts/tag_release.sh
	$(current_dir)/scripts/make_release_tarball.sh

build:
	$(current_dir)/build

clean:
	$(current_dir)/clean
