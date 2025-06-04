.DEFAULT_GOAL:=help

VERSION=$(shell git rev-parse HEAD)

# Aliases
.PHONY: bin
bin: get-ocp-range
.PHONY: build
build: get-ocp-range

get-ocp-range: bindir
	go build -o bin/ ./cmd/get-ocp-range/ 

.PHONY: fmt
fmt: gofumpt
	${GOFUMPT} -l -w .
	git diff --exit-code

.PHONY: tidy
tidy:
	go mod tidy
	git diff --exit-code

.PHONY: test
test:
	go test -v ./...

.PHONY: vet
vet:
	go vet ./...

.PHONY: lint
lint: golangci-lint ## Run golangci-lint linter checks.
	$(GOLANGCI_LINT) run

GOLANGCI_LINT = $(shell pwd)/bin/golangci-lint
GOLANGCI_LINT_VERSION ?= v1.52.2
golangci-lint: $(GOLANGCI_LINT)
$(GOLANGCI_LINT):
	$(call go-install-tool,$(GOLANGCI_LINT),github.com/golangci/golangci-lint/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION))

GOFUMPT = $(shell pwd)/bin/gofumpt
# TODO(komish): 
# gofumpt pinned to 0.6.0 which is the last version to support a min go
# version of 1.20. When our min go version in go.mod is updated, we can bump
# this back to latest.
GOFUMPT_VERSION ?= v0.6.0
gofumpt: ## Download envtest-setup locally if necessary.
	$(call go-install-tool,$(GOFUMPT),mvdan.cc/gofumpt@$(GOFUMPT_VERSION))


# go-get-tool will 'go get' any package $2 and install it to $1.
PROJECT_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
define go-install-tool
@[ -f $(1) ] || { \
GOBIN=$(PROJECT_DIR)/bin go install $(2) ;\
}
endef

bindir:
	mkdir $(PROJECT_DIR)/bin 2>/dev/null || true