# Royal Road console fork changelog

Newest first. One entry per work package from `FORK.md`.

## Sessions survive console rollouts

- Core patch: bridge flag `--session-secret-namespace` (`BRIDGE_SESSION_SECRET_NAMESPACE`, `session.sessionSecretNamespace` in the config file; OIDC only). Each login session is written to its own Secret in that namespace and loaded from it on a memory miss, so a restart, rollout or another replica no longer signs users out. The Secret is authoritative: a login or token refresh reaches memory and cookies only after its Secret write succeeds, and a session without a Secret is logged out; replicas re-read it before refreshing a token, so a logout reaches them by their next refresh, and a refresh token cookie without its session cookie never refreshes. The Secret client has its own 50 QPS limit (client-go's default is 5). Within a Pod, loads, token updates and logouts of one session are serialised by a per-session lock, and API calls never hold the global session lock. The session cookie loses its Pod-name suffix when this is on. Unset, behaviour is unchanged.
- `royal-road/deploy/session-store.yaml`: the `console-sessions` namespace and a Role for the console ServiceAccount; `console-deployment-patch.yaml` sets the env var. README "Session store" covers token storage, pruning, the one-time sign-out on the first rollout, and rollback.
- Go tests with the fake clientset: restart, refresh-token lookup after restart, token rotation, logout (on another replica, replayed with only the refresh cookie, and racing a refresh or a cold load on the same Pod), failed Secret create, update and delete, concurrent refreshes on two replicas, a hung Secret update not blocking other users, pruning, cookie names, flag validation.

## Fix: empty graphs on platform alert details

- Observe › Alerting › alert details showed "No datapoints found" for most platform alerts although the query returned data. The graph drops series whose labels differ from the alert's. Platform rules set `prometheus: openshift-monitoring/k8s` (the plugin reads it for Source: Platform), while vmagent writes its own `prometheus` external label on every series. vmalert keeps the series' value on the alert as `exported_prometheus`. monitoring-plugin patch `0002-match-exported-labels-in-alert-graph.patch` also accepts a series whose label matches the alert's `exported_<label>`. With Prometheus, alerts carry no `exported_*` labels, so nothing changes there.

## Web Terminal on Kubernetes

- `royal-road/deploy/web-terminal/` installs the DevWorkspace Operator (v1.1.0) and the Web Terminal Operator (1.18.0, the only public build) through OLM from their own index images, pinned by digest, with `installPlanApproval: Manual`. Neither is in the operatorhub.io catalog. cert-manager stands in for the OpenShift service CA. The README covers apply order, RBAC, resources and idle timeout, known issues and rollback.
- DWO serves the console's `routingClass: web-terminal` only on OpenShift. `royal-road/web-terminal-routing/` is an external DevWorkspaceRouting solver for `web-terminal-k8s`: a Service, a cert-manager serving certificate mounted at `/var/serving-cert/`, and an https URL, as DWO's cluster-TLS solver does on OpenShift. CI: `.github/workflows/royal-road-web-terminal-routing.yml` pushes `ghcr.io/royal-road/web-terminal-routing`.
- Core patch: bridge flag `--web-terminal-routing-class` (`BRIDGE_WEB_TERMINAL_ROUTING_CLASS`, default `web-terminal`) sets the class the frontend puts on new terminals.
- Core patch: the terminal setup form lists Namespaces, creates Namespaces and searches Namespaces for an existing terminal when the OpenShift project API is absent. Before, the namespace dropdown showed "Error loading".
- Needs an API server change: with the legacy `--oidc-*` flags OIDC users have no UID, which DWO and the exec container require. The README gives the equivalent `AuthenticationConfiguration` with `uid` mapped to `sub`.
- Verified on kind (Kubernetes 1.36.1, OLM v0.46.0, cert-manager v1.21.3, Dex with the structured authentication config, bridge in-cluster with OIDC): a cluster-admin and a namespace-scoped user each opened a terminal and ran `kubectl` as themselves; other users and cluster-admins are refused another user's terminal; idle stop, restart, deletion and the rollback steps work.
## Lightspeed: Sentry tools

- `royal-road/deploy/lightspeed/55-sentry-mcp.yaml`: getsentry's Sentry MCP server, so the assistant can read Sentry issues and events next to the cluster state ("why is my-app erroring?"). It runs with one read-only service token (internal integration: `org:read`, `project:read`, `event:read`) from the Secret `lightspeed-sentry`, only the server's read-only `inspect` skill, and only 8 of its tools. OLS authenticates with an API key file; NetworkPolicies admit only OLS and allow egress only to sentry-web. Lightspeed users (cluster-admins by default) all see the same Sentry data; the README records that access model.
- `royal-road/plugins/sentry-mcp/`: the image. `@sentry/mcp-server` 0.49.0 speaks stdio only, so `supergateway` 4.2.2 serves it over streamable HTTP; both pinned in `package-lock.json`. `.github/workflows/royal-road-sentry-mcp.yml` pushes `ghcr.io/royal-road/sentry-mcp`.
- `40-ols-config.yaml` adds the `sentry` MCP server and a system-prompt paragraph on combining workload state with Sentry issues. `42-ols.yaml` mounts the API key from an optional volume: without the Secret OLS runs as before.
- Verified on kind against the real self-hosted Sentry and GPUStack: tool calls, real issue titles in the console chat, API key, NetworkPolicies.

## Lightspeed documentation (BYOK RAG)

- Cloudflare developer docs (CC BY 4.0, attribution in the image's `/SOURCES.md`) for the products the zones use or are evaluating, linked to developers.cloudflare.com. Unversioned, so `weekly_commit` pins the last commit before each ISO week: at most one rebuild a week. `mdx.py` turns Starlight MDX into Markdown (partials inlined, API requests as code blocks, links absolute). Sources now fetch only the included subtrees.
- `royal-road/deploy/lightspeed/docs/`: OLS answers from two FAISS indexes (`ols_config.reference_content`): our docs (git-tracked Markdown of royal-road/infrastructure, `FORK.md`, `royal-road/**/README.md`, `CHANGELOG.md`, `WP6-TRIAGE.md`) and upstream docs (Kubernetes, Tekton Pipelines/Triggers, Pipelines-as-Code, Rook, cert-manager, VictoriaMetrics/operator/Logs/Traces, Velero, Istio) **at the versions the cluster runs**. Every chunk carries its title and a link (versioned upstream page, or the GitHub file), which OLS returns as `referenced_documents`; the system prompt makes the model prefer our docs for questions about this cluster and cite them.
- Tekton Pipeline `lightspeed-docs-index`: a discover Task reads the Kubernetes version and the image tags of named workloads (`sources.yaml`, installed as a ConfigMap; read-only ClusterRole with `resourceNames`, generated from it), renders the docs refs, and fingerprints versions + our Markdown + tooling. If `<image>:fp-<hash>` exists it skips the build; otherwise it fetches the docs, runs gitleaks and a secret gate on every chunk (a finding in our docs fails the build), embeds with the OLS image itself (same llama-index, FAISS and all-mpnet-base-v2 as at query time), and pushes a `FROM scratch` image with buildah from `tekton-catalog`. A rollout Task then patches OLS's image volume to the new digest and restores the previous one if OLS doesn't turn Ready. Concurrent runs are ordered by discovery time. Triggers: a daily CronJob, and Pipelines-as-Code on pushes to royal-road/infrastructure that change Markdown (`tekton/pac/`). Nothing needs a release when the cluster is upgraded.
- `42-ols.yaml` mounts the index as an image volume (GA in Kubernetes 1.36) at `/rag`; OLS memory request/limit raised to 1.5/3 GiB (1.1 GB resident with the full index). `40-ols-config.yaml`: `reference_content` and the documentation rules in the system prompt.
- Embeddings on a GPU by default: an OpenAI-compatible `/v1/embeddings` serving the same all-mpnet-base-v2 weights (GPUStack + Infinity, fp32 without TF32), used only after a parity gate against the local model (cosine >= 0.999 and identical top-5 for 20 questions on a 200-chunk sample); CPU fallback within a time budget; `embedder: cpu` keeps the CPU path. Text-embeddings-inference was rejected by the gate (tanh GeLU).
- Full index for production versions: 15,835 chunks, 102 MB. Unit tests and `.github/workflows/royal-road-lightspeed-docs.yml` (in the pinned OLS image).
- Verified on kind (Kubernetes 1.36.1, Tekton v1.15.5, the real GPUStack model): bootstrap from the placeholder, a skipped run when nothing changed, a Rook operator image bump picked up by the next scheduled run and rolled out with no manual step, rollback on a broken index, ordering of concurrent rollouts, and answers citing the versioned docs.

## Perses dashboards without the Cluster Observability Operator

- Observe › Dashboards (Perses) (`/monitoring/v2/dashboards`): `royal-road/deploy/monitoring-console-plugin.yaml` runs the `monitoring-console-plugin` image COO 1.5.2 ships for consoles ≥ 4.22 (v1.0.0, digest-pinned, `-features=perses-dashboards`) next to our `monitoring-plugin`. No build change: the image already has the plugin name, i18n namespace and proxy path the Perses pages hard-code. COO 1.4's plugin (v0.5.3, react-router 5) fails on this console.
- `royal-road/deploy/perses/` (kustomize, namespace `perses`): COO 1.5.2's Perses CRDs, perses-operator v0.4.0 and a `Perses` v0.54.0 instance configured as COO's UIPlugin reconciler does (Kubernetes TokenReview authentication and SubjectAccessReview authorization, file database), with cert-manager instead of OpenShift's service CA; aggregated roles (`view` reads, `edit` edits dashboards, `admin` edits datasources, global datasources cluster-admin only); a global datasource on thanos-querier 9091 and a per-namespace datasource on the 9092 tenancy port. Perses forwards the user's own token, so tenancy stays with kube-rbac-proxy and prom-label-proxy. `plugin-proxy.sh` adds the Perses route to an existing `BRIDGE_PLUGIN_PROXY`.
- Security findings encoded in the manifests: an egress NetworkPolicy, because a dashboard editor could otherwise send viewers' tokens to any URL (reproduced on kind); `create pods.metrics.k8s.io` for namespace roles, because Perses queries with POST and kube-rbac-proxy maps that to `create`. The tenancy prom-label-proxy needs `--enable-label-apis` for dashboard variables.
- Running COO itself was tried on kind and rejected: it needs `config.openshift.io` APIServer and ClusterVersion, the Console operator CR, service-CA certificates and OLM (README "Perses dashboards").
- Verified on kind with the console image in-cluster as a cluster-admin and as a namespace user, 29 migrated dashboards and a kube-rbac-proxy/prom-label-proxy thanos-querier stand-in.

## Tekton Results for the pipelines plugin

- Core patch: the bridge's `/api/dev-console/tekton-results/*` proxy took its CA from `/var/serving-cert/tls.crt` (OpenShift's service CA) and, off-cluster, its host from a `route.openshift.io` Route. New flags `--tekton-results-ca-file` / `BRIDGE_TEKTON_RESULTS_CA_FILE` (same default) and `--tekton-results-api-host` / `BRIDGE_TEKTON_RESULTS_API_HOST` (empty: unchanged lookup). Unit test for both. Candidate for upstream.
- `royal-road/deploy/README.md` ("Tekton Results"): how the plugin detects Results (per user, needs read on `tektonresults.operator.tekton.dev`, which the operator's Helm chart does not grant), the proxy address and CA, the Results API's SubjectAccessReview and the aggregated roles, and the user-settings namespace the PipelineRuns list depends on. The plugin README points there.
- Verified on kind: Tekton operator Helm chart 0.81.3 with Results v0.20.0 (CloudNativePG database, cert-manager certificate, file logs), console in-cluster with the CA flag and the pipelines plugin: pruned runs listed and their logs shown, Overview without "Data is incomplete", a `view`-only user allowed in its namespace and refused elsewhere, and `x509: certificate signed by unknown authority` without the right CA.

## Fix: Control Plane status on kubeadm

- The Overview's Control Plane item queried OpenShift-only namespaces, so API Servers, Controller Managers and Schedulers showed "Unknown". The queries now match on the job (and kubeadm's `kube-system/kube-apiserver-<node>` pods for the API server count).

## Logs from VictoriaLogs: logging-view-plugin and vl-tenancy-proxy

- `royal-road/plugins/logging-view-plugin/` builds openshift/logging-view-plugin from `release-coo-ocp-4.22` (pinned commit) with four patches that make it read VictoriaLogs: a `vlogs` label schema (`namespace`, `pod`, `container`, `level`) as default, LogsQL instead of LogQL, VictoriaLogs' `/select/logsql` endpoints (query, hits histogram, stats graphs, field values, live tail), and no audit tenant or Loki ruler alert sources. Observe › Logs (admin and developer) and the Pod "Aggregated Logs" tab work.
- `vl-tenancy-proxy` (Go, in the same image) takes the user's token from the bridge's plugin proxy, checks it with a TokenReview and `get pods/log` SubjectAccessReviews, and adds the allowed namespaces and the tenant (application / infrastructure) to every query as VictoriaLogs `extra_stream_filters`. Client-sent extra filters and tenant headers are dropped; endpoints that ignore extra filters are not reachable.
- `royal-road/deploy/logging-view-plugin.yaml` (Deployment with both containers, RBAC, NetworkPolicies) and the "Logging plugin" section of `royal-road/deploy/README.md` with the `BRIDGE_PLUGINS` and `BRIDGE_PLUGIN_PROXY` values. `.github/workflows/royal-road-logging-view-plugin.yml` pushes `ghcr.io/royal-road/logging-view-plugin`.
- Verified on kind with VictoriaLogs v1.53.0 and Alloy-labelled logs in three namespaces; a namespace-limited ServiceAccount sees only its namespace.

## Lightspeed AI assistant

- `royal-road/deploy/lightspeed/`: OpenShift Lightspeed without the operator, in namespace `openshift-lightspeed`. OLS (public image pinned by digest) talks to a GPUStack model over chat completions (`openai` provider with `use_responses_api: false`) and calls a read-only kubernetes-mcp-server (v0.1.3) with the user's own token. HTTPS from the bridge to OLS uses a namespace-local cert-manager CA passed to the bridge in `BRIDGE_PLUGIN_PROXY` (`plugin-proxy.sh` prints the value). NetworkPolicies admit only console → OLS/plugin and OLS → MCP; an optional policy also restricts OLS egress. Cluster-admins can use it with no binding; `optional/query-access-binding.yaml` widens access. README covers apply order, the bridge env values and rollback.
- `royal-road/plugins/lightspeed-service/rr_ols_shim.py`, mounted from a ConfigMap: OLS exits without OpenShift's ClusterVersion and returns 500 to every user without a TokenReview UID (all Dex users). The shim sets a fixed cluster ID and derives a UUIDv5 from the username. Unit tests, and `.github/workflows/royal-road-lightspeed-service.yml` also checks the patches still apply to the pinned OLS image.
- `royal-road/plugins/lightspeed-console-plugin/` builds openshift/lightspeed-console `main` (the build for console 4.22+) on public images; `.github/workflows/royal-road-lightspeed-plugin.yml` pushes `ghcr.io/royal-road/lightspeed-console-plugin`. No patches.
- `royal-road/deploy/crds/ols.openshift.io_olsconfigs.yaml` (lightspeed-operator) and an inert `OLSConfig/cluster` turn on core's "Ask OpenShift Lightspeed" button in the YAML editor. CRD verdict added to FORK.md.
- Verified on kind with the console image running in-cluster with Dex OIDC and the real GPUStack model: streamed answer, tool call, 403 for non-admins, tools forbidden by the user's own RBAC, YAML editor button, NetworkPolicies.
## Pipelines plugin: Tekton pages via openshift-pipelines/console-plugin

- `royal-road/plugins/pipelines-console-plugin/` builds openshift-pipelines/console-plugin from `release-5.0` (pinned commit in `upstream.env`) with three patches, on public images: `node:22` to build, `ubi9/nginx-126` to serve plain HTTP on 8080. Upstream publishes images only for `main` and its operator branches.
- Patch 0001 makes the hard-coded `openshift-pipelines` namespace a build argument. It is split in two: `CLUSTER_RESOLVER_TASK_NAMESPACE` (shared Tasks the pipeline builder offers through the cluster resolver; ours: `tekton-catalog`) and `PIPELINE_NAMESPACE` (Pipelines-as-Code; ours: `pipelines-as-code`). Patch 0002 stops **Add Trigger** from creating a Route when `route.openshift.io` is absent. Patch 0003 backports upstream's fix for an intermittent crash of the PipelineRun Logs tab. All three are candidates for upstream.
- `.github/workflows/royal-road-pipelines-plugin.yml` pushes `ghcr.io/royal-road/pipelines-console-plugin:<short-sha>` and `:main` on `main`.
- `royal-road/deploy/pipelines-console-plugin.yaml` and the `## Pipelines plugin` section of `royal-road/deploy/README.md` cover the Deployment, the Service and the `BRIDGE_PLUGINS` value (`pipelines-console-plugin=...`). `pipelines-consoleplugin.yaml` lists it on the Dynamic Plugins page. It isn't part of the cutover: deploy it once Tekton has a control plane again.
- Verified on kind with Tekton Pipelines v1.18.0 and Triggers v0.38.0: lists, details, logs, the builder (catalog Tasks from `tekton-catalog`, saved as cluster resolver references), Triggers, Add Trigger, and topology. Without the Tekton CRDs the plugin adds nothing.

## Readable error page traces

- `CONSOLE_KEEP_NAMES=1` (set in `royal-road/Dockerfile`) keeps function and class names in the minified bundles, so React component traces name real components. JS grows from 14.29 MB to 15.30 MB raw (+7.1%) and from 4.05 MB to 4.19 MB gzip (+3.6%). Unset, the build is unchanged from upstream.
- The error details modal maps component and stack trace locations to source files with the source maps the console already serves. A switch shows the raw traces, and the copy button copies both. If a map can't be fetched, the raw trace is shown.

## Fix: alerting rules without an `alerts` list

- VictoriaMetrics' rules API omits `alerts` on inactive alerting rules (Prometheus sends `[]`). Core's `getAlertsAndRules` and monitoring-plugin's copy of it now treat the missing field as an empty list. Before, Topology crashed with "Cannot read properties of undefined (reading 'forEach')" once metrics were reachable.

## Kubernetes branding and the Dynamic Plugins page

- Branding by configuration only: `royal-road/deploy/console-branding-configmap.yaml` holds the CNCF Kubernetes logos (masthead light and dark, favicon), and `console-deployment-patch.yaml` mounts it and sets `BRIDGE_CUSTOM_LOGO_FILES`, `BRIDGE_CUSTOM_FAVICON_FILES` and `BRIDGE_CUSTOM_PRODUCT_NAME=Kubernetes`. `BRIDGE_BRANDING` stays `okd`. The two masthead SVGs get a `width`/`height` on the root element; with only a `viewBox` they render 0×0 in the masthead.
- Administration › Dynamic Plugins no longer shows "Model does not exist". `royal-road/deploy/crds/90_consoleplugins.crd.yaml` (openshift/api, same pin) and `consoleplugins.yaml` describe the plugins `BRIDGE_PLUGINS` loads. `console-extensions-reader.yaml` replaces the ClusterRole that was in `ceph-dashboard-consolelink.yaml` and adds read access to `consoleplugins`.
- Core patch: when `consoles.operator.openshift.io` is absent, the Dynamic Plugins nav item and the Overview popover's "View all" open the ConsolePlugin list, the Enabled state comes from the bridge's plugin list, and the enable/disable and bulk controls are hidden (they would patch the missing operator config). Without the ConsolePlugin CRD the nav item is hidden.

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
