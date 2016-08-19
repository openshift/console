###
# Builds a container used for compiling the tectonic-installer binaries and javascript applications.
# quay.io/coreos/tectonic-wizard
# quay.io/coreos/tectonic-manager
#
# Node install inspired by: https://github.com/dockerfile/nodejs/blob/master/Dockerfile
#
# Update the builder image manually by running:
#
# docker build -f Dockerfile-builder .
# docker tag <resulting-image-id> quay.io/coreos/tectonic-installer:<next-semver>
# docker push quay.io/coreos/tectonic-installer:<next-semver>
###

FROM golang:1.6.2-wheezy

### For golang testing stuff
RUN go get -u github.com/golang/lint/golint
RUN go get github.com/jstemmer/go-junit-report

### Install NodeJS and NPM
ENV NODE_VERSION="v4.4.5"
# npm needs a home writable by any user running the container
ENV HOME /opt/home
RUN mkdir -p ${HOME}
RUN chmod 777 -R ${HOME}

# Needed to get jq in wheezy
RUN echo "deb http://ftp.debian.org/debian wheezy-backports main" > /etc/apt/sources.list.d/backports.list

RUN apt-get update \
    && apt-get install --no-install-recommends -y -q \
    build-essential sudo curl wget git autoconf automake unzip libtool && \
    apt-get install --no-install-recommends -y -q -t wheezy-backports jq

RUN cd /tmp && \
    wget --quiet -O /tmp/node.tar.gz http://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz && \
    tar xf node.tar.gz && \
    rm -f /tmp/node.tar.gz && \
    cd node-* && \
    cp -r lib/node_modules /usr/local/lib/node_modules && \
    cp bin/node /usr/local/bin && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
# so any container user can install global node modules if needed
RUN chmod 777 /usr/local/lib/node_modules
# cleanup
RUN rm -rf /tmp/node-v*
