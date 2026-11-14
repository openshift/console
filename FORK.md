# Royal Road console fork

This repository is Royal Road's fork of [openshift/console](https://github.com/openshift/console). It runs the OpenShift web console on a plain upstream Kubernetes cluster (kubeadm, no OpenShift APIs). The goal is a console that matches upstream as closely as possible, with every Royal Road change small, isolated and easy to rebase.

This file is the plan and the working instructions. An agent asked to "create the fork" should read all of it, then work through the work packages in order.

## Rules

- **This repository is public.** Never commit secrets, tokens, internal hostnames, IP addresses, or details of the production cluster beyond what is written here. Deployment manifests use placeholders.
- **No production cluster access.** Agents working from this file do not touch the production cluster. Anything that must be applied to the cluster goes into `royal-road/deploy/` with instructions, and the owner applies it.
- **Prefer configuration and plugins over patches.** Order of preference:
  1. bridge configuration (flags or `BRIDGE_*` env)
  2. installing self-contained OpenShift CRDs (see [OpenShift CRD policy](#openshift-crd-policy)) and creating resources of those kinds
  3. deploying an existing upstream console plugin
  4. code in our own dynamic plugin (`royal-road/plugin/`)
  5. patches to core, kept to flag gating, model gating, small targeted fixes, and making hard-coded OpenShift endpoints configurable with unchanged defaults
  Never rewrite upstream components. Each patch to core must be a separate, self-explanatory commit, so it survives rebases.
- **Fork-only files live under `royal-road/`** (or `.github/workflows/royal-road-*.yml`) so they never conflict with upstream. Do not edit upstream's `Dockerfile`, `AGENTS.md` or CI files.
- Upstream conventions in `AGENTS.md`, `STYLEGUIDE.md` and `TESTING.md` still apply to code under `frontend/`, `pkg/` and `cmd/`.
- Commit messages: imperative subject, a body that says why. One concern per commit. Never merge upstream into `main`; rebase (see [Rebasing](#rebasing-onto-a-new-upstream-release)).

## Branches and remotes

| Ref | Meaning |
|---|---|
| `main` | Upstream `release-5.0` plus our commits on top. Default branch. |
| `legacy/2021-master` | The original 2021 fork (first commits only). Kept for history. |
| `legacy/kubernetes-console-2022` | The full 2021–2022 fork, based on upstream from December 2021 (about 4.10). It was deployed for years. Source of the fix list in WP6. Do **not** rebase or merge it. |
| `upstream` remote | `https://github.com/openshift/console.git` (add it yourself: `git remote add upstream https://github.com/openshift/console.git`). |

The base is `release-5.0`. Production currently runs the unmodified `quay.io/openshift/origin-console:4.22` image, so the first rollout is also a 4.22 → 5.0 upgrade: our first image must do everything that one does, plus our changes. Every bridge flag production sets (listed under [Target environment](#target-environment)) still exists in 5.0. `release-5.0` still receives upstream fixes; rebase onto its tip regularly (see [Rebasing](#rebasing-onto-a-new-upstream-release)).

## Target environment

What "upstream Kubernetes" means for this fork:

- **Kubernetes:** kubeadm-managed, recent version. CNI is Calico. Public HTTP(S) goes through ingress-nginx.
- **Authentication:** Dex as the OIDC issuer, also used by kube-apiserver. The bridge runs with `BRIDGE_K8S_MODE=in-cluster` and `BRIDGE_USER_AUTH=oidc`, so user requests go to the API server with the user's own token.
- **Bridge configuration** (current production; values omitted):
  - mode and API endpoint: `BRIDGE_K8S_MODE`, `BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT`, `BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS`, `BRIDGE_K8S_MODE_OFF_CLUSTER_SERVICE_ACCOUNT_BEARER_TOKEN_FILE`
  - OIDC: `BRIDGE_USER_AUTH`, `BRIDGE_USER_AUTH_OIDC_ISSUER_URL`, `BRIDGE_USER_AUTH_OIDC_CLIENT_ID`, `BRIDGE_USER_AUTH_OIDC_CLIENT_SECRET`, `BRIDGE_USER_AUTH_OIDC_TOKEN_SCOPES`
  - TLS and branding: `BRIDGE_SERVICE_CA_FILE`, `BRIDGE_BASE_ADDRESS`, `BRIDGE_BRANDING=okd`
  - flags: `--cookie-authentication-key-file`, `--cookie-encryption-key-file`
- **Monitoring:** VictoriaMetrics, not OpenShift monitoring. In `in-cluster` mode the bridge proxies to hard-coded Thanos and Alertmanager hosts (`cmd/bridge/main.go`: `thanos-querier.openshift-monitoring.svc:9091/9092/9093` and `alertmanager-main.openshift-monitoring.svc:9092/9094`). The cluster provides Services with those names and ports. They front VictoriaMetrics and vmalertmanager through oauth2-proxy, kube-rbac-proxy and prom-label-proxy, which handles namespace tenancy. WP4 makes these hosts configurable; **the defaults must stay exactly as they are**, so the current Services keep working with no configuration.
- **OpenShift CRDs present:** only `helmchartrepositories.helm.openshift.io`.
- **OpenShift CRDs absent:** `console.openshift.io` (`ConsolePlugin`, `ConsoleLink` and others), `projecthelmchartrepositories.helm.openshift.io`, `route.openshift.io`, `config.openshift.io` (`ClusterVersion`, `ClusterOperator`), ODF and OCS. `project.openshift.io` and `user.openshift.io` are absent too; they are aggregated OpenShift APIs, not CRDs. The Gateway API CRDs (`gateway.networking.k8s.io`) are not installed either.
- **Storage:** Rook-Ceph (`cephclusters.ceph.rook.io`, Ceph 20.x) with the Ceph mgr dashboard enabled and exposed. NooBaa CRDs are present.
- **Helm:** used heavily. About 250 release Secrets across 35 namespaces, but only about 56 releases. About 72% of the Secrets are `superseded` revisions.

### OpenShift CRD policy

OpenShift CRDs **may** be added to the cluster when they don't rely on OpenShift's own cluster APIs or controllers: the resource is useful when only the console (bridge or frontend) reads it. Ship them from [openshift/api](https://github.com/openshift/api) (`<group>/<version>/zz_generated.crd-manifests/`), pinned to the openshift/api commit matching our console release, in `royal-road/deploy/crds/`. The owner applies them.

| CRD | Verdict | Why |
|---|---|---|
| `projecthelmchartrepositories.helm.openshift.io` | Allowed | Read by the console's Helm backend and frontend only. |
| `console.openshift.io`: `ConsoleLink`, `ConsoleNotification`, `ConsoleYAMLSample`, `ConsoleQuickStart`, `ConsoleCLIDownload`, `ConsoleExternalLogLink`, `ConsoleSample` | Allowed | The frontend reads them directly; each is gated by a feature flag that turns on when the CRD exists (`frontend/public/reducers/features.ts`). |
| `consoleplugins.console.openshift.io` | Allowed, not required | On OpenShift the console-operator turns these into bridge config. Here, `--plugins` (`BRIDGE_PLUGINS`) does that job. Install it only if a UI page needs it. |
| `olsconfigs.ols.openshift.io` (from openshift/lightspeed-operator) | Allowed, inert | Core shows the YAML editor's "Ask OpenShift Lightspeed" button only to users who can GET `OLSConfig/cluster` (`useOLSConfig.ts`). With no operator installed, nothing acts on the object; OLS reads its own ConfigMap. Ship the CRD and one inert `cluster` instance (`royal-road/deploy/lightspeed/90-olsconfig.yaml`). |
| `route.openshift.io` | **Not allowed** | A Route does nothing without the OpenShift router; the UI would offer objects that route no traffic. |
| `config.openshift.io`, `operator.openshift.io`, `ClusterVersion`/`ClusterOperator` and similar | **Not allowed** | They describe OpenShift cluster state that only OpenShift's operators maintain. |
| `project.openshift.io`, `user.openshift.io`, `oauth.openshift.io` | Not possible | Aggregated APIs served by the OpenShift API server, not CRDs. |

Any CRD not in this table: apply the same test, and record the verdict here.

## Known problems with the stock console (4.22 in production, unchanged in 5.0) on this cluster

1. **The Networking menu is missing.** Upstream commit `fb71eefe0a` (2024-03-15) moved Services, Routes, Ingresses and NetworkPolicies into [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin). Core still declares the empty `networking` nav section, and empty sections are hidden.
2. **Storage management pages are gone.** The old `ceph-storage-plugin` was removed from core in 2023. Its replacement, `odf-console`, targets ODF's `StorageSystem`/`StorageCluster` CRDs, which this cluster does not have. Decision: **do not port or fork it.** Use the Ceph dashboard for Ceph management and link to it from the console (WP7). Core already covers StorageClasses, PVCs and VolumeSnapshots, and the generic CRD pages cover `CephBlockPool`, `CephFilesystem` and `CephObjectStore`.
3. **Helm release listing is slow across all namespaces.** `pkg/helm/actions/list_releases.go` runs Helm v4's `action.List` (`helm.sh/helm/v4`) with `StateMask = action.ListAll`. With no namespace set, Helm's Secrets driver lists every `owner=helm` Secret cluster-wide and fully decodes each one (base64, gzip, JSON including manifests and chart files). Only then does it throw away everything except the latest revision. `limitInfo=true` trims the response only after all that work.
4. **Helm UI errors** are likely caused by the missing `ProjectHelmChartRepository` CRD. The backend tolerates it (`pkg/helm/chartproxy/repos.go`, `helmRepoGetter.List`, logs the error and continues), but frontend watchers may not. This is unverified; see WP5.
5. **The Observe menu has no pages in core.** No `console-extensions.json` in core adds items to the `observe` section. Alerting, metrics, dashboards and targets live in [openshift/monitoring-plugin](https://github.com/openshift/monitoring-plugin) (WP4).
6. **Some OpenShift-only gating** blocks features that work on Kubernetes. Two fixes are already known (WP2). The old fork has more candidates (WP6).

## Verification environment

The production cluster is not available. Build a local stand-in:

- Create a [kind](https://kind.sigs.k8s.io/) cluster.
- Install the OpenShift CRDs that production has (`helmchartrepositories.helm.openshift.io`), plus the ones from `royal-road/deploy/crds/` once a work package adds them. Do not install any other OpenShift CRD; production won't have it.
- Install the Rook CRDs (CRDs only, no operator) so storage-related flags behave as in production.
- Install a few Helm releases with several upgrades each, so `superseded` revisions exist.
- Run the bridge off-cluster against kind, following `README.md` ("Native Kubernetes"/off-cluster sections), with `BRIDGE_USER_AUTH=disabled` and a cluster-admin ServiceAccount token. Run plugins with their dev servers or containers, and add them with `--plugins name=http://host:port/`.
- Optional, for Observe testing: add a Prometheus-compatible endpoint to kind and point `--k8s-mode-off-cluster-thanos` and `--k8s-mode-off-cluster-alertmanager` at it.

Every work package's acceptance criteria are checked in this environment. Record what you verified, and how, in the PR description or commit body.

## Work packages

Do them in order. Each one ends with green CI and a short entry in `royal-road/CHANGELOG.md`.

### WP0: CI and image publishing

- Add `.github/workflows/royal-road-image.yml`. On pushes to `main` and on PRs, build the image from `royal-road/Dockerfile` (WP1). On `main`, push to `ghcr.io/royal-road/console` tagged with the short SHA and `main`.
- Actions are enabled on this repository. Pushing files under `.github/workflows/` needs a GitHub token with the `workflow` scope, or SSH; an OAuth token without that scope gets the push rejected. If workflows still do not run, report it to the owner; don't work around it.
- **Acceptance:** a PR shows the image build job running.

### WP1: Buildable Dockerfile with public base images

Upstream's `Dockerfile` pulls from `registry.ci.openshift.org/ocp/...`, OpenShift's internal CI registry, which needs credentials. Create `royal-road/Dockerfile` (build context = repository root), keeping the stages of upstream's `Dockerfile`:

- **Go stage:** `golang:1.26` (upstream's 5.0 builder is `rhel-9-golang-1.26`; `go.mod` requires at least 1.25.7). Run `./build-backend.sh`.
- **Node stage:** `node:22` (`frontend/package.json` requires `node >=22`). Enable corepack (`corepack enable`) so Yarn comes from `packageManager` (`yarn@4.18.0`). Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (upstream sets it) and `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`.
  - Run `./build-frontend.sh` directly. `container-entrypoint` only exists in the OpenShift builder image.
  - Do not copy anything else from the OpenShift builder setup (Cachito, `REMOTE_SOURCES`).
  - The frontend build needs several GB of RAM. Set `NODE_OPTIONS=--max-old-space-size=...` if the runner runs out of memory.
- **Runtime stage:** `registry.access.redhat.com/ubi9/ubi-minimal` (public, no credentials).
  - Copy `bin/bridge` to `/opt/bridge/bin/bridge` and `frontend/public/dist` to `/opt/bridge/static`, as upstream's `Dockerfile` does.
  - Use `USER 1001` and the same `CMD` as upstream.
- Add a `.dockerignore` override if needed. Make sure `frontend/node_modules` and other local build output are excluded.
- **Acceptance:**
  - `docker build -f royal-road/Dockerfile .` succeeds on a clean GitHub runner.
  - The image starts.
  - Against kind it serves the console and `GET /health` returns 200.

### WP2: Known gating fixes

Both apply cleanly to `release-5.0`:

1. `frontend/packages/console-app/console-extensions.json`, the Dashboards nav item (`"href": "/dashboards"`): change `flags.required` from `["CAN_GET_NS", "OPENSHIFT", "PROMETHEUS", "MONITORING"]` to `["CAN_GET_NS", "PROMETHEUS", "MONITORING"]`.
2. `frontend/public/components/dashboard/dashboards-page/cluster-dashboard/details-card.tsx`: change `fetch('version')` to `fetch('/api/kubernetes/version')`. The relative URL breaks the Kubernetes version on the cluster dashboard.

- **Acceptance:** on kind, the Dashboards nav item is visible and the overview Details card shows the Kubernetes version.

A third 2026 fix (StatefulSets `insertAfter` pointing at `deploymentconfigs`) is already fixed upstream in 5.0 (`"insertAfter": ["deploymentconfigs", "deployments"]`). Do not port it.

### WP3: Networking via networking-console-plugin

- Build [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin) at the branch matching our console release (`release-5.0`, or the nearest one). Use a published image if one exists, otherwise build it in our CI as `ghcr.io/royal-road/networking-console-plugin`, with the same public-image approach as WP1.
- It has no backend; it talks to the API through the console's proxy. Load it with the bridge flag `--plugins networking-console-plugin=<url>/` (env `BRIDGE_PLUGINS`). **No `ConsolePlugin` CRD is needed** with bridge-level configuration.
- **Routes:** `route.openshift.io` is absent and will stay absent (see [OpenShift CRD policy](#openshift-crd-policy)). Check whether the plugin hides Routes when the model is missing. If it shows errors or a broken page, fix it with the smallest change: a flag-gating patch to the plugin (keep it in our build, and offer it upstream).
- The plugin's chart serves TLS using OpenShift's service CA, which this cluster doesn't have. For our deployment, serve plain HTTP inside the cluster or use a cert-manager certificate. Document which one.
- Add `royal-road/deploy/networking-console-plugin.yaml` (Deployment and Service, with placeholders) and the bridge env change.
- **Acceptance:** on kind, the Networking section shows Services, Ingresses and NetworkPolicies, with working list, detail and create pages, and no Route errors.

### WP4: Observe menu and configurable monitoring endpoints

**Part A: configurable monitoring hosts (core patch).**

In `in-cluster` mode the bridge sets up its monitoring proxies in `cmd/bridge/main.go`, inside the `if *fServiceCAFile != ""` block. Four of them use constants directly: `openshiftThanosHost`, `openshiftThanosTenancyHost`, `openshiftThanosTenancyForRulesHost` and `openshiftAlertManagerHost`. Two are already configurable: `--alermanager-user-workload-host` and `--alermanager-tenancy-host`. The misspelling "alermanager" is upstream's; keep those flags as they are and don't add duplicates.

- Add four flags whose defaults are those constants:
  - `--thanos-host`
  - `--thanos-tenancy-host`
  - `--thanos-tenancy-for-rules-host`
  - `--alertmanager-host`
- Use them where the constants are used now. Keep the value format (`host:port`), the `https` scheme and the `/api` path the same.
- Every bridge flag can also be set through an environment variable (`serverconfig.Parse` → `SetFlagsFromEnv`, prefix `BRIDGE`), for example `BRIDGE_THANOS_HOST`. No extra env handling is needed.
- These proxies only exist when `--service-ca-file` is set, and they trust that CA. Production sets it. Say so in the flag help text.
- Off-cluster mode keeps its existing `--k8s-mode-off-cluster-thanos` and `--k8s-mode-off-cluster-alertmanager` flags unchanged.
- **Acceptance:**
  - `bridge --help` shows the new flags with defaults equal to the old constants.
  - With none of the new flags set, the proxy endpoints are unchanged. Cover this with a unit test if the proxy setup can be extracted into a testable helper without a cluster; otherwise check it by running the bridge in kind.
  - On kind, running the bridge in-cluster with the new env vars pointing at a Prometheus-compatible Service sends metrics and alert requests to that Service.
  - `royal-road/deploy/README.md` documents the env vars. Once deployed, the owner can point the bridge at the VictoriaMetrics proxies directly and retire the stand-in `thanos-querier` / `alertmanager-main` Services. The defaults keep production working until then.
- This change is generic; offer it upstream.

**Part B: Observe pages.**

- Core has no Observe pages, so deploy [openshift/monitoring-plugin](https://github.com/openshift/monitoring-plugin) (branch matching `release-5.0`, or the nearest one) the same way as WP3. Find out whether its current version needs its own backend and which endpoints it expects. If it hard-codes Thanos or Alertmanager hosts, make them configurable the same way, with unchanged defaults.
- Check the result against what users need: alerts, silences, metrics query, dashboards, targets.
- **Acceptance:** on kind, alert list, metrics query and dashboards work through the bridge proxy, and a non-admin user's queries go through the tenancy port (9092).

### WP5: Helm

1. **Faster release listing.**
   - Change `pkg/helm/actions/list_releases.go` so that listing never decodes `superseded` revisions. For example, list Secrets with label selector `owner=helm,status!=superseded` (in the requested namespace, or all namespaces) and decode only those. Then apply the same latest-revision-per-release filtering that Helm v4's `action.List` applies.
   - Prefer Helm v4's public APIs where they work. If its Secrets driver `Query` only supports exact label matches, querying once per non-superseded status is an acceptable alternative.
   - Keep the HTTP API (`/api/helm/releases?ns=&limitInfo=`) and its JSON shape unchanged.
   - Add Go tests next to the existing ones (`pkg/helm/actions/*_test.go` uses fakes). They must show that superseded revisions are not decoded and that the output matches the old behavior for the latest revisions.
2. **Missing `ProjectHelmChartRepository` CRD.**
   - On kind without that CRD, open Helm pages (Helm releases, the Helm chart catalog, chart install) and record any errors.
   - Add the CRD to `royal-road/deploy/crds/` (allowed by the [OpenShift CRD policy](#openshift-crd-policy)) and repeat. If errors remain with the CRD installed, fix them with the smallest gating patch.
3. **Leave topology alone.** `frontend/packages/helm-plugin/src/topology/helm-data-transformer.ts` needs full manifests, so it must keep fetching full releases.

- **Acceptance:**
  - Go tests pass.
  - On kind, with many superseded revisions, the all-namespaces Helm release list is measurably faster. Record before and after timings.
  - Helm pages show no errors with the CRDs from `royal-road/deploy/crds/` installed.

### WP6: Triage the old fork's fixes

`legacy/kubernetes-console-2022` contains these Royal Road commits. Upstream changed a lot since then, so **re-check each problem on kind against our current `main`, and port only what is still broken**, written fresh against 5.0 code. Do not cherry-pick.

| Commit(s) | Topic | Expected outcome |
|---|---|---|
| `6cbfb21160`, `5e36ded48c`, `fb21bddf97` | Dashboard access and features unlocked on k8s, model flags, `pkg/usersettings/handlers.go` | Re-check. User settings must not cause repeated API errors or retries. |
| `02b26619f3` | Routes in UI and user preferences | Routes are covered by WP3. Re-check user preferences. |
| `23c4f9df68`, `362ba91fc5`, `687ad09524` | Deployment rollout support | Probably superseded: 5.0 has rollout restart (`useDeploymentActions.ts`). Verify. |
| `0939889921`, `b662468636` | Kubernetes version detection and errors | Covered by WP2 item 2. Verify. |
| `9566b5fb9d` | GraphQL error handling | Not applicable: 5.0 removed the GraphQL backend (`pkg/graphql`). |
| `9ff9c51dd8`, `e8d84187c5`, `d759f45f53` | Per-pod metrics queries | Re-check with WP4's setup. |
| `4e9c0ff161` | Multus CNI requirement | Probably moved to networking-console-plugin (NADs are flag-gated). Verify. |
| `0bfb7bef23` | Developer perspective on Kubernetes | Re-check: perspective switcher, topology, +Add. |
| `2a8e9d9862` | Builds gated behind explicit support | Re-check that Builds and BuildConfigs stay hidden without the OpenShift build API. |
| `2ea1bb4244`, `4f75e40b26`, `b6399cad56`, `f96ce8f793` | Assorted fixes | Read each diff. Port only reproducible problems. |
| `ebfe63004c`, `fcd5b499ab`, `5c69920a68`, `e4211a13a3`, `51a42459ec`, `98307a5eb4`, `bf8890446a`, `9a0ed863da`, `48dbdab247`, `9eafde73ee`, `0cf3c83f21`, `4803f60ada` | `ceph-storage-plugin` and NooBaa | **Do not port.** Storage is handled by WP7. |
| `c04edd2a4a`, `6af927b929`, `7387041e05`, `cf0da03182`, readme and logo commits | CI, docs, branding | Do not port. |

- **Acceptance:** `royal-road/WP6-TRIAGE.md` lists every row with a verdict (still broken / fixed upstream / not applicable), the evidence, and the commit that fixes it if one was needed.

### WP7: Ceph dashboard link

- Add `consolelinks.console.openshift.io` to `royal-road/deploy/crds/` (allowed by the [OpenShift CRD policy](#openshift-crd-policy)). Add an example `ConsoleLink` to `royal-road/deploy/`, with `location: ApplicationMenu`, section "Storage", text "Ceph dashboard", and a placeholder URL.
- No code. The frontend shows ConsoleLinks once the CRD exists (`FLAGS.CONSOLE_LINK`).
- If a link in the **Storage sidebar section** turns out to be required (ConsoleLink locations are the application menu, help menu, user menu and namespace dashboard), create `royal-road/plugin/` from [openshift/console-plugin-template](https://github.com/openshift/console-plugin-template) as `royal-road-console-plugin`, with a `console.navigation/href` extension in the `storage` section. The URL comes from deploy-time configuration. That plugin then becomes the home for our future UI additions.
- **Acceptance:** on kind with the CRD and the example ConsoleLink applied, the link appears in the application menu and opens the configured URL.

### WP8: Deployment hand-off

- `royal-road/deploy/` holds example manifests with placeholders:
  - console Deployment env changes (`BRIDGE_PLUGINS`, `BRIDGE_PLUGINS_ORDER` if needed)
  - plugin Deployments and Services
  - the CRDs in `royal-road/deploy/crds/`, and the resources that use them (`ConsoleLink`)
  - a `README.md` with the cutover order:
    1. Deploy the plugins.
    2. Switch the existing 4.22 console Deployment to `ghcr.io/royal-road/console:<sha>` (5.0-based) with the new env.
    3. Verify.
    4. Keep the old 2021 console Deployment running until parity is confirmed, then retire it.
- The owner applies these through the infrastructure repository. Agents do not apply them.

### Backlog (not part of the initial fork)

- Gateway API pages (Gateways, HTTPRoutes with `status.parents` conditions, links from Services to the routes that target them) in `royal-road-console-plugin` (create it as described in WP7 if it doesn't exist yet), once the cluster adopts Gateway API.
- Offer generic fixes (WP2, WP4 part A, WP5) upstream as PRs to `openshift/console`. Each one accepted is one less patch to carry.

## Rebasing onto a new upstream release

1. `git fetch upstream`.
2. `git rebase --onto upstream/<new-release> <old-base> main`, where `<old-base>` is the upstream commit `main` currently sits on (`git merge-base main upstream/release-5.0`). To pick up fixes within 5.0, use `upstream/release-5.0` itself as `<new-release>`.
3. Drop commits that upstream made unnecessary, and resolve conflicts in favor of upstream's new structure.
4. Update the base version in this file, `royal-road/Dockerfile` (Go and Node versions) and the plugin branches (WP3, WP4).
5. Run the kind verification for every work package. Push with `--force-with-lease` only after CI passes on a branch.

## Status

| WP | State |
|---|---|
| WP0 | Done: `royal-road-image` workflow (PR #1) |
| WP1 | Done: `royal-road/Dockerfile` (PR #1) |
| WP2 | Done (PR #3) |
| WP3 | Done: plugin built from pinned upstream + 2 patches (PR #5) |
| WP4 | Done: part A host flags (PR #2), part B monitoring-plugin (PR #9). In-cluster tenancy (9092/9093) to be confirmed on production |
| WP5 | Done: listing skips superseded revisions (PR #8), CRD + all-namespaces fix (PR #6) |
| WP6 | Done: `royal-road/WP6-TRIAGE.md`, 3 fixes (PR #7) |
| WP7 | Done: ConsoleLink in the application menu, no sidebar plugin (PR #6) |
| WP8 | Done: cutover steps in `royal-road/deploy/README.md` |

Update this table as work packages land.
