# Royal Road console fork changelog

Newest first. One entry per work package from `FORK.md`.

## WP8: Deployment hand-off

- `royal-road/deploy/README.md` starts with the cutover order: plugins, CRDs and the resources that use them, then the console Deployment switch, verification, and rollback. The 2021 console keeps running until parity is confirmed.
- `royal-road/deploy/console-deployment-patch.yaml` switches an existing stock console Deployment to this image, adds `BRIDGE_PLUGINS` for both plugins and a `/health` readiness probe, and leaves every other setting alone.
- `royal-road/dev/run-bridge.sh` gives the bridge its own ServiceAccount token file and trusts the kind API server's CA, so dashboards and user settings work off-cluster.

## WP4: Observe pages via monitoring-plugin (part B)

- `royal-road/plugins/monitoring-plugin/` builds openshift/monitoring-plugin from `release-5.0` (pinned commit in `upstream.env`) on public images: `node:22` and `golang:1.26` to build, `ubi9/ubi-minimal` to run. No published image matches 5.0: quay.io only has development tags, and upstream's Dockerfiles need Red Hat registry credentials. No patches are needed.
- The plugin's Go backend serves the static bundle and patches the manifest for the enabled features (`alerting,metrics,legacy-dashboards,targets`). It hard-codes no Thanos or Alertmanager host. The frontend uses the bridge's `/api/prometheus{,-tenancy}` and `/api/alertmanager{,-tenancy}` proxies, so no `BRIDGE_PLUGIN_PROXY` is needed.
- `.github/workflows/royal-road-monitoring-plugin.yml` pushes `ghcr.io/royal-road/monitoring-plugin:<short-sha>` and `:main` on `main`.
- `royal-road/deploy/monitoring-plugin.yaml` adds the Deployment and Service (plain HTTP on 9443), the `openshift-config-managed` namespace, and a Role that lets the bridge read dashboard ConfigMaps there. `monitoring-dashboard-example.yaml` is a sample dashboard. The `## Monitoring plugin` section of `royal-road/deploy/README.md` covers the `BRIDGE_PLUGINS` value, the endpoints each page calls, tenancy, the `prometheus="openshift-monitoring/k8s"` label the Alerting pages' default "Platform" filter needs, and the checks left for production.
- Verified on kind: alerts, silences (create through the bridge, list), alerting rules, metrics query, dashboards and targets. A namespace-scoped user's requests go to the tenancy paths with `namespace=<ns>`.

## WP5: Faster Helm release listing

- `/api/helm/releases` no longer decodes superseded release Secrets. It lists Secrets with `status!=superseded` and decodes only the highest revision of each release, then applies Helm's `action.List` as before. The JSON is unchanged.
- On kind with 600 release Secrets (90% superseded), the all-namespaces list went from about 263 ms to 34 ms (`limitInfo=true`) and from 268 ms to 42 ms (full releases).
- Topology still fetches full releases.

## WP6: Triage the old fork's fixes

- `royal-road/WP6-TRIAGE.md` gives a verdict and evidence for every Royal Road commit on `legacy/kubernetes-console-2022`.
- `royal-road/deploy/user-settings.yaml`: the `openshift-console-user-settings` namespace and the console-operator's Role, bound to the console ServiceAccount. Without them, every page load makes about 30 failing `POST /api/console/user-settings` calls, and preferences stay in the browser.
- `royal-road/deploy/monitoring/console-recording-rules.yaml`: eight recording rules that core's pod, namespace, cluster and node graphs query, which only OpenShift's monitoring stack defines. Packaged as a VMRule, with a promtool unit test. The pod network rules drop OpenShift's `pod_network_name_info` join.
- Core patch: `CAN_CREATE_PROJECT` is set to `false` when the project API returns 404. Before, the flag stayed pending on Kubernetes, which left the User Preferences "Project" field and every namespace dropdown (`NsDropdown`) loading forever.

## WP3: Networking via networking-console-plugin

