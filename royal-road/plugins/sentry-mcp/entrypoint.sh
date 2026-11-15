#!/bin/sh
# Serves the Sentry MCP server (stdio only) over streamable HTTP on :8080/mcp.
#
# Environment:
#   SENTRY_URL          Sentry base URL, e.g. http://sentry-web.sentry.svc:9000
#   SENTRY_AUTH_TOKEN   read-only Sentry token (org:read, project:read, event:read)
#   SENTRY_ORG          organization slug; every call is limited to it
#   MCP_API_KEY_FILE    file with the key(s) clients must send as
#                       `X-API-Key` or `Authorization: Bearer`, one per line
#
# Only the read-only `inspect` skill is granted, and of its tools only the
# ones below are exposed. Left out on purpose:
#   - tools that write or send data to sentry.io (onboarding_status_update,
#     submit_feedback_to_sentry_team) or fetch docs from the internet
#     (search_docs, get_doc)
#   - tools that return end-user data (replays, attachments, user reports)
#   - the long tail (dashboards, monitors, profiles, traces, snapshots...):
#     a small model picks tools better from a short list
set -eu

: "${SENTRY_URL:?}" "${SENTRY_AUTH_TOKEN:?}" "${SENTRY_ORG:?}" "${MCP_API_KEY_FILE:?}"
export SENTRY_URL SENTRY_AUTH_TOKEN

app=/opt/app-root/src
tools=""
for t in \
  find_projects \
  search_issues \
  get_issue_details \
  get_event_stacktrace \
  search_issue_events \
  get_issue_tag_values \
  find_releases \
  get_release_details; do
  tools="$tools --tools $t"
done

# shellcheck disable=SC2086 # $tools is a list of flags
exec node "$app/node_modules/supergateway/dist/index.js" \
  --stdio "node $app/node_modules/@sentry/mcp-server/dist/sentry-mcp.cjs mcp --skills inspect $SENTRY_ORG/" \
  --outputTransport streamableHttp \
  --port 8080 \
  --healthEndpoint /healthz \
  --apiKeyFile "$MCP_API_KEY_FILE" \
  $tools \
  "$@"
