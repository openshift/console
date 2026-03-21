##################################################
#
# go backend build
FROM registry.ci.openshift.org/ocp/builder:rhel-9-golang-1.25-openshift-4.22 AS gobuilder
RUN mkdir -p /go/src/github.com/openshift/console/
ADD . /go/src/github.com/openshift/console/
WORKDIR /go/src/github.com/openshift/console/
RUN ./build-backend.sh

##################################################
#
# nodejs frontend build
FROM registry.ci.openshift.org/ocp/builder:rhel-9-base-nodejs-openshift-4.22 AS nodebuilder

ADD . .
USER 0

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CYPRESS_INSTALL_BINARY=0

RUN container-entrypoint ./build-frontend.sh

##################################################
#
# actual base image for final product
FROM registry.ci.openshift.org/ocp/4.22:base-rhel9
RUN mkdir -p /opt/bridge/bin
COPY --from=gobuilder /go/src/github.com/openshift/console/bin/bridge /opt/bridge/bin
COPY --from=nodebuilder /opt/app-root/src/frontend/public/dist /opt/bridge/static

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
