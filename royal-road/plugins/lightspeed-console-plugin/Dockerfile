# openshift/lightspeed-console (the OpenShift Lightspeed chat plugin) built from
# upstream source with public base images. Upstream's image bundles three builds
# (PF5, 4.19, main) and picks one at start-up; we only need `main`, which is the
# build for console 4.22 and later. Build context: this directory.
#
#   docker build -t lightspeed-console-plugin royal-road/plugins/lightspeed-console-plugin

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

# Same install and build as upstream's Dockerfile (build-main stage).
RUN NODE_OPTIONS=--max-old-space-size=4096 npm ci --omit=dev --omit=optional --ignore-scripts --no-fund --no-audit && \
    npm run build

# UBI nginx (public, no credentials). Its default config serves
# /opt/app-root/src over plain HTTP on 8080 as UID 1001, which is all the
# plugin needs: the bridge fetches the static assets and proxies them to the
# browser. No TLS here; see royal-road/deploy/lightspeed/README.md.
FROM registry.access.redhat.com/ubi9/nginx-126

COPY --from=build /src/dist /opt/app-root/src

USER 1001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
