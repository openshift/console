# Royal Road build of openshift/logging-view-plugin, patched to read
# VictoriaLogs, plus vl-tenancy-proxy, on public base images.
#
# Upstream's Dockerfile pulls from registry.redhat.io, which needs
# credentials. This file keeps upstream's stages (web, Go backend,
# ubi-minimal runtime), fetches the pinned upstream commit itself and adds the
# tenancy proxy as a second binary, so one image serves both containers. The
# build context is this directory:
#
#   docker build -t logging-view-plugin royal-road/plugins/logging-view-plugin

##################################################
#
# upstream source at the pinned commit (upstream.env), with our patches applied
FROM docker.io/library/golang:1.26 AS source
WORKDIR /src
COPY upstream.env /tmp/upstream.env
COPY patches/ /tmp/patches/
RUN . /tmp/upstream.env && \
    git init -q . && \
    git fetch -q --depth 1 "$UPSTREAM_REPO" "$UPSTREAM_COMMIT" && \
    git -c advice.detachedHead=false checkout -q FETCH_HEAD && \
    for p in /tmp/patches/*.patch; do [ -e "$p" ] || continue; echo "applying $p"; git apply "$p"; done

##################################################
#
# frontend
FROM docker.io/library/node:22 AS web-builder
ENV HUSKY=0 \
    CYPRESS_INSTALL_BINARY=0
WORKDIR /opt/app-root
COPY --from=source /src/web/package.json /src/web/package-lock.json web/
COPY --from=source /src/Makefile Makefile
RUN make install-frontend-ci
COPY --from=source /src/web/ web/
RUN make build-frontend

##################################################
#
# Go: upstream's backend (static files + /config) and our tenancy proxy
FROM docker.io/library/golang:1.26 AS go-builder
# Upstream builds with GOEXPERIMENT=strictfipsruntime, which needs Red Hat's
# OpenSSL-backed Go toolchain. The stock toolchain builds static binaries.
ENV CGO_ENABLED=0
WORKDIR /opt/app-root
COPY --from=source /src/go.mod /src/go.sum /src/Makefile ./
RUN make install-backend
COPY --from=source /src/cmd/ cmd/
COPY --from=source /src/pkg/ pkg/
RUN make build-backend
WORKDIR /opt/vl-tenancy-proxy
COPY vl-tenancy-proxy/go.mod vl-tenancy-proxy/go.sum ./
RUN go mod download
COPY vl-tenancy-proxy/ ./
RUN go test ./... && go build -trimpath -o /opt/app-root/vl-tenancy-proxy .

##################################################
#
# runtime image
FROM registry.access.redhat.com/ubi9/ubi-minimal
COPY --from=web-builder /opt/app-root/web/dist /opt/app-root/web/dist
COPY --from=go-builder /opt/app-root/plugin-backend /opt/app-root/plugin-backend
COPY --from=go-builder /opt/app-root/vl-tenancy-proxy /opt/app-root/vl-tenancy-proxy
USER 1001
EXPOSE 9002 8080
# Default: the plugin (upstream's entrypoint). The tenancy proxy container runs
# /opt/app-root/vl-tenancy-proxy from the same image.
ENTRYPOINT ["/opt/app-root/plugin-backend", "-static-path", "/opt/app-root/web/dist"]

LABEL \
        org.opencontainers.image.source="https://github.com/royal-road/console" \
        org.opencontainers.image.description="openshift/logging-view-plugin reading VictoriaLogs, built by the Royal Road console fork" \
        org.opencontainers.image.licenses="Apache-2.0"
