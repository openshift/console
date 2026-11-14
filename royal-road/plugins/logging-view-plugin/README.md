# logging-view-plugin build (VictoriaLogs)

Builds [openshift/logging-view-plugin](https://github.com/openshift/logging-view-plugin) with patches that make it read VictoriaLogs instead of a LokiStack, plus `vl-tenancy-proxy`, which restricts every query to the namespaces the user may read pod logs in. The plugin provides Observe › Logs (admin and developer perspectives) and the Pod "Aggregated Logs" tab.

| File | Purpose |
|---|---|
| `upstream.env` | Upstream repository, branch and pinned commit. |
| `patches/` | `git apply`-able patches, applied in name order on top of the pinned commit. |
| `vl-tenancy-proxy/` | Our Go service (own module, with tests). Built into the same image as `/opt/app-root/vl-tenancy-proxy`. |
| `Dockerfile` | Build on public images (`node:22`, `golang:1.26`, `ubi9/ubi-minimal`). The build context is this directory; the source is fetched at `UPSTREAM_COMMIT`. The build runs the proxy's tests. |
| `dev/` | Kind stand-in for production's logging (`kind-demo.sh`) and a log shipper with Alloy's labels (`push-logs.py`). |

CI: `.github/workflows/royal-road-logging-view-plugin.yml` builds on pull requests that touch this directory and pushes `ghcr.io/royal-road/logging-view-plugin:<short-sha>` and `:main` from `main`.

## Branch

`release-coo-ocp-4.22`: the Cluster Observability Operator line for OpenShift 4.22 and later. There is no branch per console release (the plugin ships with COO, not with OpenShift), and 4.22 is the newest line. It is `main` plus dependency fixes, merged back regularly, and it builds against `@openshift-console/dynamic-plugin-sdk` 4.22, which console 5.0 loads. `main` would work too; the release branch moves more slowly, which makes rebasing the patches cheaper.

## Patches

Each patch is one concern and builds and passes upstream's unit tests on its own.

1. `0001-add-vlogs-schema.patch`: a third label schema, `vlogs`, next to ViaQ and OTel, and the default. Production's Grafana Alloy sends the stream fields `namespace`, `pod`, `container`, and `level` (alloy-modules' log-levels module, raw spellings such as `INFO`, `ERR`, `warning`, `unknown`). Severity matching becomes case-insensitive and knows those spellings. The default query is `*`.
2. `0002-generate-logsql.patch`: the query model. `logsql-query.ts` replaces the LogQL parser for everything the UI writes: the stream selector stays `{ label="value" }` (valid LogsQL), the content filter becomes the substring filter `*"text"*`, and the severity filter becomes `level:~"(?i)^(error|err|…)$"`. Filters the user typed and pipes after the first top-level `|` are kept. The tenant is no longer written into the query. Upstream's tests for the LogQL output are rewritten for LogsQL.
3. `0003-query-victorialogs.patch`: `loki-client.ts` keeps its exports but calls VictoriaLogs' `/select/logsql/*` endpoints under the same `/api/logs/v1/<tenant>` prefix and converts the answers into the Loki shapes the pages render: `query` (JSON lines → streams, `limit` for newest first, `| sort by (_time) | limit N` for oldest first), `hits` (histogram by `level`, and the volume graph), `stats_query_range` (a query with a `| stats` pipe is charted like a LogQL metric query), `stream_field_values` and `streams` (filter dropdowns), and `tail` (live tail, read as a stream instead of Loki's websocket).
4. `0004-drop-audit-tenant-and-ruler-alerts.patch`: no audit tenant (there are no audit logs), and no Loki ruler alert sources in the monitoring plugin's Alerting pages (VictoriaLogs has no Loki ruler; they only produced failing requests).

The plugin's Go backend is unchanged: it serves the static files and `/config`.

## Tenancy proxy

The bridge proxies `/api/proxy/plugin/logging-view-plugin/backend/*` to the proxy with the user's bearer token (`"authorize": true` in `BRIDGE_PLUGIN_PROXY`). For each request to `/api/logs/v1/<tenant>/select/logsql/<endpoint>`:

1. It requires a bearer token and runs a TokenReview.
2. It runs a SubjectAccessReview for `get pods/log` in all namespaces. If that is allowed (cluster-admins, anyone with a ClusterRoleBinding granting it), the user sees every namespace. Otherwise it lists namespaces and checks each one; the user sees the ones allowed. Reviews are cached for 30 s per token and user.
3. It drops any `extra_filters` / `extra_stream_filters` the client sent, adds `extra_stream_filters={namespace in ("a","b")}` for a restricted user and the tenant's filter (`application`: namespace not matching `openshift-.*|openshift|default|kube-.*`; `infrastructure`: matching, the LokiStack definition), and forwards the request as a form POST with no client headers (no token, no `AccountID`/`ProjectID`).

VictoriaLogs parses each `extra_stream_filters` value on its own, ANDs it with the query and applies it to subqueries too (`union`, `join`, `in(...)`), so a query cannot widen it. Only the endpoints that apply extra filters are reachable (`query`, `hits`, `facets`, `field_names`, `field_values`, `stream_field_names`, `stream_field_values`, `streams`, `stats_query`, `stats_query_range`, `tail`); `query_time_range`, `tenant_ids`, vmui and `/insert` return 404. A user without access in any namespace gets 403. Logs without a `namespace` field (for example apps pushing to VictoriaLogs themselves) are visible only to unrestricted users, in the application tenant.

No existing component fit: vmauth can add `extra_filters` per user, but only for statically configured users and tokens, with no TokenReview or SubjectAccessReview. kube-rbac-proxy plus a label injector (OpenShift's monitoring pattern) checks one namespace from a query parameter, so "all namespaces I can read" would still need a component like this one, and no LogsQL injector exists.

## Bumping upstream

1. Update `UPSTREAM_COMMIT` (and `UPSTREAM_BRANCH` if a newer COO line exists) in `upstream.env`.
2. `docker build .` in this directory fails if a patch doesn't apply. To rework one: clone upstream at the new commit, `git am patches/*.patch`, fix, then regenerate with `git format-patch --zero-commit --no-signature <commit>` and rename to the existing file names.
3. Run upstream's unit tests on the patched tree (`cd web && npm ci && npm run test:unit`) and the kind check in `royal-road/deploy/README.md` ("Logging plugin").

Where conflicts are likely: `attribute-filters.tsx` and `loki-client.ts` (patches 2 and 3 replace the LogQL-specific functions wholesale; upstream changes to them must be redone in LogsQL), and upstream's tests of those files.
