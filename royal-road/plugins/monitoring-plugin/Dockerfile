# Royal Road build of openshift/monitoring-plugin on public base images.
#
# Upstream's Dockerfiles pull from registry.redhat.io or OpenShift's CI
# registry, both of which need credentials, and no published image of the
# release-5.0 branch exists. This file keeps upstream's three stages (web,
# Go backend, ubi-minimal runtime) and fetches the pinned upstream commit
# itself, so the build context is just this directory:
#
#   docker build -t monitoring-plugin royal-road/plugins/monitoring-plugin

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
    CYPRESS_INSTALL_BINARY=0 \
    NODE_OPTIONS=--max-old-space-size=8192
WORKDIR /opt/app-root
COPY --from=source /src/web/package.json /src/web/package-lock.json web/
COPY --from=source /src/Makefile Makefile
RUN make install-frontend-ci
COPY --from=source /src/web/ web/
RUN make build-frontend

##################################################
#
# Go backend (static file server + manifest feature patching)
FROM docker.io/library/golang:1.26 AS go-builder
WORKDIR /opt/app-root
COPY --from=source /src/go.mod /src/go.sum /src/Makefile ./
RUN make install-backend
COPY --from=source /src/cmd/ cmd/
COPY --from=source /src/pkg/ pkg/
# Upstream builds with GOEXPERIMENT=strictfipsruntime, which needs Red Hat's
# OpenSSL-backed Go toolchain. The stock toolchain builds a static binary.
ENV CGO_ENABLED=0
RUN make build-backend

##################################################
#
# runtime image
FROM registry.access.redhat.com/ubi9/ubi-minimal
COPY --from=web-builder /opt/app-root/web/dist /opt/app-root/web/dist
COPY --from=go-builder /opt/app-root/plugin-backend /opt/app-root/plugin-backend
COPY --from=source /src/config/ /opt/app-root/config
USER 1001
EXPOSE 9443
# Same entrypoint as upstream: the four features OpenShift ships in core
# monitoring (alerting, metrics, legacy dashboards, targets).
ENTRYPOINT ["/opt/app-root/plugin-backend", "-static-path", "/opt/app-root/web/dist", "-config-path", "/opt/app-root/config", "-features", "alerting,metrics,legacy-dashboards,targets"]

LABEL \
        org.opencontainers.image.source="https://github.com/royal-road/console" \
        org.opencontainers.image.description="openshift/monitoring-plugin built by the Royal Road console fork" \
        org.opencontainers.image.licenses="Apache-2.0"
