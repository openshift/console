# openshift/networking-console-plugin built from upstream source with public
# base images. Upstream's Dockerfile uses registry.ci.openshift.org, which needs
# credentials. Build context: this directory.
#
#   docker build -t networking-console-plugin royal-road/plugins/networking-console-plugin

FROM docker.io/library/node:22 AS build

WORKDIR /src
COPY upstream.env /tmp/upstream.env
COPY patches/ /tmp/patches/

# Fetch exactly the pinned commit, then apply our patches in order.
RUN . /tmp/upstream.env && \
    git init -q . && \
    git fetch -q --depth 1 "$UPSTREAM_REPO" "$UPSTREAM_COMMIT" && \
    git -c advice.detachedHead=false checkout -q FETCH_HEAD && \
    for p in /tmp/patches/*.patch; do [ -e "$p" ] || continue; echo "applying $p"; git apply "$p"; done

# Same settings as upstream's Dockerfile.
ENV CYPRESS_INSTALL_BINARY=0
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 9 && \
    npm config set fetch-retry-factor 2 && \
    npm clean-install --ignore-scripts --no-audit && \
    npm run build

# UBI nginx (public, no credentials). Its default config serves
# /opt/app-root/src over plain HTTP on 8080 as UID 1001, which is all the
# plugin needs: the bridge fetches the static assets and proxies them to the
# browser. No TLS here; see royal-road/deploy/README.md.
FROM registry.access.redhat.com/ubi9/nginx-126

COPY --from=build /src/dist /opt/app-root/src

USER 1001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
