# Deploying the Royal Road console

Example manifests and instructions for the owner. Agents do not apply anything
from this directory to the production cluster.

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
