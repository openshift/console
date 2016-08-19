# https://stackoverflow.com/questions/18136918/how-to-get-current-relative-directory-of-your-makefile
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)) )
project_dir := $(realpath $(current_dir)/..)

.PHONY: default all clean

components = grafana
build_component_targets = $(addprefix make-, $(components))
clean_component_targets = $(addprefix make-clean-, $(components))

default: all

all: $(build_component_targets)

clean: $(clean_component_targets)

make-clean-%: $(current_dir)/%/Makefile
	make -f $< clean

make-%: $(current_dir)/%/Makefile
	make -f $<

