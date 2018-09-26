FROM quay.io/coreos/tectonic-console-builder:v16 AS build

RUN mkdir -p /go/src/github.com/openshift/console/
ADD . /go/src/github.com/openshift/console/
WORKDIR /go/src/github.com/openshift/console/
RUN ./build.sh

FROM openshift/origin-base

COPY --from=build /go/src/github.com/openshift/console/frontend/public/dist /opt/bridge/static
COPY --from=build /go/src/github.com/openshift/console/bin/bridge /opt/bridge/bin/bridge

LABEL io.k8s.display-name="OpenShift Virtualization Console" \
      io.k8s.description="This is a component of OpenShift Container Platform and provides a web console with virtualization extension." \
      io.openshift.tags="openshift" \
      maintainer="Marek Libra <mlibra@redhat.com>"

# doesn't require a root user.
USER 1001

CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static", "--branding=okdvirt" ]
