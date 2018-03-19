import { Map as ImmutableMap } from 'immutable';

export const ocsTemplates = ImmutableMap()
  .set('v1alpha1.VaultService', `
    apiVersion: vault.security.coreos.com/v1alpha1
    kind: VaultService
    metadata:
      name: example
    spec:
      nodes: 2
      version: 0.9.1-0
  `).set('v1beta2.EtcdCluster', `
    apiVersion: etcd.database.coreos.com/v1beta2
    kind: EtcdCluster
    metadata:
      name: example
    spec:
      size: 3
      version: 3.1.4
  `).set('v1.Prometheus', `
    apiVersion: monitoring.coreos.com/v1
    kind: Prometheus
    metadata:
      name: example
      labels:
        prometheus: k8s
    spec:
      replicas: 2
      version: v1.7.0
      serviceAccountName: prometheus-k8s
      serviceMonitorSelector:
        matchExpressions:
        - {key: k8s-app, operator: Exists}
      ruleSelector:
        matchLabels:
          role: prometheus-rulefiles
          prometheus: k8s
      resources:
        requests:
          # 2Gi is default, but won't schedule if you don't have a node with >2Gi
          # memory. Modify based on your target and time-series count for
          # production use. This value is mainly meant for demonstration/testing
          # purposes.
          memory: 400Mi
      alerting:
        alertmanagers:
        - namespace: monitoring
          name: alertmanager-main
          port: web
  `).set('v1.ServiceMonitor', `
    apiVersion: monitoring.coreos.com/v1
    kind: ServiceMonitor
    metadata:
      name: example
      labels:
        k8s-app: prometheus
    spec:
      selector:
        matchLabels:
          prometheus: k8s
      namespaceSelector:
        matchNames:
        - monitoring
      endpoints:
      - port: web
        interval: 30s
  `).set('v1.Alertmanager', `
    apiVersion: monitoring.coreos.com/v1
    kind: Alertmanager
    metadata:
      name: alertmanager-main
    spec:
      replicas: 3
  `);
