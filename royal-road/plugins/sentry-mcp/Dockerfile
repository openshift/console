# Sentry MCP server for Lightspeed: getsentry's @sentry/mcp-server (stdio)
# behind supergateway (streamable HTTP). Versions are pinned in
# package-lock.json. See README.md.
#
# Build: docker build -t sentry-mcp royal-road/plugins/sentry-mcp
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest
USER root
WORKDIR /opt/app-root/src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY entrypoint.sh /usr/local/bin/sentry-mcp-entrypoint
RUN chmod 0755 /usr/local/bin/sentry-mcp-entrypoint
# The MCP server keeps a small state database under $HOME; point it at a
# writable volume so the root filesystem can stay read-only.
ENV HOME=/tmp NODE_ENV=production
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/sentry-mcp-entrypoint"]
