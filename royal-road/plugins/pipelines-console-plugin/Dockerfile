# openshift-pipelines/console-plugin built from upstream source with public
# base images. Upstream's Dockerfile builds on ubi9/nodejs-22 pinned by digest
# and copies the source tree; this one fetches the pinned commit itself, so the
# build context is just this directory:
#
#   docker build -t pipelines-console-plugin royal-road/plugins/pipelines-console-plugin

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

# Namespaces baked into the bundle (patch 0001). Upstream's default for both
# is openshift-pipelines, where the OpenShift Pipelines operator installs.
#   PIPELINE_NAMESPACE               Pipelines-as-Code secret and configuration
#                                    (the standalone PaC release installs into
#                                    pipelines-as-code)
#   CLUSTER_RESOLVER_TASK_NAMESPACE  shared Tasks the pipeline builder offers
#                                    through the cluster resolver
ARG PIPELINE_NAMESPACE=pipelines-as-code
ARG CLUSTER_RESOLVER_TASK_NAMESPACE=tekton-catalog

# Same build as upstream's Dockerfile: Yarn from packageManager via corepack.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CYPRESS_INSTALL_BINARY=0 \
    HUSKY=0
RUN corepack enable && \
    yarn install --immutable && \
    PIPELINE_NAMESPACE="$PIPELINE_NAMESPACE" \
    CLUSTER_RESOLVER_TASK_NAMESPACE="$CLUSTER_RESOLVER_TASK_NAMESPACE" \
    yarn build

# UBI nginx (public, no credentials). Its default config serves
# /opt/app-root/src over plain HTTP on 8080 as UID 1001, which is all the
# plugin needs: the bridge fetches the static assets and proxies them to the
# browser. No TLS here; see royal-road/deploy/README.md.
FROM registry.access.redhat.com/ubi9/nginx-126

COPY --from=build /src/dist /opt/app-root/src

USER 1001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

LABEL \
        org.opencontainers.image.source="https://github.com/royal-road/console" \
        org.opencontainers.image.description="openshift-pipelines/console-plugin built by the Royal Road console fork" \
        org.opencontainers.image.licenses="Apache-2.0"
