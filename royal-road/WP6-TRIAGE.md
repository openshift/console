# WP6: Triage of the 2021–2022 fork's fixes

Every Royal Road commit on `legacy/kubernetes-console-2022` (`git log --no-merges --author=...`), checked against our `main` (upstream `release-5.0` + WP0/WP1).
Each problem was re-checked in code and, where it shows in the UI, in a running console.

**Verdicts:**

- **still broken**: reproduced on 5.0 and fixed on this branch.
- **fixed upstream**: 5.0 no longer has the problem.
- **covered by WPn**: another work package fixes it.
- **not applicable**: the code or feature no longer exists, or our cluster doesn't have it.
- **do not port**: FORK.md excludes it.

## Fixes on this branch

| Commit | Kind | What |
|---|---|---|
| `Add user-settings namespace and RBAC for plain Kubernetes` | deploy | `royal-road/deploy/user-settings.yaml` |
| `Add the console's OpenShift-only recording rules for VictoriaMetrics` | deploy | `royal-road/deploy/monitoring/console-recording-rules.yaml`, with a promtool unit test |
| `Set CAN_CREATE_PROJECT to false when the project API is missing` | core patch | `frontend/public/actions/features.ts`, with a Jest test |

## Rows from FORK.md

| Commit(s) | Topic | Verdict | Evidence | Fix |
|---|---|---|---|---|
| `6cbfb21160`, `5e36ded48c`, `fb21bddf97` | Dashboard access, k8s features, model flags, `pkg/usersettings/handlers.go` | **still broken** (user settings); the rest is covered by WP2 or fixed upstream | See [User settings](#user-settings) and [Details per row](#details-per-row). | `user-settings.yaml` |
| `02b26619f3` | Routes in UI; user preferences | Routes: **covered by WP3**. User preferences: **still broken**, as in the row above. | Routes left core in 2024; the WP3 plugin patch `0001-hide-routes-without-route-api.patch` hides them when `route.openshift.io` is absent. The 2021 change (build the user-settings meta from the token, without a `users/~` lookup) is obsolete: 5.0 uses SelfSubjectReview and SHA-256(username), and needs no UID. The remaining failure is the missing namespace. | `user-settings.yaml` |
| `23c4f9df68`, `362ba91fc5`, `687ad09524` (+ `4f75e40b26`, `b6399cad56`, `5be8758d48`) | Deployment rollout | **fixed upstream** | 5.0 `useDeploymentActions.ts` has `RestartRollout` (verb `patch`, disabled while paused). In the UI, Actions → Restart rollout on `demo/web` set `spec.template.metadata.annotations["openshift.openshift.io/restartedAt"]` and bumped `generation` 1→2, with no errors. | — |
| `0939889921`, `b662468636` | Kubernetes version and its error | **covered by WP2** (item 2) | WP2 (`d7701a694f`) changes `fetch('version')` to `fetch('/api/kubernetes/version')`. The rest of the old fix is already in 5.0: `.json()` on the response (old `cd10f01adb`) and an error state, which renders as "Not available" (old `b662468636`). The old fork also removed the wait on the `OPENSHIFT` flag (`5e36ded48c`). That isn't needed: on Kubernetes the flag resolves to `false` (404 on `config.openshift.io/v1`, one request per load). | — |
| `9566b5fb9d` | "GraphQL" error handling (`err.status` vs `err.response.status` in `features.ts`) | **not applicable** | 5.0 removed the GraphQL proxy (CONSOLE-5426). Detection uses `coFetchJSON`, whose errors carry `response.status`. In the UI, each OpenShift-only probe (`config.openshift.io/v1`, `clusterversions/version`, `projectrequests`) ran once per page load with no retry loop. | — |
| `9ff9c51dd8`, `e8d84187c5`, `d759f45f53` | Per-pod metrics queries | **still broken**, and **not covered by WP4** | `9ff9c51dd8` is a ceph-storage-plugin query (do not port). The pod graph problem has changed shape. 5.0 no longer joins `pod_network_name_info` in `pod.tsx`; it queries OpenShift recording rules instead. Eight rules that core queries exist only in cluster-monitoring-operator (CMO): `pod:container_cpu_usage:sum`, `pod:container_fs_usage_bytes:sum`, `namespace:container_cpu_usage:sum`, `pod_interface_network:container_network_{receive_bytes,transmit_bytes_total}:irate5m`, and `instance:node_{cpu,network_receive_bytes,network_transmit_bytes}:rate:sum`. Without them, the pod, pod-list, project, cluster and node utilization graphs show "No datapoints found". WP4 makes the endpoints configurable and deploys monitoring-plugin; it does not define these rules. The other five recording rules core uses are kube-prometheus mixin rules that victoria-metrics-k8s-stack's default rules include. | `console-recording-rules.yaml` |
| `4e9c0ff161` | Multus CNI requirement (`pod_network_name_info` join) | **still broken**, now in the recording rule rather than `pod.tsx` | CMO's `pod_interface_network:*` rules keep the `+ on(...) group_left(network_name) ... pod_network_name_info` join. That metric comes from OpenShift's network-metrics-daemon, which Calico doesn't run, so the join drops every series. promtool shows it: with the upstream expression, the test returns `got: nil`. NetworkAttachmentDefinitions are a networking-plugin concern (WP3) and are not part of this commit. | Join dropped in `console-recording-rules.yaml` |
| `0bfb7bef23` | Developer perspective on Kubernetes (catalog/samples flags) | **fixed upstream** | No item in `dev-console/console-extensions.json` requires `OPENSHIFT`. In the UI: the perspective switcher lists Core platform and Developer; `/topology/ns/demo` draws the `web` Deployment; `/add/ns/demo` shows Import YAML, Helm Chart repositories, Software Catalog, Samples and Container images. OpenShift-only entries (Import from Git, BuildConfig) are gated by model flags. | — |
| `2a8e9d9862` | Builds gated behind build API support | **fixed upstream** | The `builds` nav section requires `OPENSHIFT` (`console-app/console-extensions.json`). The Builds section is absent from the nav, and +Add offers no Git/BuildConfig import (`FLAG_OPENSHIFT_BUILDCONFIG`). Typing `/k8s/ns/demo/buildconfigs` directly gives an empty "No BuildConfigs found" list. That is cosmetic and not worth a patch. | — |
| `2ea1bb4244` | Namespace list crashes on namespaces without annotations | **fixed upstream** | `namespace.jsx` reads `metadata?.annotations?.['openshift.io/requester']`. The Namespaces list renders "No requester" for all 10 namespaces. | — |
| `4f75e40b26`, `b6399cad56` | Rollout follow-ups | **fixed upstream** | See the rollout row above. | — |
| `f96ce8f793` | Assorted: OCS storage-class form, local-storage-operator `CephCluster`, unused import | **do not port** / **not applicable** | ceph-storage-plugin and local-storage-operator-plugin were removed from core. The `details.tsx` hunk only drops an unused import. | — |
| `ebfe63004c`, `fcd5b499ab`, `5c69920a68`, `e4211a13a3`, `51a42459ec`, `98307a5eb4`, `bf8890446a`, `9a0ed863da`, `48dbdab247`, `9eafde73ee`, `0cf3c83f21`, `4803f60ada` | ceph-storage-plugin and NooBaa | **do not port** | FORK.md: storage is handled by WP7 (Ceph dashboard link). | — |
| `c04edd2a4a`, `6af927b929`, `7387041e05`, `cf0da03182`, readme and logo commits (`2480392c8b`, `2645fe2207`, `d888aaa387`, `e53fd9b444`, `97a03e7cd0`) | CI, docs, branding | **do not port** | WP0/WP1 replace the CI. Production runs `BRIDGE_BRANDING=okd`. | — |

## Commits not listed in FORK.md

| Commit | Topic | Verdict | Evidence | Fix |
|---|---|---|---|---|
| `3984826ba5` | OperatorHub install namespace; `list-dropdown` stuck waiting on `CAN_CREATE_PROJECT` | **still broken** (the dropdown half) | `useProjectOrNamespaceModel()` returns `[]` while `OPENSHIFT`, `CAN_CREATE_NS` or `CAN_CREATE_PROJECT` is pending. `detectCanCreateProject` never set the flag on 404, so on Kubernetes it stayed pending forever. Result: User Preferences → General → "Project" was a permanent loading skeleton, and every `NsDropdown` (`NSDropdownField`, used by Project access, and the OperatorHub forms) never rendered. Fixed at the root: 404 sets the flag to `false`. After the fix, the dropdown shows "Last viewed" and has no console errors. The Jest test fails without the fix. The OperatorHub install-mode half applies only with OLM, which our target cluster does not run. | `features.ts` |
| `8896f1cfeb` | "Make more of the UI available": Project→Namespace in +Add/Topology, DC option hidden, `cluster=""` in dev-console queries, nav flags, `kubeadmin` user-settings name, catalog icons | **fixed upstream** / **not applicable** | +Add and Topology render on Kubernetes (see `0bfb7bef23`). The DeploymentConfig option requires `FLAG_OPENSHIFT_DEPLOYMENTCONFIG`. The dev-console queries no longer contain `cluster=""`. The Topology, Observe and Project nav items aren't gated by `OPENSHIFT` in the dev perspective. User settings no longer need a UID. Catalog icons for our own Templates are not used: Helm charts carry their own icons. | — |
| `50e1c9e954`, `6a84fdcdc1` | More catalog icons | **not applicable** | Same as the icon part of `8896f1cfeb`. | — |
| `66212a10fb` | Project→Namespace in many components | **fixed upstream** for every reachable path | Namespace details on Kubernetes use the Namespace page (Details/YAML/RoleBindings), not the project dashboard, so its `ProjectModel` link is never reached. The cluster and node utilization cards no longer use `ProjectModel`. The cloud shell (webterminal-plugin) and Import from Git need operators or APIs we don't run. One latent case: `resource-log.tsx` fetches `ProjectModel` when the `ConsoleExternalLogLink` CRD is installed, so the pod log page would show an error. Our CRD policy allows that CRD, but no WP installs it. Port a fix if it is ever added. | — |
| `a29c2d0dac` | Namespace selector | **fixed upstream** | The namespace bar works ("Namespace: demo", switching namespaces) on every page probed. | — |
| `03b408b885` | Routes page crash on a route without status | **covered by WP3** | Routes moved to networking-console-plugin and are hidden without `route.openshift.io`. | — |
| `cd10f01adb` | Routes flag, version `.json()`, Projects page creates Namespaces, `horizontal-nav` trailing slash | **fixed upstream** / **covered by WP2/WP3** | The version parts are covered by WP2 (see `0939889921`). Routes: WP3. The Projects nav item requires `OPENSHIFT`; Kubernetes uses Administration → Namespaces, which has "Create Namespace". The `horizontal-nav` path join was rewritten for React Router 6; detail-page tabs (Details/YAML/…) render. | — |
| `d0cd20da85` | "Kubernetes" branding option | **do not port** | Branding. Production uses `okd`. | — |
| `852b493b75`, `df2394b92d` | ceph-storage-plugin / NooBaa build fixes | **do not port** | Storage plugins. | — |
| `e66bf8517a` | Remove generated plugin schema files | **not applicable** | Build housekeeping for the 2021 tree. | — |
| `5be8758d48` | Unused imports in the rollout code | **not applicable** | Follows the rollout row. | — |

## User settings

The bridge stores each user's preferences in a ConfigMap in the hard-coded namespace `openshift-console-user-settings`.
OpenShift's console-operator creates that namespace and a Role for the console ServiceAccount; a plain cluster has neither.

On a stock 5.0 console without the namespace, two page loads (`/dashboards`, then a Deployments list) made **62** `POST /api/console/user-settings` calls.
Each one returned 404 and logged `Failed to create user settings: namespaces "openshift-console-user-settings" not found` in the bridge, and each also ran a cluster-wide ConfigMap list to look for old settings to migrate.
Every `useUserPreference` hook instance tries once, then falls back to localStorage.
The UI works, but the API and the logs get noisy, and preferences don't follow the user between browsers.

With `royal-road/deploy/user-settings.yaml` applied, the bridge ran with a least-privilege ServiceAccount as its internal client, bound only to that Role.
The first visit created the user's ConfigMap, Role and RoleBinding.
After that, a repeat visit makes **one** GET of the ConfigMap and no POSTs, and the bridge logs no user-settings errors.

There is also a config-only alternative, `BRIDGE_USER_SETTINGS_LOCATION=localstorage`, which upstream labels "DEV ONLY".

## Details per row

- **`6cbfb21160` / `fb21bddf97` Dashboards nav without `OPENSHIFT`:** covered by WP2 item 1.
- **`5e36ded48c` `SHOW_OPENSHIFT_START_GUIDE` via `projects`:** fixed upstream. 5.0 no longer probes `project.openshift.io/v1/projects` at startup; the probed URLs are listed under `9566b5fb9d`.
- **`5e36ded48c` / `fb21bddf97` Projects nav:** still requires `OPENSHIFT`. That is correct on Kubernetes, where Namespaces (Administration) is the equivalent and has a create button.
- **`fb21bddf97` topology side-bar Observe tab:** fixed upstream. It now requires only `MONITORING`.
- **`fb21bddf97` `ClusterOperator`/`ClusterVersion`/`Infrastructure`/`OAuth`/`Network` API group renamed to `config.kubernetes.io`:** a hack to stop requests to `config.openshift.io`, and not applicable. 5.0 makes one request each to `config.openshift.io/v1`, `clusterversions/version` and `infrastructures/cluster` per page load (404, not retried), and the pages that use them are flag-gated.
- **`fb21bddf97` `pkg/usersettings/handlers.go`:** this commit reverted `02b26619f3`'s token-only meta. 5.0 rewrote the code (SelfSubjectReview, SHA-256 of the username), so the code change is obsolete. What remains is the missing namespace (above).

## Other observations

- **User-settings 502 with an x509 error in off-cluster mode** (reported by the WP5.2/WP7 agent): this is a dev-harness problem only, and we don't port a fix. The handler's client comes from `rest.TransportFor(rest.AnonymousClientConfig(InternalProxiedK8SClientConfig))` (`cmd/bridge/main.go`). `AnonymousClientConfig` copies `TLSClientConfig.{Insecure,CAFile,CAData}` but not a custom `Transport`. Off-cluster mode puts `--k8s-mode-off-cluster-skip-verify-tls` in a custom `Transport`, so the anonymous client verifies against the system roots and fails. The same client backs `AuthMetrics`. In-cluster mode, which production uses, sets `TLSClientConfig.CAFile` to the ServiceAccount CA, and that field survives the copy. Fixing it upstream means restructuring the off-cluster config (client-go rejects a custom `Transport` combined with TLS options), so that isn't worth a fork patch. Harness workaround: start the bridge with `SSL_CERT_FILE=<API server CA>` (for kind: the CA from the kubeconfig), as done for this triage.
- **OpenShift-only API probes per page load:** `config.openshift.io/v1`, `clusterversions/version`, `project.openshift.io/v1/projectrequests`, `infrastructures/cluster` (2–3 times, from different dashboard cards), `metal3.io/.../provisioning-configuration`, `image.openshift.io/.../imagestreams/java`. Each returns 404 once per load and sets its flag or hook to "absent". None is retried (each of `detectOpenShift`, `detectClusterVersion` and `detectCanCreateProject` treats 404 as final), and none shows an error in the UI. Gating them would mean patching many call sites to save a handful of cheap 404s, so we don't.
- **`GET /api/olm/check-package-manifests/` returns 500 once per app load.** This is `usePackageManifestCheck('lightspeed-operator', 'openshift-marketplace')` in `app.tsx`. Its only effect is setting `LIGHTSPEED_IS_AVAILABLE_TO_INSTALL=false`, which is correct without OLM. It isn't retried and isn't shown, so we don't fix it.
- **`helm.openshift.io/.../projecthelmchartrepositories` returns 404** without that CRD: WP5 item 2.

## How this was checked

- Code: each legacy diff (`git show <sha>`) was compared with the same code on `main`.
- Runtime: the bridge from this branch ran off-cluster (`royal-road/dev/run-bridge.sh`) against a cluster set up like `kind-up.sh`: the `helmchartrepositories` CRD, Rook CRDs, Helm releases with superseded revisions, and a `demo/web` Deployment. Every page check used the stock `main` frontend (`/tmp/console-static`), except the `CAN_CREATE_PROJECT` fix, which used this branch's frontend build. A headless Chromium (Playwright) recorded failing requests, console errors and page text.
- Deviation: on the build host, `kind create cluster` failed with `unable to create session key: disk quota exceeded`, because the kernel keyring quota was used up by other kind clusters. The stand-in therefore ran `etcd` + `kube-apiserver` + `kube-controller-manager` v1.34.0 as plain processes, with no kubelet. Pods never start, so pod logs and live metrics were not exercised. The recording rules were verified with `promtool test rules` instead.
- Tests: `royal-road/deploy/monitoring/test-recording-rules.sh` passes; `yarn jest public/actions/__tests__/features.spec.ts` passes (3 tests) and fails without the fix.
