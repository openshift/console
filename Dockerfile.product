##################################################
#
# go backend build
FROM registry.ci.openshift.org/ocp/builder:rhel-8-golang-1.19-openshift-4.13 AS gobuilder
RUN mkdir -p /go/src/github.com/openshift/console/
ADD . /go/src/github.com/openshift/console/
WORKDIR /go/src/github.com/openshift/console/
RUN ./build-backend.sh


##################################################
#
# nodejs frontend build
FROM registry.ci.openshift.org/ocp/builder:rhel-8-base-nodejs-openshift-4.13 AS nodebuilder

ADD . .

USER 0

ARG YARN_VERSION=v1.22.19

# bootstrap yarn so we can install and run the other tools.
RUN CACHED_YARN=./artifacts/yarn-${YARN_VERSION}.tar.gz; \
    if [ -f ${CACHED_YARN} ]; then \
      npm install ${CACHED_YARN}; \
    else \
      npm install https://github.com/yarnpkg/yarn/releases/download/${YARN_VERSION}/yarn-${YARN_VERSION}.tar.gz; \
    fi

# The REMOTE_SOURCES value is set by the build system to indicate the location of the cachito-backed artifacts cache.
# As cachito might not be available in all environments, we need to make sure the value is set before trying to use it and
# that the COPY layer below doesn't fail. Setting it to be the Dockerfile itself is fairly safe, as it will always be
# available.
ARG REMOTE_SOURCES=./Dockerfile.product
ARG REMOTE_SOURCE_DIR=/tmp/remote-sources

COPY $REMOTE_SOURCES $REMOTE_SOURCES_DIR

# use dependencies provided by Cachito
RUN test -d ${REMOTE_SOURCES}/cachito-gomod-with-deps || exit 0; \
    cp -f $REMOTE_SOURCES_DIR/cachito-gomod-with-deps/app/registry-ca.pem . \
 && cp -f $REMOTE_SOURCES_DIR/cachito-gomod-with-deps/app/frontend/{.npmrc,.yarnrc,yarn.lock} frontend/

# prevent download of chromedriver, geckodriver, and the cypress binary as part of module installs
ENV CHROMEDRIVER_SKIP_DOWNLOAD=true \
    GECKODRIVER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0

# run the build
RUN container-entrypoint ./build-frontend.sh


##################################################
#
# actual base image for final product
FROM registry.ci.openshift.org/ocp/4.13:base
RUN mkdir -p /opt/bridge/bin
COPY --from=gobuilder /go/src/github.com/openshift/console/bin/bridge /opt/bridge/bin
COPY --from=nodebuilder /opt/app-root/src/frontend/public/dist /opt/bridge/static
COPY --from=gobuilder /go/src/github.com/openshift/console/pkg/graphql/schema.graphql /pkg/graphql/schema.graphql

WORKDIR /
# doesn't require a root user.
USER 1001

CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]

LABEL \
        io.k8s.description="This is a component of OpenShift Container Platform and provides a web console." \
        com.redhat.component="openshift-enterprise-console-container" \
        maintainer="Samuel Padgett <spadgett@redhat.com>" \
        name="openshift3/ose-console" \
        License="Apache 2.0" \
        io.k8s.display-name="OpenShift Console" \
        vendor="Red Hat" \
        io.openshift.tags="openshift,console"

