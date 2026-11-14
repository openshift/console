# Deploying the Royal Road console

Example manifests and instructions for the owner to apply through the
infrastructure repository. Agents do not apply anything from this directory
to the production cluster. Values such as URLs and hostnames are placeholders.

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
     crd/consolelinks.console.openshift.io
   ```

2. Resources that use them, after replacing the placeholders:

   ```sh
   kubectl apply -f royal-road/deploy/ceph-dashboard-consolelink.yaml
   ```

No console restart is needed. The frontend detects the new APIs on the next
page load: `FLAGS.CONSOLE_LINK` turns on and the application menu (grid icon
in the masthead) shows a **Storage › Ceph dashboard** entry. The Helm pages
stop requesting the missing `projecthelmchartrepositories` API, and the
bridge stops logging `Error listing namespace helm chart repositories`.

The frontend reads ConsoleLinks with each user's own token, and installing the
CRD grants nobody read access. `ceph-dashboard-consolelink.yaml` therefore
also binds a read-only `console-extensions-reader` ClusterRole to
`system:authenticated`, which matches what the console-operator does on
OpenShift. Without it only cluster-admins see the link.

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

## Recording rules

Apply `monitoring/console-recording-rules.yaml`, a VMRule. Replace
`<monitoring-namespace>` with a namespace the VictoriaMetrics operator watches.
It adds the OpenShift-only recording rules behind the pod, pod-list, project,
cluster and node utilization graphs. Test it with
`monitoring/test-recording-rules.sh` (needs `promtool` and `yq`).