- `royal-road/plugins/networking-console-plugin/` builds openshift/networking-console-plugin from `release-5.0` (pinned commit in `upstream.env`) with our patches. It uses public images: `node:22` to build, `ubi9/nginx-126` to serve plain HTTP on 8080. No published image matches 5.0; OKD's payload build is a pre-release from August 2026 with no stable tag.
- `.github/workflows/royal-road-networking-plugin.yml` pushes `ghcr.io/royal-road/networking-console-plugin:<short-sha>` and `:main` on `main`.
- Patch 0001 hides Routes unless `route.openshift.io` exists (`console.flag/model`). Patch 0002 fixes the 404 on **Create Ingress** and **Edit Ingress** (plural URL with no static Ingress model in core). Both are candidates for upstream.
- `royal-road/deploy/networking-console-plugin.yaml` and the `## Networking plugin` section of `royal-road/deploy/README.md` cover the Deployment, the Service, and the `BRIDGE_PLUGINS` value. It runs over plain HTTP in-cluster because there is no service CA.

## WP7: Ceph dashboard link

- `royal-road/deploy/crds/00_consolelinks.crd.yaml` from openshift/api at the console's `go.mod` pin.
- `royal-road/deploy/ceph-dashboard-consolelink.yaml`: an `ApplicationMenu` ConsoleLink ("Storage" › "Ceph dashboard", placeholder URL), plus read-only RBAC so non-admin users see it.
- No storage-sidebar plugin: the application menu link is enough (decision recorded in `royal-road/deploy/README.md`).

## WP5 (item 2): ProjectHelmChartRepository CRD

- `royal-road/deploy/crds/00_projecthelmchartrepositories.crd.yaml` from openshift/api at the console's `go.mod` pin. Without it the Helm pages still worked, but every Helm page polled a 404, and the bridge logged an error on each chart index request.
- Core patch (helm-plugin): the Helm detection provider listed ProjectHelmChartRepositories at `.../namespaces/#ALL_NS#/...` when "All namespaces" was selected. The `#` truncates the URL, so the request 404'd every 10 seconds whether or not the CRD exists. It now lists across all namespaces.

## WP2: Known gating fixes

- Home > Overview (`/dashboards`) no longer requires the `OPENSHIFT` flag. It still requires `CAN_GET_NS`, `PROMETHEUS` (the `monitoring.coreos.com` `Prometheus` CRD exists) and `MONITORING` (the bridge has Thanos proxies configured).
- The cluster dashboard's Details card fetches the Kubernetes version from `/api/kubernetes/version`. The relative `version` URL resolved to `/version`, which the bridge answers with the console's HTML page, so the card always showed "Not available".

## WP4: Observe menu and configurable monitoring endpoints

- Part A (core patch): the in-cluster Thanos and Alertmanager proxy hosts are configurable through `--thanos-host`, `--thanos-tenancy-host`, `--thanos-tenancy-for-rules-host` and `--alertmanager-host` (`BRIDGE_THANOS_HOST` and so on). The defaults are the old hard-coded hosts. A unit test in `cmd/bridge/monitoring_test.go` checks the defaults and the overrides. The env vars are documented in `royal-road/deploy/README.md`.

## WP0: CI and image publishing

- `.github/workflows/royal-road-image.yml` builds `royal-road/Dockerfile` on pull requests and pushes to `main`. On `main` it pushes `ghcr.io/royal-road/console:<short-sha>` and `:main`.
- The bridge version string is the short commit SHA. The repository's tags date from Tectonic, so `git describe` would report a misleading `v6.0.6-…`.

## WP1: Buildable Dockerfile with public base images

- `royal-road/Dockerfile` keeps upstream's three stages on public images: `golang:1.26`, `node:22` (corepack enabled; Yarn comes from the repository's `yarnPath`), and `ubi9/ubi-minimal`.
- `royal-road/Dockerfile.dockerignore` excludes `.git`, `node_modules` and local build output. BuildKit picks it up instead of the root `.dockerignore` when building with `-f royal-road/Dockerfile`.
