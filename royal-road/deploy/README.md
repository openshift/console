# Deploying the Royal Road console

Example manifests and instructions for the owner to apply through the
infrastructure repository. Agents do not apply anything from this directory
to the production cluster. Values such as URLs and hostnames are placeholders.

## Cutover from the stock console

The first rollout replaces `quay.io/openshift/origin-console:4.22` with this
fork (based on `release-5.0`), so it is also a 4.22 → 5.0 upgrade. Every
bridge flag the stock Deployment sets still exists in 5.0, and the monitoring
proxy defaults are unchanged, so the existing env carries over as is.

1. **Back up** the live console Deployment, Service and Ingress.
2. **Deploy the plugins** in the console namespace:
   [`networking-console-plugin.yaml`](networking-console-plugin.yaml) and
   [`monitoring-plugin.yaml`](monitoring-plugin.yaml), and for logs
   [`logging-view-plugin.yaml`](logging-view-plugin.yaml) (see
   [Logging plugin](#logging-plugin)). Wait for the Deployments to be ready.
   Nothing loads them yet.
3. **Apply the CRDs and the resources that use them** (see [CRDs](#crds)),
   then [`monitoring/console-recording-rules.yaml`](monitoring/console-recording-rules.yaml)
   (see [Recording rules](#recording-rules)). Apply
   [`console-branding-configmap.yaml`](console-branding-configmap.yaml) in
   the console namespace (see [Branding](#branding)). Apply
   [`user-settings.yaml`](user-settings.yaml) only if the
   `openshift-console-user-settings` namespace and the console's write access
   to it don't exist yet (see [User settings](#user-settings)).
4. **Switch the console Deployment** to `ghcr.io/royal-road/console:<sha>`
   with [`console-deployment-patch.yaml`](console-deployment-patch.yaml). It
   changes the image, adds `BRIDGE_PLUGINS`, the Kubernetes branding and a
   `/health` readiness probe, and keeps every other setting.
5. **Verify**: sign in through OIDC; check the Networking menu (Services,
   Ingresses, NetworkPolicies, no Routes), Observe (alerts, metrics,
   dashboards, targets), Home › Overview with the Kubernetes version, the Helm
   releases list across all namespaces, and the application menu's Ceph
   dashboard link, the Kubernetes logo and tab title, and Administration ›
   Dynamic Plugins. Check the bridge log for repeated errors.
6. **Keep the old 2021 console Deployment running** until parity is
   confirmed, then retire it.

**Rollback:** set the image back to `quay.io/openshift/origin-console:4.22`
and remove `BRIDGE_PLUGINS` (or restore the backup). The plugins, CRDs and
recording rules are inert for the stock console and can stay.

## CRDs

`crds/` holds OpenShift CRDs that only the console reads (see
[`crds/README.md`](crds/README.md) for the source and pin). Apply them before
any resource that uses them. A CRD must be `Established` before its resources
can be created.

1. CRDs:

   ```sh
   kubectl apply -f royal-road/deploy/crds/
   kubectl wait --for=condition=Established \
     crd/projecthelmchartrepositories.helm.openshift.io \
     crd/consolelinks.console.openshift.io \
     crd/consoleplugins.console.openshift.io \
     crd/olsconfigs.ols.openshift.io
   ```

2. Resources that use them, after replacing the placeholders:

   ```sh
   kubectl apply -f royal-road/deploy/console-extensions-reader.yaml
   kubectl apply -f royal-road/deploy/ceph-dashboard-consolelink.yaml
   kubectl apply -f royal-road/deploy/consoleplugins.yaml
   ```

No console restart is needed. The frontend detects the new APIs on the next
page load: `FLAGS.CONSOLE_LINK` turns on and the application menu (grid icon
in the masthead) shows a **Storage › Ceph dashboard** entry. The Helm pages
stop requesting the missing `projecthelmchartrepositories` API, and the
bridge stops logging `Error listing namespace helm chart repositories`.

The frontend reads ConsoleLinks and ConsolePlugins with each user's own
token, and installing a CRD grants nobody read access.
`console-extensions-reader.yaml` binds a read-only `console-extensions-reader`
ClusterRole to `system:authenticated`, which matches what the console-operator
does on OpenShift. Without it only cluster-admins see the link. (Earlier
versions of `ceph-dashboard-consolelink.yaml` carried this ClusterRole with
`consolelinks` only; applying the new file updates it in place.)

Non-admin access to Helm chart repositories is separate and unchanged here:
reading `helmchartrepositories` and `projecthelmchartrepositories` still
needs RBAC like any other resource.

### Storage sidebar link: not needed

The Ceph dashboard link lives in the application menu. FORK.md (WP7) allows a
`royal-road-console-plugin` for a link in the **Storage** sidebar section only
if one is required. It is not: the application menu link covers the need,
core already lists StorageClasses, PVCs and VolumeSnapshots in the sidebar,
and the generic CRD pages cover `CephBlockPool`, `CephFilesystem` and
`CephObjectStore`.

## Lightspeed

The AI assistant (chat panel and YAML editor button), backed by GPUStack, is
a separate stack in the `openshift-lightspeed` namespace. It is optional and
independent of the cutover above. See [`lightspeed/README.md`](lightspeed/README.md)
for the manifests, apply order, the `BRIDGE_PLUGINS` and
`BRIDGE_PLUGIN_PROXY` values, and rollback.

## Branding

The masthead, the About modal, the browser tab title and the favicon show
Kubernetes instead of OKD. This is bridge configuration only; no code change.

1. Apply [`console-branding-configmap.yaml`](console-branding-configmap.yaml)
   in the console namespace. It holds the Kubernetes logos from
   [cncf/artwork](https://github.com/cncf/artwork) (source commit and the one
   change made to them are in the file header).
2. Patch the console Deployment with
   [`console-deployment-patch.yaml`](console-deployment-patch.yaml), or add
   this to the console container yourself:

   ```yaml
   env:
     - name: BRIDGE_CUSTOM_PRODUCT_NAME
       value: Kubernetes
     - name: BRIDGE_CUSTOM_LOGO_FILES
       value: Light=/var/logo/console-branding/kubernetes-horizontal-color.svg,Dark=/var/logo/console-branding/kubernetes-horizontal-white-text.svg
     - name: BRIDGE_CUSTOM_FAVICON_FILES
       value: Light=/var/logo/console-branding/kubernetes-icon-color.svg,Dark=/var/logo/console-branding/kubernetes-icon-color.svg
   volumeMounts:
     - name: console-branding
       mountPath: /var/logo/console-branding
       readOnly: true
   # and on the Pod:
   volumes:
     - name: console-branding
       configMap:
         name: console-branding
   ```

Keep `BRIDGE_BRANDING=okd`. The bridge accepts only Red Hat product names
there, and `okd` is the one without Red Hat artwork (the About modal shows no
Red Hat logo or OpenShift description once a custom logo or product name is
set). The bridge checks at startup that each logo file exists, and serves the
files at `/custom-logo?type=Masthead|Favicon&theme=Light|Dark`.

| Setting | Where it shows |
|---|---|
| `BRIDGE_CUSTOM_PRODUCT_NAME` | Browser tab title (`Pods · Kubernetes`), the `application-name` meta tag, the About modal heading, the logo's alt text |
| `BRIDGE_CUSTOM_LOGO_FILES` | Masthead and About modal. `Light` and `Dark` follow the user's console theme |
| `BRIDGE_CUSTOM_FAVICON_FILES` | Browser tab icon. `Light` and `Dark` follow the browser's color scheme. The frontend swaps it in after it starts, so the OKD icon shows for a moment on a full page load |

**Why "Kubernetes".** The masthead logo already reads "kubernetes", so the
tab title and About modal match it, and the About modal reads as "Kubernetes,
Kubernetes version v1.x". It is short in tab titles, where the product name
follows the page name. "Kubernetes Console" would be more precise but repeats
what the tab already says and doesn't match the logo.

**Logo license.** The CNCF artwork is published under the Linux Foundation
[trademark usage guidelines](https://www.linuxfoundation.org/legal/trademark-usage).
Using the unaltered logo to identify the Kubernetes cluster the console manages
fits them. Don't use it in a way that suggests the Linux Foundation or CNCF
endorses the console.

**Seen on kind:** a one-time `400` for `/custom-logo?type=Masthead&theme=`
on each page load. The frontend asks once before it knows the theme, then
asks again with `theme=Light` or `theme=Dark` and gets the logo. Upstream
behavior, harmless.

## Dynamic Plugins page

Administration › Dynamic Plugins lists the loaded plugins with version,
description, load status, enabled state and CSP violations, and links each to
a details page with its manifest. The Overview's Status card shows the same
under **Dynamic Plugins**.

Upstream, the page is a tab on the console operator's config
(`consoles.operator.openshift.io/cluster`), and enable/disable writes
`spec.plugins` there. This cluster can't have that resource
([OpenShift CRD policy](../../FORK.md#openshift-crd-policy)), so the stock
console shows "Model does not exist". Our build changes that:

- Without `consoles.operator.openshift.io`, the nav item opens the
  ConsolePlugin list (`/k8s/cluster/console.openshift.io~v1~ConsolePlugin`)
  instead. It needs the ConsolePlugin CRD; without the CRD the nav item is
  hidden.
- The **Enabled** column says whether the bridge loads the plugin
  (`BRIDGE_PLUGINS`), and the enable/disable controls are gone: there is no
  config to edit. Change `BRIDGE_PLUGINS` to enable or disable a plugin.
- As upstream, the nav item shows for users who may `get`
  `consoles.operator.openshift.io`. Here that means cluster-admins (a `*`
  rule), since the resource doesn't exist.

To set it up, apply the CRD `crds/90_consoleplugins.crd.yaml`, then
[`console-extensions-reader.yaml`](console-extensions-reader.yaml) and
[`consoleplugins.yaml`](consoleplugins.yaml) (see [CRDs](#crds)). No console
restart is needed. `consoleplugins.yaml` has one ConsolePlugin per
`BRIDGE_PLUGINS` entry. Their names must match, and they don't load anything.
When you add a plugin to `BRIDGE_PLUGINS`, add a ConsolePlugin for it, or it
loads but isn't listed. A ConsolePlugin that `BRIDGE_PLUGINS` doesn't name is
listed as Disabled with no status.

**Create ConsolePlugin** stays on the page. A new ConsolePlugin is listed, but
the plugin only loads once it is in `BRIDGE_PLUGINS`.

## Kubernetes update hints

The Overview's Details card lists, under **Kubernetes version**, the latest
patch of the cluster's minor line, the latest Kubernetes release when its minor
is newer, and the end-of-life date of the cluster's minor line. The date gets a
warning icon in the 30 days before end of life and a danger icon after it.

`BRIDGE_KUBERNETES_RELEASE_INFO_URL` (`--kubernetes-release-info-url`) turns it
on; [`console-deployment-patch.yaml`](console-deployment-patch.yaml) sets it to
`https://endoflife.date/api/kubernetes.json`. The bridge fetches that URL at
start and then every 12 hours, keeps the last good copy when a fetch fails,
and serves a normalised copy to logged-in users at
`/api/console/kubernetes-releases`. The browser never calls endoflife.date.

- **Egress:** the console pod needs HTTPS to `endoflife.date`. If a
  NetworkPolicy restricts the console's egress, allow it; if egress goes
  through a proxy, set `HTTPS_PROXY` (and `NO_PROXY` for the API server and
  in-cluster services) on the console container. Failures are logged as
  `failed to fetch Kubernetes release info`; until a fetch succeeds the item
  shows "Not available". After fixing egress, restart the console pod to
  fetch straight away instead of waiting for the next 12-hour check.
- **Off:** remove the variable. The endpoint then returns 404 and the item is
  hidden, as in the stock console.

## Monitoring endpoints

In `in-cluster` mode the bridge proxies metrics and alert requests to Thanos and
Alertmanager services. These proxies only exist when `BRIDGE_SERVICE_CA_FILE`
(`--service-ca-file`) is set. Each target must serve HTTPS with a certificate
signed by that CA. The bridge appends `/api` to each host.

| Env var | Flag | Default | Bridge paths served |
|---|---|---|---|
| `BRIDGE_THANOS_HOST` | `--thanos-host` | `thanos-querier.openshift-monitoring.svc:9091` | `/api/prometheus/api/v1/{query,query_range,rules,targets,label/,labels,series,metadata}` |
| `BRIDGE_THANOS_TENANCY_HOST` | `--thanos-tenancy-host` | `thanos-querier.openshift-monitoring.svc:9092` | `/api/prometheus-tenancy/api/v1/{query,query_range,label/}` |
| `BRIDGE_THANOS_TENANCY_FOR_RULES_HOST` | `--thanos-tenancy-for-rules-host` | `thanos-querier.openshift-monitoring.svc:9093` | `/api/prometheus-tenancy/api/v1/rules` |
| `BRIDGE_ALERTMANAGER_HOST` | `--alertmanager-host` | `alertmanager-main.openshift-monitoring.svc:9094` | `/api/alertmanager/api/` |
| `BRIDGE_ALERMANAGER_USER_WORKLOAD_HOST` | `--alermanager-user-workload-host` (upstream spelling) | `alertmanager-main.openshift-monitoring.svc:9094` | `/api/alertmanager-user-workload/api/` |
| `BRIDGE_ALERMANAGER_TENANCY_HOST` | `--alermanager-tenancy-host` (upstream spelling) | `alertmanager-main.openshift-monitoring.svc:9092` | `/api/alertmanager-tenancy/api/` |

Values are `host:port` with no scheme. The defaults are the stock console's
hard-coded hosts, so the existing stand-in `thanos-querier` and
`alertmanager-main` Services keep working with no configuration.

To point the console straight at the VictoriaMetrics proxies, set the variables
on the console Deployment, then retire the stand-in Services:

```yaml
env:
  - name: BRIDGE_SERVICE_CA_FILE
    value: /var/service-ca/ca.crt          # CA that signed the proxies' certificates
  - name: BRIDGE_THANOS_HOST
    value: <global-query-proxy>.<namespace>.svc:<port>
  - name: BRIDGE_THANOS_TENANCY_HOST
    value: <tenancy-query-proxy>.<namespace>.svc:<port>    # prom-label-proxy, namespace tenancy
  - name: BRIDGE_THANOS_TENANCY_FOR_RULES_HOST
    value: <tenancy-rules-proxy>.<namespace>.svc:<port>
  - name: BRIDGE_ALERTMANAGER_HOST
    value: <vmalertmanager-proxy>.<namespace>.svc:<port>
  - name: BRIDGE_ALERMANAGER_USER_WORKLOAD_HOST
    value: <vmalertmanager-proxy>.<namespace>.svc:<port>
  - name: BRIDGE_ALERMANAGER_TENANCY_HOST
    value: <vmalertmanager-tenancy-proxy>.<namespace>.svc:<port>
```

Off-cluster mode is unaffected; it keeps using `--k8s-mode-off-cluster-thanos`
and `--k8s-mode-off-cluster-alertmanager`.

## Networking plugin

Brings back the Networking menu (Services, Ingresses, NetworkPolicies) with [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin). The build is described in `royal-road/plugins/networking-console-plugin/README.md`.

1. Apply `networking-console-plugin.yaml` after filling in:
   - `<console-namespace>`: the console's namespace
   - `<sha>`: an image tag pushed by `.github/workflows/royal-road-networking-plugin.yml` (`:main` follows `main`)
2. Add the plugin to the console Deployment's container env:

   ```yaml
   - name: BRIDGE_PLUGINS
     value: networking-console-plugin=http://networking-console-plugin.<console-namespace>.svc.cluster.local:8080/
   ```

   `BRIDGE_PLUGINS` is the env form of `--plugins`. It takes a comma-separated list of `name=url` pairs; other plugins are added to the same value. The trailing `/` is required. No `ConsolePlugin` resource or CRD is needed: the bridge reads plugins from this setting.
3. Roll out the console. Check that `https://<console-host>/api/plugins/networking-console-plugin/plugin-manifest.json` returns JSON, and that **Networking** appears in the sidebar.

**Plain HTTP, no TLS.** The upstream chart serves the plugin over TLS with a certificate from OpenShift's service CA, which this cluster doesn't have. The plugin is static, public UI code; only the bridge fetches it, over the cluster network, and the browser gets it from the bridge over the console's own HTTPS. So the Service serves plain HTTP on 8080. To use TLS later, mount a cert-manager certificate into nginx and switch the URL to `https://`. In `in-cluster` mode the bridge verifies plugin certificates against `BRIDGE_SERVICE_CA_FILE`, so the issuing CA must be in that file. There is no separate plugin CA flag.

**Routes.** `route.openshift.io` stays absent on this cluster (FORK.md, OpenShift CRD policy). Our build hides the Routes nav item and pages when that API is missing.

**NetworkPolicy permissions.** The bridge calls the API with each user's own token, so users see and create only what their RBAC allows. The plugin Pod needs no ServiceAccount permissions (`automountServiceAccountToken: false`).

## User settings

Apply `user-settings.yaml`. Replace `<console-namespace>` and
`<console-serviceaccount>` with the console Deployment's ServiceAccount. It
creates the `openshift-console-user-settings` namespace and the Role the bridge
needs to store each user's preferences there. Without it, the console still
works, but every page load sends about 30 failing `POST /api/console/user-settings`
calls, and preferences stay in the browser's localStorage. No console restart is
needed.

## Session store

By default the bridge keeps login sessions in memory and names the session
cookie after its Pod, so every rollout or restart signs every user out.
With `BRIDGE_SESSION_SECRET_NAMESPACE` (flag `--session-secret-namespace`,
OIDC only) it also writes each session to a Secret in that namespace and uses
a session cookie name without the Pod name. A new Pod, or another replica,
loads the session from its Secret on the first request and keeps it in memory
after that.

- Apply [`session-store.yaml`](session-store.yaml) after replacing
  `<console-namespace>` and `<console-serviceaccount>`. It creates the
  `console-sessions` namespace and a Role that lets only the console's
  ServiceAccount manage Secrets there. Then set the env var (already in
  [`console-deployment-patch.yaml`](console-deployment-patch.yaml)).
- The cookie keys must stay fixed (`--cookie-encryption-key-file`,
  `--cookie-authentication-key-file`), as they already are for OIDC.
- Each Secret holds the user's ID token and refresh token. Anyone who can read
  Secrets in this namespace can act as those users, so grant no other access
  to it, and make sure etcd encryption at rest covers Secrets.
- Secret names hold only a SHA-256 hash of the session token. The bridge
  deletes a Secret on logout, and every 5 minutes deletes Secrets whose token
  expired without a refresh token or that were not updated for 30 days (the
  cookie lifetime).
- The Secret is the source of truth: a Pod changes a session in memory and in
  the cookies only after the Secret holds the change, and a session without a
  Secret is logged out. API calls never hold up requests that the Pod's memory
  can answer. A session keeps one refresh token ID for its lifetime, so the
  refresh token cookie stays valid whichever replica refreshed last.
- Session Secret calls use their own client limit of 50 QPS (burst 100),
  shared by all users of a Pod, and the API server's priority and fairness.
- If the API server rejects a write, the request fails. A failed login shows
  an error and the user tries again. A failed token refresh signs the user
  out: the identity provider already replaced the refresh token, and the new
  one could not be stored.
- The first rollout with the env var still signs everyone out once: the old
  Pods never wrote their sessions, and the cookie name changes. Later rollouts
  keep users signed in.
- A logout removes the session from the Pod that served it and deletes the
  Secret; on that Pod it waits for any load or token refresh of the same
  session to finish first. Before refreshing a token, a Pod re-reads the session's Secret, and
  token updates never recreate a deleted Secret. So another replica that
  cached the session accepts it only until its access token is due for
  refresh; the browser's cookies are deleted either way. A refresh needs the
  session cookie and its Secret: the refresh token cookie alone never
  refreshes or starts a session. If deleting the
  Secret fails, the bridge logs it and still clears the cookies; a copy of the
  old cookie then keeps working until pruning deletes the Secret.
- Rollback: remove `BRIDGE_SESSION_SECRET_NAMESPACE`. Users sign in once more.
  Then delete the `console-sessions` namespace.

## Recording rules

Apply `monitoring/console-recording-rules.yaml`, a VMRule. Replace
`<monitoring-namespace>` with a namespace the VictoriaMetrics operator watches.
It adds the OpenShift-only recording rules behind the pod, pod-list, project,
cluster and node utilization graphs. Test it with
`monitoring/test-recording-rules.sh` (needs `promtool` and `yq`).

## Monitoring plugin

[openshift/monitoring-plugin](https://github.com/openshift/monitoring-plugin)
provides the Observe pages: Alerting (alerts, silences, alerting rules),
Metrics, Dashboards and Targets. Core has none of them. The image is built from
the pinned `release-5.0` commit by
`.github/workflows/royal-road-monitoring-plugin.yml`
(see `royal-road/plugins/monitoring-plugin/README.md`).

### Deploy

1. Replace the placeholders in `monitoring-plugin.yaml` and apply it. It
   creates the plugin Deployment and Service, the `openshift-config-managed`
   namespace, and a Role that lets the bridge read dashboard ConfigMaps there.
2. Add the plugin to the console Deployment:

   ```yaml
   env:
     - name: BRIDGE_PLUGINS
       value: monitoring-plugin=http://monitoring-plugin.<console-namespace>.svc.cluster.local:9443/
   ```

   `BRIDGE_PLUGINS` is a comma-separated list of `name=url`; append to it if
   other plugins are set. The trailing `/` is required. No `ConsolePlugin`
   resource and no `BRIDGE_PLUGIN_PROXY` entry are needed: the plugin calls
   the bridge's own monitoring proxies, not a backend of its own.
3. Optional: apply `monitoring-dashboard-example.yaml` for a first dashboard.
4. Roll out the console. Check that
   `https://<console-host>/api/plugins/monitoring-plugin/plugin-manifest.json`
   returns JSON and that **Observe** lists Alerting, Metrics, Dashboards and
   Targets.

**Plain HTTP.** The plugin backend serves HTTP on 9443 when it gets no
`-cert`/`-key`. Only the bridge fetches the plugin, inside the cluster, and
browsers get it from the bridge over the console's HTTPS. To use TLS, mount a
cert-manager certificate, pass `-cert`/`-key` (or `CERT_FILE_PATH` /
`PRIVATE_KEY_FILE_PATH`), and switch the URL to `https://`. The issuing CA must
then be in `BRIDGE_SERVICE_CA_FILE`.

### What it calls

| Page | Bridge endpoint | In-cluster target (defaults) |
|---|---|---|
| Alerts, Alerting rules (admin) | `/api/prometheus/api/v1/rules`, `/api/alertmanager/api/v2/silences` | Thanos `:9091`, Alertmanager `:9094` |
| Silences: list, create, expire | `/api/alertmanager/api/v2/silence(s)` (GET, POST, DELETE) | Alertmanager `:9094` |
| Metrics | `/api/prometheus/api/v1/{query,query_range,label/__name__/values,metadata}` | Thanos `:9091` |
| Dashboards | `/api/console/monitoring-dashboard-config`, then queries as Metrics | API server (bridge ServiceAccount), Thanos `:9091` |
| Targets | `/api/prometheus/api/v1/targets`; watches Services, Pods, `ServiceMonitor`, `PodMonitor` | Thanos `:9091`, API server (user token) |
| Any of the above for a user without cluster-wide monitoring access | `/api/prometheus-tenancy/...?namespace=<ns>`, `/api/alertmanager-tenancy/...?namespace=<ns>` | Thanos `:9092` (`:9093` for rules), Alertmanager `:9092` |

The in-cluster hosts are the bridge defaults; "Monitoring endpoints" above
lists the `BRIDGE_*_HOST` variables that change them. The plugin has no monitoring hosts of its own.

**Tenancy.** The plugin decides per user. If a SelfSubjectAccessReview for
`get prometheusrules.monitoring.coreos.com` in all namespaces fails, alerts,
rules and silences use the tenancy paths. If one for `get prometheuses/api`
named `k8s` in all namespaces fails, metrics and dashboards do the same. This
happens in both the admin and the developer perspective. The bridge forwards
the user's token. The tenancy targets must enforce both the namespace (a
prom-label-proxy) and the user's access to it (a kube-rbac-proxy or
similar), as the current `:9092` chain does.

Core's notification drawer still polls `/api/prometheus/api/v1/rules` and
`/api/alertmanager/api/v2/silences` without tenancy for every user. For a
non-admin user those requests fail. The stock console does the same; it is not
caused by the plugin.

### Dashboards

The bridge lists ConfigMaps in `openshift-config-managed` with label
`console.openshift.io/dashboard=true`, using its own ServiceAccount (not the
user's token). The Role in `monitoring-plugin.yaml` grants that. Each ConfigMap
holds one Grafana-format dashboard (old `rows` layout or `panels` with `row`
panels; panel types `graph`, `singlestat`, `gauge`, `table`,
`grafana-piechart-panel`; other types are skipped). Add label
`console.openshift.io/odc-dashboard=true` to also offer a dashboard in the
per-namespace view (developer perspective, Observe > Dashboards). Grafana
dashboards using Grafana-only features (other data sources, transformations,
newer panel types) render partly or not at all.

### Alert source: Platform or User

The Alerts and Alerting rules pages filter on **Source: Platform** by default.
The plugin calls a rule Platform only if it has the label
`prometheus="openshift-monitoring/k8s"`; every other rule is User. Without
that label, the default view is empty and users have to clear the filter.

To make cluster alerts show by default, add that label to the cluster's own
rules (for example in the `labels` of each rule in the VMRule or
PrometheusRule objects), and leave it off application rules. The label must
appear in the `/api/v1/rules` response; external labels added only to fired
alerts are not enough. Tested on kind: a rule with this label shows under the
default filter, others show after selecting User or clearing filters.

### Production checks after cutover

These need the real cluster and can't be checked on kind:

- `/api/v1/rules` and `/api/v1/targets` through the `:9091` chain. With
  VictoriaMetrics, rules come from vmalert (vmselect needs
  `-vmalert.proxyURL`) and targets from vmagent. If either is missing, the
  Alerting rules or Targets page is empty or shows an error.
- Silence create and expire (POST and DELETE) through the `:9094` chain.
- A non-admin user with access to one namespace: Observe in the developer
  perspective returns only that namespace's metrics, alerts and silences,
  and gets an error for namespaces they can't access.
- The `ServiceMonitor` and `PodMonitor` CRDs exist (Targets page links targets
  to them). Without them, Targets still lists targets but can't link monitors.

### Verified on kind (WP4 part B)

kind, kube-prometheus-stack (Prometheus, Alertmanager, operator,
kube-state-metrics), plugin from `monitoring-plugin.yaml`, bridge off-cluster
with `--k8s-mode-off-cluster-thanos` and `--k8s-mode-off-cluster-alertmanager`.

| Need | Result |
|---|---|
| Alerts | Works. Firing test alerts listed; default view needs the Platform label (above). |
| Silences | Works: list, create form; a silence POSTed through `/api/alertmanager` appears. |
| Alerting rules | Works (136 rules, Platform/User source). |
| Metrics query | Works: query browser graph and table, metric name autocomplete. |
| Dashboards | Works: example dashboard with variable, single stat, graph and table panels. |
| Targets | Works: 12 targets with ServiceMonitor and namespace links. |
| Non-admin tenancy | Routing checked: a ServiceAccount with `view` in one namespace gets every plugin request on `/api/prometheus-tenancy` and `/api/alertmanager-tenancy` with `namespace=<ns>`. With a prom-label-proxy as the tenancy target, it saw only that namespace's series, rules and silences. Off-cluster, all tenancy paths go to the one URL given by the `--k8s-mode-off-cluster-*` flags, so the in-cluster `:9092` routing and its RBAC check remain for the production check above. |

## Pipelines plugin

[openshift-pipelines/console-plugin](https://github.com/openshift-pipelines/console-plugin)
provides the Tekton pages (Pipelines, PipelineRuns, Tasks, TaskRuns, Triggers,
the pipeline builder, logs, and PipelineRun decorators in Topology). Console
5.0 removed them from core. The image is built from the pinned `release-5.0`
commit with our patches by `.github/workflows/royal-road-pipelines-plugin.yml`
(see `royal-road/plugins/pipelines-console-plugin/README.md`).

It is **not part of the cutover**. Deploy it once Tekton has a working control
plane: the Pipelines section appears whenever the `tekton.dev` Pipeline CRD
exists, controller or not.

### Deploy

1. Check the build defaults against the cluster (build args, see the plugin
   README): shared Tasks for the pipeline builder in `tekton-catalog`,
   Pipelines-as-Code in `pipelines-as-code`. Rebuild with `--build-arg` if
   either differs.
2. Replace the placeholders in `pipelines-console-plugin.yaml` and apply it.
3. Append the plugin to `BRIDGE_PLUGINS` in the console Deployment:

   ```yaml
   - name: BRIDGE_PLUGINS
     value: <existing plugins>,pipelines-console-plugin=http://pipelines-console-plugin.<console-namespace>.svc.cluster.local:8080/
   ```

   The name before `=` must be `pipelines-console-plugin`, the name the
   plugin's `plugin-manifest.json` declares. The trailing `/` is required. No
   `ConsolePlugin` resource and no `BRIDGE_PLUGIN_PROXY` entry are needed.
4. If the ConsolePlugin CRD is installed (see [Dynamic Plugins page](#dynamic-plugins-page)),
   apply [`pipelines-consoleplugin.yaml`](pipelines-consoleplugin.yaml) so the
   plugin is listed there.
5. Roll out the console. Check that
   `https://<console-host>/api/plugins/pipelines-console-plugin/plugin-manifest.json`
   returns JSON and that **Pipelines** appears in the sidebar.

**Plain HTTP**, for the same reasons as the networking plugin (above).

**Permissions.** Everything goes through the bridge with the user's token.
Users who open the pipeline builder need `list`/`watch` on `tasks.tekton.dev`
in `tekton-catalog` to see the shared Tasks there (for example a RoleBinding to
the `view` ClusterRole or a narrower Role). The cluster resolver reads them
with its own ServiceAccount when the PipelineRun starts.

**EventListeners.** There is no Route API, so **Add Trigger** creates the
TriggerTemplate and EventListener but no Route (patch 0002). Expose the
`el-<name>` Service with an Ingress to receive webhooks.

### Production checks

- Leftover operator objects: `TektonConfig/config` is read only to detect a
  multi-cluster hub. If a `tektonresults.operator.tekton.dev/result` object
  exists but Results isn't actually installed, delete it (see below); otherwise
  the plugin turns on its Results features and every call fails.

### Tekton Results

With [Tekton Results](https://github.com/tektoncd/results) installed, the plugin
lists pruned PipelineRuns and TaskRuns (archive icon), opens their details and
logs, and fills Overview and Metrics from Results summaries instead of showing
"Data is incomplete. To see the full view, please enable Tekton results."

How it connects:

1. **Detection, per user.** The plugin GETs
   `tektonresults.operator.tekton.dev/result` with the signed-in user's token.
   Users who can't read it get the Kubernetes-only pages and the banner. The
   Tekton operator's release manifests bind ClusterRole `tekton-result-read-role`
   (get/list/watch `tektonresults`) to `system:authenticated`; its Helm chart
   does not, so create that binding yourself when the operator came from Helm.
2. **Proxy.** The plugin calls the bridge's
   `/api/dev-console/tekton-results/{get,summary,logs}`. In-cluster, the bridge
   sends the request with the user's token to
   `https://tekton-results-api-service.<spec.targetNamespace>.svc.cluster.local:<spec.server_port, 8080>`
   (`spec.tls_hostname_override` replaces the host), read from that same
   resource with the console's ServiceAccount, which therefore needs get on
   `tektonresults` too.
3. **TLS.** The bridge verifies the Results API certificate with
   `--tekton-results-ca-file` (`BRIDGE_TEKTON_RESULTS_CA_FILE`), default
   `/var/serving-cert/tls.crt`: the service CA on OpenShift. Off OpenShift,
   point it at the CA that signed the Results API certificate, for example a
   ConfigMap with cert-manager's `ca.crt`:

   ```yaml
   env:
     - name: BRIDGE_TEKTON_RESULTS_CA_FILE
       value: /var/tekton-results-ca/ca.crt
   volumeMounts:
     - {name: tekton-results-ca, mountPath: /var/tekton-results-ca, readOnly: true}
   volumes:
     - {name: tekton-results-ca, configMap: {name: tekton-results-ca}}
   ```

   With the wrong CA every call fails with `x509: certificate signed by
   unknown authority` (the bridge log shows it; the plugin shows empty
   history). `--tekton-results-api-host` (`BRIDGE_TEKTON_RESULTS_API_HOST`,
   `host:port`) overrides the address, in-cluster and off-cluster (where the
   bridge otherwise looks for a `route.openshift.io` Route).
4. **Authorization.** The Results API checks each request with a
   SubjectAccessReview on `results.tekton.dev` (`results`, `records`, `logs`,
   `summary`) in the run's namespace. Upstream's ClusterRoles aggregate read
   access into `view` and `edit` and full access into `admin`, so whoever can
   view a namespace sees its history.
5. **User settings.** The PipelineRuns list waits for the user's date-range
   preference; without the `openshift-console-user-settings` namespace
   ([user-settings.yaml](user-settings.yaml)) it never queries Results.

Checked on kind with the Tekton operator (Helm chart 0.81.3, Results v0.20.0,
CloudNativePG database, cert-manager certificate) and the console in-cluster:
pruned runs listed with their logs, Overview without the banner, a user with
`view` in one namespace allowed there and refused elsewhere, and the banner
back when that user can't read the TektonResult resource.

- The Overview page charts need the `tekton_pipelines_controller_*` metrics
  scraped into the monitoring stack and reachable through the tenancy proxy.
- Without internet egress from the console Pod, the builder's ArtifactHub
  results are empty; catalog and namespace Tasks still show.

## Logging plugin

Observe › Logs (admin and developer perspectives) and the Pod "Aggregated Logs" tab, reading VictoriaLogs, from [openshift/logging-view-plugin](https://github.com/openshift/logging-view-plugin) with our patches and `vl-tenancy-proxy`. The build, the patches and the proxy's design are described in `royal-road/plugins/logging-view-plugin/README.md`.

It expects logs shipped like Grafana Alloy's `loki.write` to VictoriaLogs' Loki push API (`/insert/loki/api/v1/push`): stream fields `namespace`, `pod`, `container`, and `level` from alloy-modules' log-levels module. `deployment` / `statefulset` fields are kept but not used by the UI.

### Deploy

1. Apply `logging-view-plugin.yaml` after filling in the placeholders listed at its top: the console namespace and a label on the console pods, the image tag pushed by `.github/workflows/royal-road-logging-view-plugin.yml` (`:main` follows `main`), VictoriaLogs' URL, and VictoriaLogs' namespace and pod label. It creates:
   - a ServiceAccount bound to `system:auth-delegator` (TokenReview, SubjectAccessReview) and allowed to list namespaces;
   - a Deployment with two containers from the same image: `plugin` (static files and `/config`, port 9002) and `vl-tenancy-proxy` (port 8080);
   - a Service with both ports;
   - a NetworkPolicy so that only the console pods reach either port;
   - a NetworkPolicy in VictoriaLogs' namespace that lets the proxy reach VictoriaLogs on 9428. NetworkPolicies add up, so if VictoriaLogs already has an ingress policy that lists its writers (Alloy) and readers (Grafana, ...), this one only adds the proxy. If VictoriaLogs has no ingress policy yet, this one isolates it: list the writers and other readers too, or ingestion stops. You can instead add the proxy as one more `from` entry in the existing policy and skip this object.
2. Add the plugin and its proxy to the console Deployment's container env:

   ```yaml
   - name: BRIDGE_PLUGINS
     value: <other plugins>,logging-view-plugin=http://logging-view-plugin.<console-namespace>.svc.cluster.local:9002/
   - name: BRIDGE_PLUGIN_PROXY
     value: '{"services":[{"consoleAPIPath":"/api/proxy/plugin/logging-view-plugin/backend/","endpoint":"http://logging-view-plugin.<console-namespace>.svc.cluster.local:8080","authorize":true}]}'
   ```

   `consoleAPIPath` must be exactly that: the plugin calls `/api/proxy/plugin/logging-view-plugin/backend/api/logs/v1/<tenant>/select/logsql/...`. `"authorize": true` makes the bridge send the signed-in user's token, which the proxy checks; without it every request gets 401.
3. Roll out the console. Check that `https://<console-host>/api/plugins/logging-view-plugin/config` returns `{"schema":"vlogs",...}` and that Observe › Logs shows log lines.

### Tenants and access

- **Tenant dropdown:** `application` (namespaces not matching `openshift-.*|openshift|default|kube-.*`, plus logs without a `namespace`) and `infrastructure` (the matching ones), as on a LokiStack. The proxy applies it; it isn't part of the query. There is no audit tenant.
- **Who sees what:** users allowed `get pods/log` cluster-wide (cluster-admin, `cluster-reader`-like ClusterRoleBindings) see all namespaces. Everyone else sees the namespaces where they may `get pods/log` (the `view`, `edit` and `admin` roles grant it). Access is re-checked every 30 s.
- **Query language:** LogsQL. The filter bar writes `{ namespace="a", pod=~"b|c" } *"text"* level:~"(?i)^(error|err|eror)$"`; any LogsQL typed in "Show Query" works, and a query ending in `| stats ...` is drawn as a graph.

### Production checks after deploying

- A Dex user with `view` in one namespace: Observe › Logs (developer perspective) shows that namespace; the admin page's `application` tenant shows only that namespace; another namespace's page shows "No datapoints found". The proxy logs one line per query with the user, tenant and scope (`all namespaces` or `N namespaces`).
- Live tail (the ▶ button) streams new lines through the ingress. If it stalls, check that ingress-nginx doesn't buffer the console's responses (`proxy-buffering`) and that its read timeout allows long responses.
- JSON log lines: VictoriaLogs' Loki ingestion parses JSON lines into fields and takes the message only from `_msg`, so lines like `{"level":"info","msg":"..."}` show "missing _msg field" (also in Grafana). Adding `?_msg_field=msg,message,_msg` to Alloy's push URL fixes that at ingestion; it is a VictoriaLogs/Alloy setting, not part of this plugin.

### Verified on kind

kind cluster with VictoriaLogs v1.53.0 (production's version), `logging-view-plugin.yaml` applied with `dev/kind-demo.sh`, about 3,600 lines over two hours pushed with `dev/push-logs.py` (Alloy's labels, klog/zerolog/logfmt/JSON lines, raw level spellings) across `team-a`, `team-b` and `kube-system`, and the console image run off-cluster with `BRIDGE_PLUGINS` and `BRIDGE_PLUGIN_PROXY`.

| Check | Result |
|---|---|
| Observe › Logs, histogram, results | Works (`query`, `hits` by level). |
| Tenant dropdown | `application` → team-a, team-b; `infrastructure` → kube-system. |
| Severity filter | `level:~"(?i)^(...)$"`, chips round-trip from the URL, histogram colours by severity. |
| Content filter | `*"deadline"*` substring match. |
| `| stats by (namespace) count()` | Drawn as a metrics graph (`stats_query_range`). |
| Pod › Aggregated Logs | Works, scoped to `{ pod="...", namespace="..." }`. |
| Developer perspective › Observe › Logs | Works, scoped to the namespace. |
| Live tail | Streams through bridge and proxy (`/select/logsql/tail`). |
| Tenancy | A ServiceAccount with `view` in team-a (bridge run with its token, and directly at the proxy): only team-a, nothing in `infrastructure`, including with `{namespace="team-b"}` in the query, a client-sent `extra_stream_filters`, a `union` subquery, `stream_field_values` and an `AccountID` header. No token or an invalid token: 401. `query_time_range`: 404. Cluster-admin: all namespaces. |
| NetworkPolicies | A pod in another namespace can't reach the proxy or VictoriaLogs; a pod with the console label reaches the proxy; the proxy reaches VictoriaLogs. |

## Web Terminal

Optional, applied separately from the cutover. [`web-terminal/`](web-terminal/README.md)
installs the DevWorkspace and Web Terminal operators through OLM (Manual
approval), a cert-manager CA, and a small routing controller, and sets
`BRIDGE_WEB_TERMINAL_ROUTING_CLASS=web-terminal-k8s` on the console. It needs
an API server change first: OIDC users must have a UID (see
[Prerequisite](web-terminal/README.md#prerequisite-oidc-user-uids)).
## Perses dashboards

Observe › **Dashboards (Perses)** (`/monitoring/v2/dashboards`) is the
`perses-dashboards` feature of openshift/monitoring-plugin. On OpenShift the
Cluster Observability Operator (COO) installs it for a `UIPlugin` of type
Monitoring with `perses.enabled`. Here the same pieces are plain manifests:
`monitoring-console-plugin.yaml` and `perses/` (kustomize). The legacy
Observe › Dashboards page (`monitoring-plugin`, ConfigMaps in
`openshift-config-managed`) stays as it is.

### Versions

The set COO **1.5.2** runs on consoles 4.22 and newer, all public quay.io
images pinned by digest: monitoring-console-plugin v1.0.0, perses-operator
v0.4.0, Perses v0.54.0, CRDs from `deploy/perses/crds/` at tag v1.5.2.
COO 1.4's plugin (v0.5.3) uses react-router 5 and fails on this console with
`(0, r.useHistory) is not a function`; COO 1.5 added a separate plugin build
for consoles ≥ 4.22 (react-router 7, like `release-5.0`).

We run COO's published plugin image unchanged next to our `monitoring-plugin`,
as COO does on OpenShift. It is built with
`CONSOLE_PLUGIN_NAME=monitoring-console-plugin`, which is what the Perses
pages expect: their API path is hard-coded to
`/api/proxy/plugin/monitoring-console-plugin/perses/` and their i18n namespace
to `plugin__monitoring-console-plugin`. Adding `perses-dashboards` to our own
`monitoring-plugin` would need patches for both, so no build change.

### Why not run COO itself

Tried on kind with the upstream operator image (main, 2026-11-13) and
`--openshift.enabled=true` (the UIPlugin controller only runs with it). It
needed, one failure at a time: `config.openshift.io` `APIServer/cluster` (it
exits without OpenShift's TLS profile), `ClusterVersion/version` with a
populated status (it picks plugin images by OpenShift version), a service-CA
serving certificate for itself, OLM's `Subscription` and prometheus-operator
CRDs, and service-CA secrets for every plugin it deploys. It registers plugins
by patching `consoles.operator.openshift.io/cluster`, which our bridge does
not read (`BRIDGE_PLUGINS` does that). `config.openshift.io` and
`operator.openshift.io` are not allowed by FORK.md's CRD policy, and the rest
would be stubs for objects only OpenShift maintains. The manifests here are
what its reconciler creates (`pkg/controllers/uiplugin/monitoring.go`), with
cert-manager instead of the service CA.

### What runs

| Object | Notes |
|---|---|
| `perses/crds/` | `perses.dev` CRDs; v1alpha1 is converted by the operator's webhook (cert-manager injects the CA). |
| `perses/10-certificates.yaml` | namespace-local cert-manager CA; certificates for Perses and the webhook. |
| `perses/20-perses-operator.yaml` | COO's ClusterRole verbatim (its `config.openshift.io/apiservers` rule is unused here). |
| `perses/21-user-roles.yaml` | COO's viewer/editor roles, aggregated: `view` reads dashboards and datasources, `edit` edits dashboards, `admin` edits datasources. Global datasources: cluster-admin only. Plus `create pods.metrics.k8s.io` for view/edit/admin (see below). |
| `perses/30-perses.yaml` | `Perses` CR: Kubernetes authentication (TokenReview) and authorization (SubjectAccessReview), file database on a 1 GiB PVC, TLS. |
| `perses/40-global-datasource.yaml` | `thanos-querier:9091`, no credentials of its own. |
| `perses/namespace-datasource.example.yaml` | one per namespace with dashboards: `thanos-querier:9092/?namespace=<ns>`, the namespace's default. |
| `perses/50-networkpolicy.yaml` | Perses ingress from the console and the operator only; egress to thanos-querier 9091/9092, the API server and DNS only. |

### Security model

- A Perses project is a Kubernetes namespace. Each API call is a
  SubjectAccessReview for the signed-in user on `persesdashboards` /
  `persesdatasources` / `persesglobaldatasources` in that namespace, so the
  project list and dashboard access follow the user's Kubernetes RBAC.
- Perses has no metrics credential. Its datasource proxy forwards the
  user's own bearer token (the bridge's plugin proxy sets it), and
  thanos-querier decides: 9092 runs kube-rbac-proxy (may the user `get
  pods.metrics.k8s.io` in `?namespace=`?) and prom-label-proxy (adds
  `namespace="<ns>"` to every query), so a namespace user sees only their
  namespace's series whatever the dashboard's PromQL says. 9091 is reached
  only through the global datasource, which only cluster-admin may use.
- Perses' Prometheus client sends queries as POST, which kube-rbac-proxy
  checks as verb `create`. `21-user-roles.yaml` grants
  `create pods.metrics.k8s.io` through the aggregated roles; the metrics API
  has no create, so the grant opens nothing else.
- Anyone who may edit a dashboard can put a datasource with any URL into it,
  and viewers' tokens are sent there. On kind, without the NetworkPolicy, a
  cluster-admin opening such a dashboard sent their token to an outside
  host; with it, the request times out. Keep `50-networkpolicy.yaml`.
- The tenancy port's prom-label-proxy must run with `--enable-label-apis`:
  without it `/api/v1/labels` and `/api/v1/label/<name>/values` return 404 and
  every `label_values()` dashboard variable is empty for namespace users.
  OpenShift's tenancy proxy sets it.

### Deploy

1. Create the CA ConfigMap the datasources verify thanos-querier with
   (key `ca.crt`; the CA of the certificate thanos-querier serves):
   `kubectl -n perses create configmap perses-upstream-ca --from-file=ca.crt=<file>`
   (create the `perses` namespace first, or apply `perses/00-namespace.yaml`).
2. Fill the placeholders in `perses/50-networkpolicy.yaml`, then
   `kubectl apply --server-side -k royal-road/deploy/perses/`. CRDs must be
   established before the CRs: if the first apply reports "no matches for
   kind", run it again. Wait for `kubectl -n perses get perses perses` to be
   `Available`.
3. Add `--enable-label-apis` to the tenancy prom-label-proxy.
4. Apply `monitoring-console-plugin.yaml`, and add it to the console:
   - `BRIDGE_PLUGINS`: append
     `monitoring-console-plugin=http://monitoring-console-plugin.<console-namespace>.svc.cluster.local:9443/`
   - `BRIDGE_PLUGIN_PROXY`: `perses/plugin-proxy.sh "<current value>"` prints
     the value with the Perses route added (TLS, the `perses-ca` CA,
     `authorize: true`).
   - optionally the `monitoring-console-plugin` entry of `consoleplugins.yaml`.
5. Apply a `namespace-datasource.example.yaml` copy per namespace that gets
   dashboards, then the `PersesDashboard`s. Check
   `kubectl get persesdashboards -A`: every one `Available=True` (the Perses
   server validates them on sync).

### Verified on kind

kind with cert-manager, a thanos-querier stand-in (VictoriaMetrics single
v1.156.0 scraping kubelet/cAdvisor, kube-state-metrics, node-exporter; 9091
kube-rbac-proxy v0.21.2; 9092 kube-rbac-proxy → prom-label-proxy v0.16.2 with
`--enable-label-apis`, as production should be), the console image running
in-cluster twice with `BRIDGE_USER_AUTH=disabled` (a cluster-admin
ServiceAccount; a ServiceAccount with `edit` in `team-a` and `view` in
`royal-road`), both monitoring plugins, and 29 dashboards migrated from
Grafana and the console's dashboard ConfigMaps.

| Check | Result |
|---|---|
| Observe › Dashboards (Perses) | Listed under Observe next to Dashboards; list, project filter, dashboard view, time range, variables. |
| Dashboards sync | 29/29 `PersesDashboard`s `Available=True`. |
| Cluster-admin | All projects; global and namespace datasources; cluster dashboards with data. |
| Namespace user | Only the `royal-road` dashboards; `openshift-monitoring`: "No Perses Project Available"; global datasources 403; another namespace's datasource 403; queries and `label_values` return only `royal-road` series; Edit disabled with `view`. |
| Datasource proxy | GET and POST queries, `labels`, `label/<n>/values`, `series` through 9092 as the user; same through 9091 as cluster-admin. |
| NetworkPolicy | Dashboard with an embedded datasource pointing outside: blocked (timeout); without the policy the admin's token reached the outside host. |
| Legacy dashboards | Observe › Dashboards (ConfigMaps) unchanged. |
| COO operator | Evaluated and not used, see above. |
