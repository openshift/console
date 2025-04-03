# Used for testing OpenShift console in CI. After editing this file:
#
# * Bump the builder version in `Dockerfile` and `builder-run.sh`
# * Commit the changes
# * Run `DOCKER_TAG=<new-tag> ./push-builder.sh` to update the image on quay
#   (requires edit permission to the quay.io/coreos/tectonic-console-builder repo)
#
# You can test the image using `./builder-run.sh`. For instance:
#   $ ./builder-run.sh ./build-backend.sh

FROM golang:1.23-bookworm

### For golang testing stuff
RUN go install github.com/jstemmer/go-junit-report@latest

### Install NodeJS and yarn
ENV NODE_VERSION="v22.14.0"
ENV YARN_VERSION="v1.22.22"

# yarn needs a home writable by any user running the container
ENV HOME /opt/home
RUN mkdir -p ${HOME}
RUN chmod 777 -R ${HOME}

# give every user read access to the "/root" folder where the binary is cached
# we really only need to worry about the top folder, fortunately
# TODO: there are other folders that need permissions but I don't know what they are yet, See: https://github.com/cypress-io/cypress/issues/23962
RUN chmod -R 777 /root/.cache/Cypress
RUN chmod -R 777 /app
RUN chmod 777 /root
RUN chmod 777 /root/.cache
RUN chmod 777 /root/.config
RUN chmod -R 777 /root/.config/Cypress

RUN apt-get update \
    && apt-get install --no-install-recommends -y -q \
    curl wget git unzip bzip2 jq expect \
    # additional Cypress dependencies: https://docs.cypress.io/guides/guides/continuous-integration.html#Dependencies
    libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth libglib2.0-0 \
    xvfb libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgtk-3-0 libgbm1 libasound2

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null \
  # avoid too many progress messages
  # https://github.com/cypress-io/cypress/issues/1243
  CI=1 \
  # disable shared memory X11 affecting Cypress v4 and Chrome
  # https://github.com/cypress-io/cypress-docker-images/issues/270
  QT_X11_NO_MITSHM=1 \
  _X11_NO_MITSHM=1 \
  _MITSHM=0 \

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.27.1/bin/linux/$(go env GOARCH)/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

RUN cd /tmp && \
    wget --quiet -O /tmp/node.tar.gz \
      "http://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-$(go env GOARCH | sed 's/amd64/x64/').tar.gz" && \
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

RUN cd /tmp && \
    wget --quiet -O /tmp/yarn.tar.gz https://github.com/yarnpkg/yarn/releases/download/${YARN_VERSION}/yarn-${YARN_VERSION}.tar.gz && \
    tar xf yarn.tar.gz && \
    rm -f /tmp/yarn.tar.gz && \
    mv /tmp/yarn-${YARN_VERSION} /usr/local/yarn && \
    ln -s /usr/local/yarn/bin/yarn /usr/local/bin/yarn
