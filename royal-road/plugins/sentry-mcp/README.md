# sentry-mcp

Image for Lightspeed's Sentry tools: getsentry's
[`@sentry/mcp-server`](https://www.npmjs.com/package/@sentry/mcp-server), which
speaks MCP over stdio only, behind
[`supergateway`](https://www.npmjs.com/package/supergateway), which serves it
over streamable HTTP at `:8080/mcp` for OLS. Both versions are pinned in
`package-lock.json` (`@sentry/mcp-server` 0.49.0, `supergateway` 4.2.2).

`entrypoint.sh` configures it:

- `SENTRY_URL`, `SENTRY_AUTH_TOKEN`: the Sentry instance and a read-only token.
  The server works with self-hosted Sentry when `SENTRY_URL` is set.
- `SENTRY_ORG`: every call is limited to this organization.
- `MCP_API_KEY_FILE`: clients must send a key from this file as `X-API-Key`
  (or `Authorization: Bearer`); other requests get 401. `/healthz` stays open.
- Only the read-only `inspect` skill is granted, and the gateway exposes only
  eight of its tools: `find_projects`, `search_issues`, `get_issue_details`,
  `get_event_stacktrace`, `search_issue_events`, `get_issue_tag_values`,
  `find_releases`, `get_release_details`. Calls to any other tool are refused
  by the gateway before they reach the server.

The gateway runs stateless: each MCP request starts the server process, which
costs about a second per call, and keeps no session state between requests.

No LLM key is configured, so the server's "AI-powered" natural-language search
is off; `search_issues` and `search_issue_events` take Sentry query syntax
(`is:unresolved`, `level:error`, ...), which the assistant's model writes itself.

Build: `docker build -t sentry-mcp royal-road/plugins/sentry-mcp`. CI
(`.github/workflows/royal-road-sentry-mcp.yml`) pushes
`ghcr.io/royal-road/sentry-mcp:<short-sha>` and `:main` from `main`.

To update: change the versions in `package.json`, run
`npm install --package-lock-only --ignore-scripts`, list the tools again
(`tools/list` over stdio with `--skills inspect`), and check that the names in
`entrypoint.sh` still exist and are read-only.

Deployment: `royal-road/deploy/lightspeed/55-sentry-mcp.yaml`, and the
"Sentry tools" section of `royal-road/deploy/lightspeed/README.md`.
