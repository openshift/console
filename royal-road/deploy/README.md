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
