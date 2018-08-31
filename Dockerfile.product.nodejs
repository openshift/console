FROM openshift/origin-release:nodejs8

COPY . /go/src/github.com/openshift/console/
WORKDIR /go/src/github.com/openshift/console/

RUN ./build-frontend.sh \
&&  rm -rf /tmp/*
# remove chromedriver and other temporary files
# created while building frontend assets.

LABEL \
        io.k8s.description="This is a NodeJS 8 builder image for building the OpenShift Container Platform web console." \
        com.redhat.component="openshift-nodejs-builder-container" \
        name="openshift3/console-nodejs-builder" \
        vendor="Red Hat" \

