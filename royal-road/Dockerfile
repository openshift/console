# Royal Road build of the console on public base images.
# Mirrors the stages of the upstream Dockerfile, which pulls from OpenShift's
# credentialed CI registry. Build context is the repository root:
#   docker build -f royal-road/Dockerfile --build-arg SOURCE_GIT_TAG=$(git rev-parse --short HEAD) .

##################################################
#
# go backend build
FROM docker.io/library/golang:1.26 AS gobuilder
# .git is excluded from the build context; build-backend.sh uses this instead
# of `git describe` for the version string.
ARG SOURCE_GIT_TAG=unknown
ENV SOURCE_GIT_TAG=${SOURCE_GIT_TAG}
WORKDIR /go/src/github.com/openshift/console/
COPY . .
RUN ./build-backend.sh

##################################################
#
# nodejs frontend build
FROM docker.io/library/node:22 AS nodebuilder
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /opt/app-root/src
COPY . .
RUN ./build-frontend.sh

##################################################
#
# runtime image
FROM registry.access.redhat.com/ubi9/ubi-minimal
RUN mkdir -p /opt/bridge/bin
COPY --from=gobuilder /go/src/github.com/openshift/console/bin/bridge /opt/bridge/bin
COPY --from=nodebuilder /opt/app-root/src/frontend/public/dist /opt/bridge/static

WORKDIR /
# doesn't require a root user.
USER 1001

CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]

LABEL \
        org.opencontainers.image.source="https://github.com/royal-road/console" \
        org.opencontainers.image.description="Royal Road fork of the OpenShift web console for upstream Kubernetes" \
        org.opencontainers.image.licenses="Apache-2.0"
