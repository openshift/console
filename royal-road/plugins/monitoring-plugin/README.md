# monitoring-plugin build

Builds [openshift/monitoring-plugin](https://github.com/openshift/monitoring-plugin) for the console fork (FORK.md, WP4 part B). The plugin provides the Observe pages: Alerting (alerts, silences, alerting rules), Metrics, Dashboards and Targets.

| File | Purpose |
|---|---|
| `upstream.env` | Upstream repository, branch and pinned commit. |
| `patches/` | `git apply`-able patches, applied in name order on top of the pinned commit. See [Patches](#patches). |
| `Dockerfile` | Build on public images (`node:22`, `golang:1.26`, `ubi9/ubi-minimal`). The build context is this directory; the source is fetched at `UPSTREAM_COMMIT`. |

CI: `.github/workflows/royal-road-monitoring-plugin.yml` builds on pull requests that touch this directory and pushes `ghcr.io/royal-road/monitoring-plugin:<short-sha>` and `:main` from `main`.

## Why we build it

No public image of the `release-5.0` branch exists. Upstream's own Dockerfiles pull from `registry.redhat.io` (needs a Red Hat login) or OpenShift's CI registry. `quay.io/openshift-observability-ui/monitoring-plugin` only has development tags (`latest`, `devspace-5.0`, PR builds). `quay.io/openshift/origin-monitoring-plugin` needs credentials.

## Differences from upstream's build

- Public base images instead of `registry.redhat.io/ubi9/nodejs-22` and `ubi9/go-toolset`.
- `CGO_ENABLED=0` without `GOEXPERIMENT=strictfipsruntime`. Upstream's FIPS mode needs Red Hat's OpenSSL-backed Go toolchain.
- Same runtime layout and entrypoint (`-features alerting,metrics,legacy-dashboards,targets`).

## Patches

Both make the plugin work with VictoriaMetrics: 0001 for a vmalert API difference, 0002 for vmagent's external label clashing with our rule labels.

| Patch | Why |
|---|---|
| `0001-treat-missing-rule-alerts-as-empty.patch` | vmalert's rules API omits `alerts` on an inactive rule; Prometheus sends an empty list. Without the patch Observe › Alerting breaks. |
| `0002-match-exported-labels-in-alert-graph.patch` | The alert details graph drops every series whose labels differ from the alert's. Our platform rules set `prometheus: openshift-monitoring/k8s` (the plugin reads that label to show Source: Platform), but vmagent labels every series with its own external label `prometheus=<namespace>/<vmagent name>`. vmalert keeps the series' value on the alert as `exported_prometheus`, so the patch accepts a series whose label matches the alert's `exported_<label>`. Without it the graph says "No datapoints found" on every platform alert whose query keeps the `prometheus` label, which is most of them. |

## What the plugin needs at runtime

- **No hosts are hard-coded in the plugin.** Its Go backend serves the static bundle and patches `plugin-manifest.json` for the enabled features. It proxies to Thanos or Alertmanager only in the `acm-alerting` feature, and there the URLs are flags (`-thanos-querier`, `-alertmanager`). We don't enable that feature.
- The frontend calls the bridge: `/api/prometheus`, `/api/prometheus-tenancy`, `/api/alertmanager` and `/api/alertmanager-tenancy` (base URLs from `SERVER_FLAGS`), and `/api/console/monitoring-dashboard-config` for dashboards. It doesn't use `/api/proxy/plugin/...`. Those paths belong to the separate `monitoring-console-plugin` (COO features: Perses, incidents, ACM).
- It chooses the tenancy paths per user. It runs a SelfSubjectAccessReview for `get` on `prometheusrules.monitoring.coreos.com` (alerts) and on `prometheuses/api` named `k8s` (metrics), both in all namespaces. If the user doesn't have it, it uses `/api/*-tenancy?namespace=<ns>`.

## Bumping upstream

1. Pick the upstream branch matching the console's base release (`git ls-remote https://github.com/openshift/monitoring-plugin.git 'refs/heads/release-*'`).
2. Update `UPSTREAM_BRANCH` and `UPSTREAM_COMMIT` in `upstream.env`.
3. Check that each patch in `patches/` still applies: `docker build .` in this directory fails if one doesn't.
4. Re-run the kind check in `royal-road/deploy/README.md` ("Monitoring plugin").
